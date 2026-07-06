from datetime import datetime
import re
from pydantic import BaseModel, field_validator


class TenantCreate(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    country: str | None = None
    phone: str | None = None
    email: str | None = None
    jib: str
    business_category: str | None = None

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

    class Config:
        from_attributes = True