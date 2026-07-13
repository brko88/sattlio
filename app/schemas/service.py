from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    tenant_id: int
    name: str = Field(max_length=60)
    description: str | None = None
    duration_minutes: int
    price: float
    color: str | None = None


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=60)
    description: str | None = None
    duration_minutes: int | None = None
    price: float | None = None
    color: str | None = None
    is_active: bool | None = None


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