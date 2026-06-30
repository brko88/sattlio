from pydantic import BaseModel


class EmployeeCreate(BaseModel):
    tenant_id: int
    first_name: str
    last_name: str
    phone: str | None = None
    email: str | None = None


class EmployeeUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    email: str | None = None


class EmployeeResponse(BaseModel):
    id: int
    tenant_id: int
    first_name: str
    last_name: str
    phone: str | None
    email: str | None
    is_active: bool

    class Config:
        from_attributes = True
