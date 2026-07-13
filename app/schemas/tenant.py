from datetime import datetime
import re
from pydantic import BaseModel, Field, field_validator


class TenantCreate(BaseModel):
    name: str = Field(max_length=100)
    address: str | None = Field(default=None, max_length=150)
    city: str | None = Field(default=None, max_length=50)
    country: str | None = None
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = None
    jib: str
    business_category: str | None = None
    description: str | None = Field(default=None, max_length=800)

    @field_validator("jib")
    @classmethod
    def validate_jib(cls, value: str) -> str:
        value = value.strip()
        if not re.fullmatch(r"\d{13}", value):
            raise ValueError("JIB mora sadržavati tačno 13 cifara.")
        if len(set(value)) == 1:
            raise ValueError("JIB ne može sadržavati istu cifru ponovljenu 13 puta.")
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

    class Config:
        from_attributes = True

class TenantAdminResponse(TenantResponse):
    owner_name: str | None = None
    owner_email: str | None = None
