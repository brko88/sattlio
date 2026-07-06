from datetime import datetime, timedelta, timezone, date, time
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.service import Service
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.models.working_hours import WorkingHours
from app.models.special_day import SpecialDay

router = APIRouter(prefix="/api/v1/public", tags=["public"])

TZ = ZoneInfo("Europe/Sarajevo")


class PublicTenantResponse(BaseModel):
    id: int
    name: str
    city: str | None
    address: str | None
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


@router.get("/tenants", response_model=list[PublicTenantResponse])
def get_public_tenants(db: Session = Depends(get_db)):
    tenants = db.query(Tenant).filter(
        Tenant.is_active == True,
        Tenant.verification_status == "verified",
    ).all()
    return tenants


@router.get("/tenants/{tenant_id}/employees", response_model=list[PublicEmployeeResponse])
def get_tenant_public_employees(tenant_id: int, db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.is_deleted == False,
        Employee.is_active == True,
        Employee.allow_self_booking == True,
    ).all()
    return employees


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

    # Provjeri specijalni dan (override standardnog radnog vremena)
    special_day = db.query(SpecialDay).filter(
        SpecialDay.employee_id == employee_id,
        SpecialDay.tenant_id == employee.tenant_id,
        SpecialDay.date == booking_date,
    ).first()

    if special_day is not None:
        if not special_day.is_working_day:
            return {"slots": []}
        # Override radnog vremena sa specijalnim danom
        class OverrideWH:
            start_time = special_day.start_time
            end_time = special_day.end_time
            break_start = None
            break_end = None
            is_working_day = True
        wh = OverrideWH()
    elif wh is None or not wh.is_working_day:
        return {"slots": []}

    # Dohvati slot interval iz tenanta
    from app.models.tenant import Tenant as TenantModel
    tenant_obj = db.query(TenantModel).filter(TenantModel.id == employee.tenant_id).first()
    slot_interval = tenant_obj.slot_duration_minutes if tenant_obj else 30

    # Generišemo slotove u lokalnom vremenu (Europe/Sarajevo)
    slot_start = datetime.combine(booking_date, wh.start_time).replace(tzinfo=TZ)
    work_end = datetime.combine(booking_date, wh.end_time).replace(tzinfo=TZ)
    duration = timedelta(minutes=service.duration_minutes)
    now = datetime.now(TZ)

    # Zauzeti termini iz baze (UTC) konvertujemo u lokalno
    day_start = datetime.combine(booking_date, time.min).replace(tzinfo=TZ)
    day_end = datetime.combine(booking_date, time.max).replace(tzinfo=TZ)

    existing = db.query(Appointment).filter(
        Appointment.employee_id == employee_id,
        Appointment.status.in_(["created", "confirmed"]),
        Appointment.start_time >= day_start.astimezone(timezone.utc),
        Appointment.start_time < day_end.astimezone(timezone.utc),
    ).all()

    booked_slots = []
    for a in existing:
        s = a.start_time if a.start_time.tzinfo else a.start_time.replace(tzinfo=timezone.utc)
        e = a.end_time if a.end_time.tzinfo else a.end_time.replace(tzinfo=timezone.utc)
        booked_slots.append((s.astimezone(TZ), e.astimezone(TZ)))

    # Pauza
    break_start_local = None
    break_end_local = None
    if wh.break_start and wh.break_end:
        break_start_local = datetime.combine(booking_date, wh.break_start).replace(tzinfo=TZ)
        break_end_local = datetime.combine(booking_date, wh.break_end).replace(tzinfo=TZ)

    slots = []
    while slot_start + duration <= work_end:
        slot_end = slot_start + duration

        # Preskoči ako se termin preklapa sa pauzom
        is_in_break = False
        if break_start_local and break_end_local:
            is_in_break = not (slot_end <= break_start_local or slot_start >= break_end_local)

        is_booked = any(
            not (slot_end <= bs or slot_start >= be)
            for bs, be in booked_slots
        )
        if not is_booked and not is_in_break and slot_start > now:
            slots.append(slot_start.astimezone(timezone.utc).isoformat())
        slot_start += timedelta(minutes=slot_interval)

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

    customer = db.query(Customer).filter(
        Customer.tenant_id == employee.tenant_id,
        Customer.email == current_user.email,
    ).first()

    if customer is None:
        customer = Customer(
            tenant_id=employee.tenant_id,
            first_name=current_user.first_name or current_user.email.split("@")[0],
            last_name=current_user.last_name or "",
            email=current_user.email,
        )
        db.add(customer)
        db.flush()

    existing_role = db.query(UserTenantRole).filter(
        UserTenantRole.user_id == current_user.id,
        UserTenantRole.tenant_id == employee.tenant_id,
    ).first()

    if existing_role is None:
        new_role = UserTenantRole(
            user_id=current_user.id,
            tenant_id=employee.tenant_id,
            role="customer",
        )
        db.add(new_role)

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