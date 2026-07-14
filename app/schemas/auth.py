from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validators import normalize_email


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str = Field(max_length=30)
    last_name: str = Field(max_length=30)
    terms_accepted: bool

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms_accepted(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Morate prihvatiti Uslove korištenja i Politiku privatnosti.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str | None
    last_name: str | None
    phone: str | None
    email_verified: bool
    is_superadmin: bool

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    first_name: str = Field(max_length=30)
    last_name: str = Field(max_length=30)
    phone: str | None = Field(default=None, max_length=20)


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
