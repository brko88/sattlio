from datetime import date, datetime, time

from pydantic import BaseModel


class SpecialDayCreate(BaseModel):
    tenant_id: int
    employee_id: int
    date: date
    is_working_day: bool = False
    start_time: time | None = None
    end_time: time | None = None
    break_start: time | None = None
    break_end: time | None = None
    note: str | None = None
    force: bool = False
    cancellation_reason: str | None = None


class SpecialDayResponse(BaseModel):
    id: int
    tenant_id: int
    employee_id: int
    date: date
    is_working_day: bool
    start_time: time | None
    end_time: time | None
    break_start: time | None
    break_end: time | None
    note: str | None

    class Config:
        from_attributes = True


class ConflictingAppointmentInfo(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime
    customer_name: str
    customer_phone: str | None
    customer_has_email: bool
    service_name: str


class SpecialDaySaveResult(BaseModel):
    saved: bool
    special_day: SpecialDayResponse | None = None
    conflicts: list[ConflictingAppointmentInfo] = []