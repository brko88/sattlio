from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.service import Service
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.models.working_hours import WorkingHours
from app.schemas.appointment import AppointmentCreate, AppointmentResponse

router = APIRouter(prefix="/api/v1/appointments", tags=["appointments"])


def require_member(db: Session, user_id: int, tenant_id: int):
    role = (
        db.query(UserTenantRole)
        .filter(
            UserTenantRole.user_id == user_id,
            UserTenantRole.tenant_id == tenant_id,
        )
        .first()
    )
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom poslovnom subjektu.",
        )


def check_working_hours(db: Session, tenant_id: int, employee_id: int, start_time: datetime, end_time: datetime):
    day_of_week = start_time.weekday()

    wh = (
        db.query(WorkingHours)
        .filter(
            WorkingHours.tenant_id == tenant_id,
            WorkingHours.employee_id == employee_id,
            WorkingHours.day_of_week == day_of_week,
        )
        .first()
    )

    if wh is None or not wh.is_working_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zaposleni ne radi tog dana.",
        )

    if start_time.time() < wh.start_time or end_time.time() > wh.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Termin je izvan radnog vremena zaposlenog.",
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


@router.get("/my")
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vraća sve rezervacije trenutno ulogovanog korisnika sa nazivima usluge i zaposlenog."""
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

    result = []
    for a in appointments:
        service = db.query(Service).filter(Service.id == a.service_id).first()
        employee = db.query(Employee).filter(Employee.id == a.employee_id).first()
        result.append({
            "id": a.id,
            "employee_id": a.employee_id,
            "service_id": a.service_id,
            "start_time": a.start_time,
            "end_time": a.end_time,
            "status": a.status,
            "service_name": service.name if service else "—",
            "employee_name": f"{employee.first_name} {employee.last_name}" if employee else "—",
        })

    return result


@router.post("", response_model=AppointmentResponse)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_member(db, current_user.id, data.tenant_id)

    if data.start_time.tzinfo is None:
        start_time = data.start_time.replace(tzinfo=timezone.utc)
    else:
        start_time = data.start_time

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


@router.get("", response_model=list[AppointmentResponse])
def get_appointments(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_member(db, current_user.id, tenant_id)

    appointments = (
        db.query(Appointment)
        .filter(Appointment.tenant_id == tenant_id)
        .order_by(Appointment.start_time)
        .all()
    )
    return appointments


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezervacija ne postoji.")

    require_member(db, current_user.id, appointment.tenant_id)

    if appointment.status in ("completed", "cancelled", "no_show"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rezervacija sa statusom '{appointment.status}' ne može biti otkazana.",
        )

    appointment.status = "cancelled"
    db.commit()
    db.refresh(appointment)

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

    require_member(db, current_user.id, appointment.tenant_id)

    if appointment.status in ("completed", "cancelled", "no_show"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rezervacija sa statusom '{appointment.status}' ne može biti završena.",
        )

    appointment.status = "completed"
    db.commit()
    db.refresh(appointment)

    return appointment