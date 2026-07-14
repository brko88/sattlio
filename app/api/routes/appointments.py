from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import paginate
from app.core.permissions import require_staff
from app.core.scheduling import get_effective_hours
from app.core.security import get_current_user
from app.core.timezone_utils import get_tenant_timezone
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.service import Service
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.core.email import send_appointment_cancelled_email
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, CancelAppointmentRequest, MyAppointmentResponse
from app.schemas.pagination import PaginatedResponse

router = APIRouter(prefix="/api/v1/appointments", tags=["appointments"])


def get_user_role(db: Session, user_id: int, tenant_id: int) -> str | None:
    role = (
        db.query(UserTenantRole)
        .filter(
            UserTenantRole.user_id == user_id,
            UserTenantRole.tenant_id == tenant_id,
        )
        .first()
    )
    return role.role if role else None


def require_can_modify_appointment(db: Session, current_user, appointment, action: str):
    """
    Owner/employee smiju sve. Customer smije samo otkazati SVOJ termin
    (koji je sam kreirao), i ne smije oznaciti termin kao zavrsen.
    """
    role = get_user_role(db, current_user.id, appointment.tenant_id)
    if role is None:
        # 404 (ne 403) namjerno - korisnik bez ikakve veze sa ovim tenant-om
        # ne smije razlikovati "ne postoji" od "postoji, ali nije tvoj",
        # jer bi to otkrilo da neki appointment ID postoji negdje na platformi.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rezervacija ne postoji.",
        )

    if role in ("owner", "employee"):
        return  # osoblje smije sve

    # role == "customer" (ili slicno)
    if action == "complete":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Klijent ne moze oznaciti termin kao zavrsen.",
        )
    if appointment.created_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mozete otkazati samo vlastite rezervacije.",
        )

def check_working_hours(db: Session, tenant_id: int, employee_id: int, start_time: datetime, end_time: datetime):
    # Konvertuj u lokalno vrijeme za provjeru radnog vremena
    tz = get_tenant_timezone(db, tenant_id)
    local_start = start_time.astimezone(tz)
    local_end = end_time.astimezone(tz)

    hours = get_effective_hours(db, tenant_id, employee_id, local_start.date())

    if not hours.is_working_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zaposleni ne radi tog dana.",
        )

    if local_start.time() < hours.start_time or local_end.time() > hours.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Termin je izvan radnog vremena zaposlenog.",
        )

    if hours.break_start and hours.break_end:
        if local_start.time() < hours.break_end and local_end.time() > hours.break_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Termin se preklapa sa pauzom zaposlenog.",
            )


def check_overlap(db: Session, employee_id: int, start_time: datetime, end_time: datetime):
    db.query(Employee).filter(Employee.id == employee_id).with_for_update().first()

    overlapping = (
        db.query(Appointment)
        .filter(
            Appointment.employee_id == employee_id,
            Appointment.status.in_(["created", "confirmed"]),
            Appointment.start_time < end_time,
            Appointment.end_time > start_time,
        )
        .first()
    )

    if overlapping is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Zaposleni je već zauzet u tom terminu.",
        )


