from pydantic import BaseModel


class CustomerCreate(BaseModel):
    tenant_id: int
    first_name: str
    last_name: str
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class CustomerResponse(BaseModel):
    id: int
    tenant_id: int
    first_name: str
    last_name: str
    phone: str | None
    email: str | None
    notes: str | None

    class Config:
        from_attributes = True