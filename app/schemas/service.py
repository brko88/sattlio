from pydantic import BaseModel, Field


# Trajanje mora biti pozitivno (0 ili negativno bi razbilo racunanje slotova i
# provjeru preklapanja termina), gornja granica je jedan puni dan.
MIN_DURATION_MINUTES = 1
MAX_DURATION_MINUTES = 1440

# Cijena 0 je dozvoljena (besplatna konsultacija), negativna nije.
MIN_PRICE = 0
MAX_PRICE = 1_000_000


class ServiceCreate(BaseModel):
    tenant_id: int
    name: str = Field(max_length=60)
    description: str | None = Field(default=None, max_length=500)
    duration_minutes: int = Field(ge=MIN_DURATION_MINUTES, le=MAX_DURATION_MINUTES)
    price: float = Field(ge=MIN_PRICE, le=MAX_PRICE)
    color: str | None = None


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=60)
    description: str | None = Field(default=None, max_length=500)
    duration_minutes: int | None = Field(
        default=None, ge=MIN_DURATION_MINUTES, le=MAX_DURATION_MINUTES
    )
    price: float | None = Field(default=None, ge=MIN_PRICE, le=MAX_PRICE)
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