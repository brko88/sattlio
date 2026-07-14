from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.email import send_appointment_cancelled_email
from app.core.permissions import require_staff
from app.core.security import get_current_user
from app.core.timezone_utils import get_tenant_timezone
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.service import Service
from app.models.special_day import SpecialDay
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.special_day import (
    ConflictingAppointmentInfo,
    SpecialDayCreate,
    SpecialDayResponse,
    SpecialDaySaveResult,
)

router = APIRouter(prefix="/api/v1/special-days", tags=["special-days"])


def find_conflicting_appointments(
    db: Session, tenant_id: int, employee_id: int, target_date, is_working_day: bool, start_time, end_time,
    break_start=None, break_end=None,
) -> list[Appointment]:
    """
    Vraća sve aktivne termine tog zaposlenog na dati datum koji NE STAJU
    u novo (predloženo) radno vrijeme - bilo zato što je dan sad slobodan,
    prozor uži nego prije, ili termin upada u novu pauzu.
    """
    tz = get_tenant_timezone(db, tenant_id)
    day_start_utc = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=tz).astimezone(timezone.utc)
    day_end_utc = day_start_utc + timedelta(days=1)

    appointments = db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.employee_id == employee_id,
        Appointment.status.in_(["created", "confirmed"]),
        Appointment.start_time >= day_start_utc,
        Appointment.start_time < day_end_utc,
    ).all()

    conflicts = []
    for a in appointments:
        local_start = a.start_time.replace(tzinfo=timezone.utc).astimezone(tz)
        local_end = a.end_time.replace(tzinfo=timezone.utc).astimezone(tz)
        if not is_working_day:
            conflicts.append(a)
        elif local_start.time() < start_time or local_end.time() > end_time:
            conflicts.append(a)
        elif break_start and break_end and local_start.time() < break_end and local_end.time() > break_start:
            conflicts.append(a)
    return conflicts


def require_can_manage_hours(db: Session, current_user: User, tenant_id: int, employee_id: int):
    """
    Owner smije upravljati specijalnim danima bilo kog zaposlenog.
    Employee smije upravljati SAMO svojim, i samo ako mu je vlasnik
    dodijelio can_manage_own_hours dozvolu.
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


@router.post("", response_model=SpecialDaySaveResult)
def create_special_day(
    data: SpecialDayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_can_manage_hours(db, current_user, data.tenant_id, data.employee_id)

    if data.is_working_day:
        if not data.start_time or not data.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Za radni dan morate unijeti radno vrijeme.",
            )
        if data.start_time >= data.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Početak mora biti prije kraja radnog vremena.",
            )
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

    conflicting = find_conflicting_appointments(
        db, data.tenant_id, data.employee_id, data.date, data.is_working_day, data.start_time, data.end_time,
        data.break_start, data.break_end,
    )

    if conflicting and not data.force:
        customers = {c.id: c for c in db.query(Customer).filter(
            Customer.id.in_([a.customer_id for a in conflicting])
        ).all()}
        services = {s.id: s for s in db.query(Service).filter(
            Service.id.in_([a.service_id for a in conflicting])
        ).all()}
        return SpecialDaySaveResult(
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

    # Ako već postoji za taj datum i zaposlenog — ažuriraj
    existing = db.query(SpecialDay).filter(
        SpecialDay.tenant_id == data.tenant_id,
        SpecialDay.employee_id == data.employee_id,
        SpecialDay.date == data.date,
    ).first()

    if existing:
        existing.is_working_day = data.is_working_day
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        existing.break_start = data.break_start
        existing.break_end = data.break_end
        existing.note = data.note
        saved_sd = existing
    else:
        saved_sd = SpecialDay(
            tenant_id=data.tenant_id,
            employee_id=data.employee_id,
            date=data.date,
            is_working_day=data.is_working_day,
            start_time=data.start_time,
            end_time=data.end_time,
            break_start=data.break_start,
            break_end=data.break_end,
            note=data.note,
        )
        db.add(saved_sd)

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
        # Rijedak race - dva paralelna zahtjeva za isti tenant/employee/datum
        # oba prosla provjeru "existing" prije nego je ijedan commitovao.
        # DB unique constraint je posljednja linija odbrane.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Specijalni dan je upravo sačuvan iz drugog zahtjeva. Osvježite stranicu i pokušajte ponovo.",
        )
    db.refresh(saved_sd)

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
                        tenant_timezone=tenant.timezone if tenant else "Europe/Sarajevo",
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

    return SpecialDaySaveResult(saved=True, special_day=saved_sd, conflicts=notified_info)


@router.get("", response_model=list[SpecialDayResponse])
def get_special_days(
    tenant_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_staff(db, current_user.id, tenant_id)

    days = db.query(SpecialDay).filter(
        SpecialDay.tenant_id == tenant_id,
        SpecialDay.employee_id == employee_id,
    ).order_by(SpecialDay.date).all()

    return days


@router.delete("/{special_day_id}")
def delete_special_day(
    special_day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sd = db.query(SpecialDay).filter(SpecialDay.id == special_day_id).first()
    if sd is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nije pronađeno.")

    require_can_manage_hours(db, current_user, sd.tenant_id, sd.employee_id)

    db.delete(sd)
    db.commit()
    return {"detail": "Obrisano."}