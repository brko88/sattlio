from pydantic import BaseModel, EmailStr, Field


class EmployeeCreate(BaseModel):
    tenant_id: int
    first_name: str = Field(max_length=30)
    last_name: str = Field(max_length=30)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr


class EmployeeUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=30)
    last_name: str | None = Field(default=None, max_length=30)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = None
    allow_self_booking: bool | None = None
    can_manage_own_hours: bool | None = None


class EmployeeResponse(BaseModel):
    id: int
    tenant_id: int
    user_id: int | None
    first_name: str
    last_name: str
    phone: str | None
    email: str | None
    is_active: bool
    allow_self_booking: bool
    can_manage_own_hours: bool
    avatar_url: str | None

    class Config:
        from_attributes = True
