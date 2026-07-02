from datetime import datetime, timedelta, timezone, date, time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.appointment import Appointment
from app.models.employee import Employee
from app.models.service import Service
from app.models.tenant import Tenant
from app.models.user import User
from app.models.working_hours import WorkingHours

router = APIRouter(prefix="/api/v1/public", tags=["public"])


class PublicTenantResponse(BaseModel):
    id: int
    name: str
    city: str | None
    business_category: str | None
    description: str | None

    class Config:
        from_attributes = True


class PublicEmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    allow_self_booking: bool

    class Config:
        from_attributes = True


class PublicServiceResponse(BaseModel):
    id: int
    name: str
    duration_minutes: int
    price: float

    class Config:
        from_attributes = True


class SelfBookingCreate(BaseModel):
    employee_id: int
    service_id: int
    start_time: datetime


class SelfBookingResponse(BaseModel):
    id: int
    employee_id: int
    service_id: int
    start_time: datetime
    end_time: datetime
    status: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Javni listing salona
# ---------------------------------------------------------------------------

@router.get("/tenants", response_model=list[PublicTenantResponse])
def get_public_tenants(db: Session = Depends(get_db)):
    """Vraća sve aktivne i verificirane salone."""
    tenants = db.query(Tenant).filter(
        Tenant.is_active == True,
        Tenant.verification_status == "verified",
    ).all()
    return tenants


# ---------------------------------------------------------------------------
# Zaposleni po tenantu (filtrirani)
# ---------------------------------------------------------------------------

@router.get("/tenants/{tenant_id}/employees", response_model=list[PublicEmployeeResponse])
def get_tenant_public_employees(tenant_id: int, db: Session = Depends(get_db)):
    """Vraća zaposlene koji primaju online rezervacije za određeni salon."""
    employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_deleted == False,
        Employee.is_active == True,
        Employee.allow_self_booking == True,
    ).all()
    return employees


# ---------------------------------------------------------------------------
# Stare rute (zadržane za kompatibilnost)
# ---------------------------------------------------------------------------

@router.get("/employees", response_model=list[PublicEmployeeResponse])
def get_all_public_employees(db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(
        Employee.is_deleted == False,
        Employee.is_active == True,
        Employee.allow_self_booking == True,
    ).all()
    return employees


@router.get("/employees/{employee_id}", response_model=PublicEmployeeResponse)
def get_public_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_deleted == False,
        Employee.is_active == True,
        Employee.allow_self_booking == True,
    ).first()

    if employee is None:
        raise HTTPException(status_code=404, detail="Zaposleni nije dostupan za online rezervaciju.")

    return employee


@router.get("/employees/{employee_id}/services", response_model=list[PublicServiceResponse])
def get_public_services(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_deleted == False,
        Employee.is_active == True,
        Employee.allow_self_booking == True,
    ).first()

    if employee is None:
        raise HTTPException(status_code=404, detail="Zaposleni nije dostupan za online rezervaciju.")

    services = db.query(Service).filter(
        Service.tenant_id == employee.tenant_id,
        Service.is_active == True,
    ).all()

    return services


@router.get("/employees/{employee_id}/slots")
def get_available_slots(
    employee_id: int,
    date_str: str,
    service_id: int,
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_deleted == False,
        Employee.is_active == True,
        Employee.allow_self_booking == True,
    ).first()

    if employee is None:
        raise HTTPException(status_code=404, detail="Zaposleni nije dostupan.")

    service = db.query(Service).filter(
        Service.id == service_id,
        Service.tenant_id == employee.tenant_id,
        Service.is_active == True,
    ).first()

    if service is None:
        raise HTTPException(status_code=404, detail="Usluga nije pronađena.")

    try:
        booking_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Neispravan format datuma. Koristite YYYY-MM-DD.")

    day_of_week = booking_date.weekday()

    wh = db.query(WorkingHours).filter(
        WorkingHours.employee_id == employee_id,
        WorkingHours.tenant_id == employee.tenant_id,
        WorkingHours.day_of_week == day_of_week,
    ).first()

    if wh is None or not wh.is_working_day:
        return {"slots": []}

    existing = db.query(Appointment).filter(
        Appointment.employee_id == employee_id,
        Appointment.status.in_(["created", "confirmed"]),
        Appointment.start_time >= datetime.combine(booking_date, time.min).replace(tzinfo=timezone.utc),
        Appointment.start_time < datetime.combine(booking_date, time.max).replace(tzinfo=timezone.utc),
    ).all()

    booked_slots = [(
        a.start_time.replace(tzinfo=timezone.utc) if a.start_time.tzinfo is None else a.start_time,
        a.end_time.replace(tzinfo=timezone.utc) if a.end_time.tzinfo is None else a.end_time
    ) for a in existing]

    slots = []
    slot_start = datetime.combine(booking_date, wh.start_time).replace(tzinfo=timezone.utc)
    work_end = datetime.combine(booking_date, wh.end_time).replace(tzinfo=timezone.utc)
    duration = timedelta(minutes=service.duration_minutes)
    now = datetime.now(timezone.utc)

    while slot_start + duration <= work_end:
        slot_end = slot_start + duration
        is_booked = any(
            not (slot_end <= bs or slot_start >= be)
            for bs, be in booked_slots
        )
        if not is_booked and slot_start > now:
            slots.append(slot_start.isoformat())
        slot_start += timedelta(minutes=30)

    return {"slots": slots}


@router.post("/appointments", response_model=SelfBookingResponse)
def self_book_appointment(
    data: SelfBookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = db.query(Employee).filter(
        Employee.id == data.employee_id,
        Employee.is_deleted == False,
        Employee.is_active == True,
        Employee.allow_self_booking == True,
    ).first()

    if employee is None:
        raise HTTPException(status_code=404, detail="Zaposleni nije dostupan za online rezervaciju.")

    service = db.query(Service).filter(
        Service.id == data.service_id,
        Service.tenant_id == employee.tenant_id,
        Service.is_active == True,
    ).first()

    if service is None:
        raise HTTPException(status_code=404, detail="Usluga nije pronađena.")

    start_time = data.start_time
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    if start_time < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Termin ne može biti u prošlosti.")

    end_time = start_time + timedelta(minutes=service.duration_minutes)

    db.query(Employee).filter(Employee.id == data.employee_id).with_for_update().first()

    overlapping = db.query(Appointment).filter(
        Appointment.employee_id == data.employee_id,
        Appointment.status.in_(["created", "confirmed"]),
        Appointment.start_time < end_time,
        Appointment.end_time > start_time,
    ).first()

    if overlapping:
        raise HTTPException(status_code=409, detail="Termin je već zauzet.")

    from app.models.customer import Customer
    customer = db.query(Customer).filter(
        Customer.tenant_id == employee.tenant_id,
        Customer.email == current_user.email,
    ).first()

    if customer is None:
        customer = Customer(
            tenant_id=employee.tenant_id,
            first_name=current_user.email.split("@")[0],
            last_name="",
            email=current_user.email,
        )
        db.add(customer)
        db.flush()

    new_appointment = Appointment(
        tenant_id=employee.tenant_id,
        customer_id=customer.id,
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