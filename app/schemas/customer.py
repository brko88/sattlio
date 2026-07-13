from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    tenant_id: int
    first_name: str = Field(max_length=30)
    last_name: str = Field(max_length=30)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = None
    notes: str | None = Field(default=None, max_length=300)


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