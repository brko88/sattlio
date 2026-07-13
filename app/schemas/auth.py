from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str = Field(max_length=30)
    last_name: str = Field(max_length=30)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


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


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
