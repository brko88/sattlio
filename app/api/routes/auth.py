import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    generate_refresh_token,
    hash_refresh_token,
)
from app.core.config import settings
from app.core.email import send_verification_email, send_password_reset_email
from app.core.limiter import limiter
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def issue_tokens(db: Session, user_id: int) -> TokenResponse:
    access_token = create_access_token(user_id=user_id)

    raw_refresh_token = generate_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    refresh_entry = RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(raw_refresh_token),
        expires_at=expires_at,
    )
    db.add(refresh_entry)
    db.commit()

    return TokenResponse(access_token=access_token, refresh_token=raw_refresh_token)


@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email je već registrovan.",
        )

    verification_token = secrets.token_hex(16)

    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        email_verified=False,
        verification_token=verification_token,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_verification_email(new_user.email, verification_token)

    return new_user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Pogrešan email ili lozinka.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nalog je deaktiviran.",
        )

    return issue_tokens(db, user.id)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(data.refresh_token)

    stored_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )

    if stored_token is None or stored_token.is_revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token nije valjan.",
        )

    expires_at = stored_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token je istekao.",
        )

    stored_token.is_revoked = True
    db.commit()

    return issue_tokens(db, stored_token.user_id)


@router.post("/logout")
def logout(data: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(data.refresh_token)

    stored_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )

    if stored_token is not None:
        stored_token.is_revoked = True
        db.commit()

    return {"detail": "Odjavljeni ste."}


@router.post("/verify-email", response_model=UserResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == data.token).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neispravan ili istekao verifikacioni kod.",
        )

    user.email_verified = True
    user.verification_token = None
    db.commit()
    db.refresh(user)

    return user


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if user:
        reset_token = secrets.token_hex(32)
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        send_password_reset_email(user.email, reset_token)

    return {"detail": "Ako email postoji u sistemu, poslan je link za reset lozinke."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.password_reset_token == data.token).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neispravan ili istekao token.",
        )

    expires = user.password_reset_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token je istekao. Zatražite novi reset.",
        )

    user.password_hash = hash_password(data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    return {"detail": "Lozinka je uspješno promijenjena."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.email_verified:
        return {"detail": "Email je već potvrđen."}

    verification_token = secrets.token_hex(16)
    current_user.verification_token = verification_token
    db.commit()

    send_verification_email(current_user.email, verification_token)

    return {"detail": "Verifikacijski email je ponovo poslan."}