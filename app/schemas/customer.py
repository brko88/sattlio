from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validators import normalize_email


class CustomerCreate(BaseModel):
    tenant_id: int
    first_name: str = Field(max_length=30)
    last_name: str = Field(max_length=30)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    notes: str | None = Field(default=None, max_length=300)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return normalize_email(value) if value is not None else value


class CustomerUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=30)
    last_name: str | None = Field(default=None, max_length=30)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    notes: str | None = Field(default=None, max_length=300)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return normalize_email(value) if value is not None else value


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