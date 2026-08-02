from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Isti scheme, ali BEZ 401 kad token nedostaje - za javne rute koje treba da rade
# i za neulogovane, a ponasaju se drugacije ako je posjetilac ulogovan
# (npr. interni test saloni vidljivi samo internim testerima).
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# Lazni hash za izjednacavanje vremena odgovora na loginu. Bez njega, login za
# NEPOSTOJECI email odgovara za ~9ms (preskoci bcrypt), a za postojeci sa
# pogresnom lozinkom ~190ms - napadac stopericom pouzdano saznaje ko ima nalog,
# iako je poruka greske ista. Kad korisnik ne postoji, lozinka se provjerava
# protiv ovog hasha pa oba puta traju jednako (rezultat se ionako odbacuje).
# Izracunat jednom pri startu procesa, ne po zahtjevu.
DUMMY_PASSWORD_HASH = pwd_context.hash("timing-guard-dummy-password")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "user_id": user_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            # exp je OBAVEZAN claim: bez ovoga bi token potpisan tacnim secretom
            # ali BEZ exp polja vazio zauvijek. Nasi tokeni exp uvijek imaju
            # (create_access_token) - ovo brani od rucno skovanih "vjecnih"
            # tokena ako SECRET_KEY ikad procuri (defense-in-depth).
            # PAZNJA: python-jose sintaksa je "require_exp" - PyJWT-ov
            # {"require": ["exp"]} bi bio TIHO ignorisan (testirano!).
            options={"require_exp": True},
        )
        return payload
    except JWTError:
        return None


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    from app.models.user import User

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token nije valjan ili je istekao.",
        )

    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Korisnik ne postoji.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nalog je deaktiviran.",
        )

    return user


def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    """
    Vraca User ako je poslan validan token, inace None - NIKAD ne baca 401.
    Koristi se na javnim rutama da se prepozna ulogovani posjetilac (npr. interni
    tester), a da neulogovani i dalje normalno prolaze.
    """
    from app.models.user import User

    if not token:
        return None

    payload = decode_access_token(token)
    if payload is None:
        return None

    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if user is None or not user.is_active:
        return None

    return user


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def require_superadmin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    from app.models.user import User

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token nije valjan ili je istekao.",
        )

    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Korisnik ne postoji.",
        )

    if not user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate administratorska ovlaštenja.",
        )

    return user