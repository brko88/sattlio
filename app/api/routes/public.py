from datetime import datetime, timedelta, timezone, date, time

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.plans import PLANS
from app.core.scheduling import get_effective_hours
from app.core.security import get_current_user
from app.core.timezone_utils import get_tenant_timezone, zoneinfo_for_tenant
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.platform_announcement import PlatformAnnouncement
from app.models.service import Service
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole

router = APIRouter(prefix="/api/v1/public", tags=["public"])

# Anti-abuse limiti za self-booking (vidi memory: project_critical_security_todos #12)
MAX_ACTIVE_APPOINTMENTS_PER_TENANT = 5
MAX_BOOKING_DAYS_AHEAD = 90


class PublicTenantResponse(BaseModel):
    id: int
    name: str
    city: str | None
    address: str | None
    business_category: str | None
    description: str | None
    logo_url: str | None
    cover_url: str | None

    class Config:
        from_attributes = True


class PublicEmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    allow_self_booking: bool
    avatar_url: str | None
    tenant_timezone: str | None = None

    class Config:
        from_attributes = True


class PublicServiceResponse(BaseModel):
    id: int
    name: str
    duration_minutes: int
    price: float

    class Config:
        from_attributes = True


class PlanResponse(BaseModel):
    key: str
    name: str
    price_bam: float | None
    price_label: str
    employee_limit: int | None
    employee_limit_label: str
    location_limit_label: str
    description: str
    features: list[str]
    excluded: list[str]
    highlighted: bool
    cta_label: str

    class Config:
        from_attributes = True


class PublicAnnouncementResponse(BaseModel):
    kind: str
    message: str

    class Config:
        from_attributes = True


class SelfBookingCreate(BaseModel):
    employee_id: int
    service_id: int
    start_time: datetime
    note: str | None = Field(default=None, max_length=300)


class SelfBookingResponse(BaseModel):
    id: int
    employee_id: int
    service_id: int
    start_time: datetime
    end_time: datetime
    status: str
    notes: str | None

    class Config:
        from_attributes = True


@router.get("/plans", response_model=list[PlanResponse])
def get_public_plans():
    return [plan for key, plan in PLANS.items() if key != "trial"]


