from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.email import send_appointment_cancelled_email
from app.core.permissions import require_staff
from app.core.scheduling import find_weekly_conflicting_appointments
from app.core.security import get_current_user
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.service import Service
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.models.working_hours import WorkingHours
from app.schemas.special_day import ConflictingAppointmentInfo
from app.schemas.working_hours import WorkingHoursCreate, WorkingHoursResponse, WorkingHoursSaveResult

router = APIRouter(prefix="/api/v1/working-hours", tags=["working-hours"])


def require_can_manage_hours(db: Session, current_user: User, tenant_id: int, employee_id: int):
    """
    Owner smije upravljati radnim vremenom bilo kog zaposlenog.
    Employee smije upravljati SAMO svojim radnim vremenom, i samo ako
    mu je vlasnik dodijelio can_manage_own_hours dozvolu.
    """
    role = db.query(UserTenantRole).filter(
        UserTenantRole.user_id == current_user.id,
        UserTenantRole.tenant_id == tenant_id,
    ).first()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom poslovnom subjektu.",
        )
    if role.role == "owner":
        return

    employee = db.query(Employee).filter(
        Employee.id == employee_id, Employee.tenant_id == tenant_id
    ).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zaposleni nije pronađen.")

    if role.role != "employee" or employee.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Možete upravljati samo svojim radnim vremenom.",
        )
    if not employee.can_manage_own_hours:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu da mijenjate svoje radno vrijeme. Obratite se vlasniku.",
        )


@router.post("", response_model=WorkingHoursSaveResult)
def create_or_update_working_hours(
    data: WorkingHoursCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_can_manage_hours(db, current_user, data.tenant_id, data.employee_id)

    # Provjeri validnost pauze
    if data.break_start and data.break_end:
        if data.break_start >= data.break_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Početak pauze mora biti prije kraja pauze.",
            )
        if data.break_start < data.start_time or data.break_end > data.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pauza mora biti unutar radnog vremena.",
            )

    conflicting = find_weekly_conflicting_appointments(
        db, data.tenant_id, data.employee_id, data.day_of_week,
        data.is_working_day, data.start_time, data.end_time,
        data.break_start, data.break_end,
    )

    if conflicting and not data.force:
        customers = {c.id: c for c in db.query(Customer).filter(
            Customer.id.in_([a.customer_id for a in conflicting])
        ).all()}
        services = {s.id: s for s in db.query(Service).filter(
            Service.id.in_([a.service_id for a in conflicting])
        ).all()}
        return WorkingHoursSaveResult(
            saved=False,
            conflicts=[
                ConflictingAppointmentInfo(
                    id=a.id,
                    start_time=a.start_time,
                    end_time=a.end_time,
                    customer_name=(
                        f"{customers[a.customer_id].first_name} {customers[a.customer_id].last_name}"
                        if a.customer_id in customers else "—"
                    ),
                    customer_phone=customers[a.customer_id].phone if a.customer_id in customers else None,
                    customer_has_email=bool(customers[a.customer_id].email) if a.customer_id in customers else False,
                    service_name=services[a.service_id].name if a.service_id in services else "—",
                )
                for a in conflicting
            ],
        )

    existing = db.query(WorkingHours).filter(
        WorkingHours.tenant_id == data.tenant_id,
        WorkingHours.employee_id == data.employee_id,
        WorkingHours.day_of_week == data.day_of_week,
    ).first()

    if existing:
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        existing.is_working_day = data.is_working_day
        existing.break_start = data.break_start
        existing.break_end = data.break_end
        saved_wh = existing
    else:
        saved_wh = WorkingHours(
            tenant_id=data.tenant_id,
            employee_id=data.employee_id,
            day_of_week=data.day_of_week,
            start_time=data.start_time,
            end_time=data.end_time,
            is_working_day=data.is_working_day,
            break_start=data.break_start,
            break_end=data.break_end,
        )
        db.add(saved_wh)

    reason = data.cancellation_reason or "Promjena radnog vremena"
    cancelled_by_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email

    for a in conflicting:
        a.status = "cancelled"
        a.cancelled_by_type = "staff"
        a.cancelled_by_user_id = current_user.id
        a.cancelled_by_name = cancelled_by_name
        a.cancellation_reason = reason
        a.cancelled_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except IntegrityError:
        # Rijedak race - dva paralelna zahtjeva za isti tenant/employee/dan
        # oba prosla provjeru "existing" prije nego je ijedan commitovao.
        # DB unique constraint je posljednja linija odbrane.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Radno vrijeme za ovaj dan je upravo sačuvano iz drugog zahtjeva. Osvježite stranicu i pokušajte ponovo.",
        )
    db.refresh(saved_wh)

    notified_info = []
    if conflicting:
        tenant = db.query(Tenant).filter(Tenant.id == data.tenant_id).first()
        customers = {c.id: c for c in db.query(Customer).filter(
            Customer.id.in_([a.customer_id for a in conflicting])
        ).all()}
        services = {s.id: s for s in db.query(Service).filter(
            Service.id.in_([a.service_id for a in conflicting])
        ).all()}
        for a in conflicting:
            customer = customers.get(a.customer_id)
            service = services.get(a.service_id)
            if customer is not None and customer.email:
                try:
                    send_appointment_cancelled_email(
                        to_email=customer.email,
                        customer_name=f"{customer.first_name} {customer.last_name}",
                        service_name=service.name if service else "-",
                        tenant_name=tenant.name if tenant else "-",
                        start_time=a.start_time,
                        reason=reason,
                    )
                except Exception as e:
                    import logging
                    logging.error(f"Appointment cancellation email nije poslan: {e}")
            notified_info.append(ConflictingAppointmentInfo(
                id=a.id,
                start_time=a.start_time,
                end_time=a.end_time,
                customer_name=f"{customer.first_name} {customer.last_name}" if customer else "—",
                customer_phone=customer.phone if customer else None,
                customer_has_email=bool(customer and customer.email),
                service_name=service.name if service else "—",
            ))

    return WorkingHoursSaveResult(saved=True, working_hours=saved_wh, conflicts=notified_info)


@router.get("", response_model=list[WorkingHoursResponse])
def get_working_hours(
    tenant_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_staff(db, current_user.id, tenant_id)

    hours = db.query(WorkingHours).filter(
        WorkingHours.tenant_id == tenant_id,
        WorkingHours.employee_id == employee_id,
    ).order_by(WorkingHours.day_of_week).all()

    return hours


@router.delete("/{working_hours_id}")
def delete_working_hours(
    working_hours_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wh = db.query(WorkingHours).filter(WorkingHours.id == working_hours_id).first()
    if wh is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Radno vrijeme nije pronađeno.")

    require_can_manage_hours(db, current_user, wh.tenant_id, wh.employee_id)

    db.delete(wh)
    db.commit()
    return {"detail": "Obrisano."}