@router.get("/my", response_model=list[MyAppointmentResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_ids = db.query(Customer.id).filter(
        Customer.email == current_user.email
    ).all()

    if not customer_ids:
        return []

    ids = [c.id for c in customer_ids]

    appointments = (
        db.query(Appointment)
        .filter(Appointment.customer_id.in_(ids))
        .order_by(Appointment.start_time.desc())
        .all()
    )

    tenants_by_id: dict[int, Tenant] = {}
    result = []
    for a in appointments:
        service = db.query(Service).filter(Service.id == a.service_id).first()
        employee = db.query(Employee).filter(Employee.id == a.employee_id).first()
        if a.tenant_id not in tenants_by_id:
            tenants_by_id[a.tenant_id] = db.query(Tenant).filter(Tenant.id == a.tenant_id).first()
        tenant = tenants_by_id[a.tenant_id]
        result.append({
            "id": a.id,
            "employee_id": a.employee_id,
            "service_id": a.service_id,
            "start_time": a.start_time,
            "end_time": a.end_time,
            "status": a.status,
            "service_name": service.name if service else "—",
            "tenant_name": tenant.name if tenant else "-",
            "employee_name": f"{employee.first_name} {employee.last_name}" if employee else "—",
            "tenant_timezone": tenant.timezone if tenant else "Europe/Sarajevo",
        })

    return result


@router.post("", response_model=AppointmentResponse)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_staff(db, current_user.id, data.tenant_id)

    # Konvertuj u UTC sa timezone info
    if data.start_time.tzinfo is None:
        tz = get_tenant_timezone(db, data.tenant_id)
        start_time = data.start_time.replace(tzinfo=tz).astimezone(timezone.utc)
    else:
        start_time = data.start_time.astimezone(timezone.utc)


    if start_time < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Termin ne može biti kreiran u prošlosti.",
        )

    customer = db.query(Customer).filter(
        Customer.id == data.customer_id, Customer.tenant_id == data.tenant_id
    ).first()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Klijent ne postoji.")

    employee = db.query(Employee).filter(
        Employee.id == data.employee_id, Employee.tenant_id == data.tenant_id
    ).first()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zaposleni ne postoji.")
    if not employee.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zaposleni nije aktivan.")

    service = db.query(Service).filter(
        Service.id == data.service_id, Service.tenant_id == data.tenant_id
    ).first()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usluga ne postoji.")
    if not service.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usluga nije aktivna.")

    end_time = start_time + timedelta(minutes=service.duration_minutes)

    check_working_hours(db, data.tenant_id, data.employee_id, start_time, end_time)
    check_overlap(db, data.employee_id, start_time, end_time)

    new_appointment = Appointment(
        tenant_id=data.tenant_id,
        customer_id=data.customer_id,
        employee_id=data.employee_id,
        service_id=data.service_id,
        created_by_user_id=current_user.id,
        start_time=start_time,
        end_time=end_time,
        status="created",
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return new_appointment


@router.get("", response_model=PaginatedResponse[AppointmentResponse])
def get_appointments(
    tenant_id: int,
    date: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_staff(db, current_user.id, tenant_id)

    query = db.query(Appointment).filter(Appointment.tenant_id == tenant_id)

    if date:
        # Kalendar (dnevni prikaz) salje ovaj filter da ne mora vuci SVE
        # termine tenant-a odjednom - samo termini tog dana (u tenant TZ).
        try:
            day = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Neispravan format datuma. Očekivano: GGGG-MM-DD.",
            )
        tz = get_tenant_timezone(db, tenant_id)
        day_start_utc = datetime.combine(day, time.min, tzinfo=tz).astimezone(timezone.utc)
        day_end_utc = day_start_utc + timedelta(days=1)
        query = query.filter(Appointment.start_time >= day_start_utc, Appointment.start_time < day_end_utc)

    # Najnoviji/nadolazeci prvo - stranica 1 treba biti relevantna, ne
    # najstariji termin ikad zakazan.
    query = query.order_by(Appointment.start_time.desc())
    items, total = paginate(query, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    data: CancelAppointmentRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezervacija ne postoji.")

    require_can_modify_appointment(db, current_user, appointment, "cancel")

    if appointment.status in ("completed", "cancelled", "no_show"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rezervacija sa statusom '{appointment.status}' ne može biti otkazana.",
        )

    role = get_user_role(db, current_user.id, appointment.tenant_id)
    reason = data.reason if data else None
    customer = db.query(Customer).filter(Customer.id == appointment.customer_id).first()

    if role == "customer":
        cancelled_by_type = "customer"
        cancelled_by_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    else:
        cancelled_by_type = data.cancelled_by_type if data else None
        if cancelled_by_type not in ("customer", "staff"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cancelled_by_type mora biti 'customer' ili 'staff'.",
            )
        if cancelled_by_type == "staff":
            cancelled_by_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
        else:
            cancelled_by_name = f"{customer.first_name} {customer.last_name}" if customer else None

    appointment.status = "cancelled"
    appointment.cancelled_by_type = cancelled_by_type
    appointment.cancelled_by_user_id = current_user.id
    appointment.cancelled_by_name = cancelled_by_name
    appointment.cancellation_reason = reason
    appointment.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(appointment)

    if cancelled_by_type == "staff" and customer is not None and customer.email:
        service = db.query(Service).filter(Service.id == appointment.service_id).first()
        tenant = db.query(Tenant).filter(Tenant.id == appointment.tenant_id).first()
        try:
            send_appointment_cancelled_email(
                to_email=customer.email,
                customer_name=f"{customer.first_name} {customer.last_name}",
                service_name=service.name if service else "-",
                tenant_name=tenant.name if tenant else "-",
                start_time=appointment.start_time,
                reason=reason,
                tenant_timezone=tenant.timezone if tenant else "Europe/Sarajevo",
            )
        except Exception as e:
            import logging
            logging.error(f"Appointment cancellation email nije poslan: {e}")

    return appointment


@router.post("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezervacija ne postoji.")

    require_can_modify_appointment(db, current_user, appointment, "complete")

    if appointment.status in ("completed", "cancelled", "no_show"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rezervacija sa statusom '{appointment.status}' ne može biti završena.",
        )

    appointment.status = "completed"
    db.commit()
    db.refresh(appointment)

    return appointment