@router.get("/announcements", response_model=list[PublicAnnouncementResponse])
def get_active_announcements(db: Session = Depends(get_db)):
    return db.query(PlatformAnnouncement).filter(PlatformAnnouncement.is_active == True).order_by(PlatformAnnouncement.id).all()


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

    tenant = db.query(Tenant).filter(Tenant.id == employee.tenant_id).first()
    employee.tenant_timezone = tenant.timezone if tenant else "Europe/Sarajevo"

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

    hours = get_effective_hours(db, employee.tenant_id, employee_id, booking_date)
    if not hours.is_working_day:
        return {"slots": []}

    # Dohvati slot interval i vremensku zonu iz tenanta
    from app.models.tenant import Tenant as TenantModel
    tenant_obj = db.query(TenantModel).filter(TenantModel.id == employee.tenant_id).first()
    slot_interval = tenant_obj.slot_duration_minutes if tenant_obj else 30
    tz = zoneinfo_for_tenant(tenant_obj)

    # Generišemo slotove u lokalnom vremenu tenant-a
    slot_start = datetime.combine(booking_date, hours.start_time).replace(tzinfo=tz)
    work_end = datetime.combine(booking_date, hours.end_time).replace(tzinfo=tz)
    duration = timedelta(minutes=service.duration_minutes)
    now = datetime.now(tz)

    # Zauzeti termini iz baze (UTC) konvertujemo u lokalno
    day_start = datetime.combine(booking_date, time.min).replace(tzinfo=tz)
    day_end = datetime.combine(booking_date, time.max).replace(tzinfo=tz)

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
        booked_slots.append((s.astimezone(tz), e.astimezone(tz)))

    # Pauza
    break_start_local = None
    break_end_local = None
    if hours.break_start and hours.break_end:
        break_start_local = datetime.combine(booking_date, hours.break_start).replace(tzinfo=tz)
        break_end_local = datetime.combine(booking_date, hours.break_end).replace(tzinfo=tz)

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
@limiter.limit("10/30 seconds")
def self_book_appointment(
    request: Request,
    data: SelfBookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Morate potvrditi email adresu prije nego što možete rezervisati termin.",
        )

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

    tz = get_tenant_timezone(db, employee.tenant_id)

    start_time = data.start_time
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=tz).astimezone(timezone.utc)
    else:
        start_time = start_time.astimezone(timezone.utc)

    if start_time < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Termin ne može biti u prošlosti.")

    if start_time > datetime.now(timezone.utc) + timedelta(days=MAX_BOOKING_DAYS_AHEAD):
        raise HTTPException(
            status_code=400,
            detail=f"Termin ne može biti zakazan više od {MAX_BOOKING_DAYS_AHEAD} dana unaprijed.",
        )

    # Anti-abuse: klijent smije imati najviše N AKTIVNIH (created/confirmed) termina
    # u ovom salonu istovremeno - sprječava da jedan nalog zauzme cijeli kalendar
    # rezervišući desetine termina koje nikad ne planira iskoristiti.
    existing_customer = db.query(Customer).filter(
        Customer.tenant_id == employee.tenant_id,
        Customer.email == current_user.email,
    ).first()
    if existing_customer is not None:
        active_count = db.query(Appointment).filter(
            Appointment.tenant_id == employee.tenant_id,
            Appointment.customer_id == existing_customer.id,
            Appointment.status.in_(["created", "confirmed"]),
        ).count()
        if active_count >= MAX_ACTIVE_APPOINTMENTS_PER_TENANT:
            raise HTTPException(
                status_code=400,
                detail=f"Imate maksimalan broj aktivnih rezervacija ({MAX_ACTIVE_APPOINTMENTS_PER_TENANT}) u ovom salonu. "
                       "Otkažite ili sačekajte da neki termin prođe prije nove rezervacije.",
            )

    end_time = start_time + timedelta(minutes=service.duration_minutes)

    local_start = start_time.astimezone(tz)
    local_end = end_time.astimezone(tz)
    hours = get_effective_hours(db, employee.tenant_id, data.employee_id, local_start.date())

    if not hours.is_working_day:
        raise HTTPException(status_code=400, detail="Zaposleni ne radi tog dana.")
    if local_start.time() < hours.start_time or local_end.time() > hours.end_time:
        raise HTTPException(status_code=400, detail="Termin je izvan radnog vremena zaposlenog.")
    if hours.break_start and hours.break_end:
        if local_start.time() < hours.break_end and local_end.time() > hours.break_start:
            raise HTTPException(status_code=400, detail="Termin se preklapa sa pauzom zaposlenog.")

    db.query(Employee).filter(Employee.id == data.employee_id).with_for_update().first()

    overlapping = db.query(Appointment).filter(
        Appointment.employee_id == data.employee_id,
        Appointment.status.in_(["created", "confirmed"]),
        Appointment.start_time < end_time,
        Appointment.end_time > start_time,
    ).first()

    if overlapping:
        raise HTTPException(status_code=409, detail="Termin je već zauzet.")

    customer = existing_customer
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
        notes=data.note,
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return new_appointment

class PublicTenantDetailResponse(BaseModel):
    id: int
    name: str
    slug: str
    city: str | None
    address: str | None
    phone: str | None
    email: str | None
    business_category: str | None
    description: str | None
    logo_url: str | None
    cover_url: str | None
    employees: list[PublicEmployeeResponse]
    services: list[PublicServiceResponse]

    class Config:
        from_attributes = True


@router.get("/tenants/by-slug/{slug}", response_model=PublicTenantDetailResponse)
def get_tenant_by_slug(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(
        Tenant.slug == slug,
        Tenant.is_active == True,
        Tenant.verification_status == "verified",
    ).first()

    if tenant is None:
        raise HTTPException(status_code=404, detail="Salon nije pronadjen.")

    employees = db.query(Employee).filter(
        Employee.tenant_id == tenant.id,
        Employee.is_deleted == False,
        Employee.is_active == True,
        Employee.allow_self_booking == True,
    ).all()

    services = db.query(Service).filter(
        Service.tenant_id == tenant.id,
        Service.is_active == True,
    ).all()

    tenant.employees = employees
    tenant.services = services

    return tenant
