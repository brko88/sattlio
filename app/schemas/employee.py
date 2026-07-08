from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    tenant_id: int
    first_name: str
    last_name: str
    phone: str | None = None
    email: EmailStr


class EmployeeUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    email: str | None = None
    allow_self_booking: bool | None = None


class EmployeeResponse(BaseModel):
    id: int
    tenant_id: int
    first_name: str
    last_name: str
    phone: str | None
    email: str | None
    is_active: bool
    allow_self_booking: bool

    class Config:
        from_attributes = True
