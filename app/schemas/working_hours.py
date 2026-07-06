from datetime import time

from pydantic import BaseModel


class WorkingHoursCreate(BaseModel):
    tenant_id: int
    employee_id: int
    day_of_week: int  # 0-6
    start_time: time
    end_time: time
    is_working_day: bool = True
    break_start: time | None = None
    break_end: time | None = None


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