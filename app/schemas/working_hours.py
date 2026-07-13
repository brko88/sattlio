from datetime import time

from pydantic import BaseModel, Field

from app.schemas.special_day import ConflictingAppointmentInfo


class WorkingHoursCreate(BaseModel):
    tenant_id: int
    employee_id: int
    day_of_week: int  # 0-6
    start_time: time
    end_time: time
    is_working_day: bool = True
    break_start: time | None = None
    break_end: time | None = None
    force: bool = False
    cancellation_reason: str | None = Field(default=None, max_length=300)


class WorkingHoursResponse(BaseModel):
    id: int
    tenant_id: int
    employee_id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_working_day: bool
    break_start: time | None
    break_end: time | None

    class Config:
        from_attributes = True


class WorkingHoursSaveResult(BaseModel):
    saved: bool
    working_hours: WorkingHoursResponse | None = None
    conflicts: list[ConflictingAppointmentInfo] = []