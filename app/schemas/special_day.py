from datetime import date, time

from pydantic import BaseModel


class SpecialDayCreate(BaseModel):
    tenant_id: int
    employee_id: int
    date: date
    is_working_day: bool = False
    start_time: time | None = None
    end_time: time | None = None
    note: str | None = None


class SpecialDayResponse(BaseModel):
    id: int
    tenant_id: int
    employee_id: int
    date: date
    is_working_day: bool
    start_time: time | None
    end_time: time | None
    note: str | None

    class Config:
        from_attributes = True