from datetime import datetime

from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    tenant_id: int
    customer_id: int
    employee_id: int
    service_id: int
    start_time: datetime


class CancelAppointmentRequest(BaseModel):
    cancelled_by_type: str | None = None  # "customer" ili "staff" - obavezno kad otkazuje owner/employee
    reason: str | None = Field(default=None, max_length=300)


class AppointmentResponse(BaseModel):
    id: int
    tenant_id: int
    customer_id: int
    employee_id: int
    service_id: int
    start_time: datetime
    end_time: datetime
    status: str
    notes: str | None
    cancelled_by_type: str | None
    cancelled_by_name: str | None
    cancellation_reason: str | None
    cancelled_at: datetime | None

    class Config:
        from_attributes = True


class MyAppointmentResponse(BaseModel):
    id: int
    employee_id: int
    service_id: int
    start_time: datetime
    end_time: datetime
    status: str
    service_name: str
    employee_name: str

    class Config:
        from_attributes = True