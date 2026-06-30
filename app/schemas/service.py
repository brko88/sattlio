from pydantic import BaseModel


class ServiceCreate(BaseModel):
    tenant_id: int
    name: str
    description: str | None = None
    duration_minutes: int
    price: float
    color: str | None = None


class ServiceResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    description: str | None
    duration_minutes: int
    price: float
    color: str | None
    is_active: bool

    class Config:
        from_attributes = True