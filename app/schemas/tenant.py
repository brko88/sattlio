from datetime import datetime
import re
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validators import normalize_email


class TenantCreate(BaseModel):
    name: str = Field(max_length=100)
    address: str | None = Field(default=None, max_length=150)
    city: str | None = Field(default=None, max_length=50)
    country: str | None = Field(default=None, max_length=60)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    jib: str
    business_category: str | None = Field(default=None, max_length=60)
    description: str | None = Field(default=None, max_length=800)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return normalize_email(value) if value is not None else value

    @field_validator("jib")
    @classmethod
    def validate_jib(cls, value: str) -> str:
        """
        Regionalni identifikacioni broj poslovnog subjekta - namjerno prihvata
        raspon 9-13 cifara umjesto strogo 13, jer platforma pokriva vise zemalja:
        BiH JIB = 13 cifara, Srbija PIB = 9 cifara, Hrvatska OIB = 11 cifara.
        Ne provjeravamo tacan checksum algoritam po zemlji (van obima za MVP) -
        samo format i trivijalni "ista cifra ponovljena" obrazac.
        """
        value = value.strip()
        if not re.fullmatch(r"\d{9,13}", value):
            raise ValueError("Identifikacioni broj mora imati između 9 i 13 cifara.")
        if len(set(value)) == 1:
            raise ValueError("Identifikacioni broj ne može sadržavati istu cifru ponovljenu više puta.")
        return value


class TenantResponse(BaseModel):
    id: int
    name: str
    slug: str
    city: str | None
    address: str | None
    business_category: str | None
    is_active: bool
    jib: str | None
    verification_status: str
    slot_duration_minutes: int
    timezone: str
    plan: str
    trial_ends_at: datetime | None
    logo_url: str | None
    cover_url: str | None

    class Config:
        from_attributes = True


class TenantWithRoleResponse(BaseModel):
    id: int
    name: str
    slug: str
    city: str | None
    is_active: bool
    jib: str | None
    verification_status: str
    role: str
    slot_duration_minutes: int
    timezone: str
    plan: str
    trial_ends_at: datetime | None
    logo_url: str | None
    cover_url: str | None
    read_only: bool = False

    class Config:
        from_attributes = True

class TenantAdminResponse(TenantResponse):
    owner_name: str | None = None
    owner_email: str | None = None
    is_beta_tester: bool = False
    is_internal: bool = False
    read_only: bool = False
    created_at: datetime | None = None
