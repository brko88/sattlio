import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
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
from app.models.employee import Employee
from app.models.user_tenant_role import UserTenantRole
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AccessTokenResponse,
    UserResponse,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    UpdateProfileRequest,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    # httpOnly - JS (pa ni XSS) ne moze procitati ovaj token, za razliku od
    # access tokena koji ostaje u localStorage. Path skopiran samo na auth
    # rute - cookie se ne salje uz ostale API pozive.
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
        max_age=settings.refresh_token_expire_days * 86400,
    )


def issue_tokens(db: Session, user_id: int, family_id: str | None = None) -> tuple[str, str]:
    """
    family_id povezuje sve refresh tokene nastale rotacijom iz istog
    originalnog login-a ("porodica" sesije). Ako se ne proslijedi, ovo je
    novi login pa se pravi nova porodica; ako se prosljeđuje (rotacija u
    /refresh), novi token nasljeđuje porodicu prethodnika - to omogućava
    da se pri replay napadu poništi CIJELI lanac, ne samo jedan token.

    Vraca (access_token, raw_refresh_token) - pozivalac je odgovoran da
    raw_refresh_token postavi kao httpOnly cookie, ne u JSON tijelo.
    """
    access_token = create_access_token(user_id=user_id)

    raw_refresh_token = generate_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    refresh_entry = RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(raw_refresh_token),
        family_id=family_id or secrets.token_hex(16),
        expires_at=expires_at,
    )
    db.add(refresh_entry)
    db.commit()

    return access_token, raw_refresh_token


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
        # Čuvamo samo heš (isti princip kao refresh_token) - ako baza procuri,
        # sirovi token iz email-a se ne može rekonstruisati iz baze.
        verification_token=hash_refresh_token(verification_token),
        # terms_accepted je vec potvrdjen kao True na nivou sheme (RegisterRequest) -
        # ovdje samo biljezimo KADA je prihvatio, kao dokaz pristanka.
        terms_accepted_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # NAPOMENA: Povezivanje sa pending Employee zapisom (ako postoji) se NE radi
    # ovdje - namjerno se odgađa dok se email ne potvrdi (vidi verify_email).
    # Registracija sama po sebi ne dokazuje da korisnik zaista posjeduje taj
    # email; bez ove odgode, napadač bi mogao registrovati tuđi email koji je
    # vlasnik salona pozvao kao zaposlenog i odmah dobiti pristup klijentima
    # i terminima tog salona, bez ikakve potvrde vlasništva nad email adresom.

    try:
        send_verification_email(new_user.email, verification_token)
    except Exception as e:
        import logging
        logging.error(f"Verifikacioni email nije poslan: {e}")

    return new_user


@router.post("/login", response_model=AccessTokenResponse)
@limiter.limit("10/minute")
def login(request: Request, response: Response, data: LoginRequest, db: Session = Depends(get_db)):
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

    access_token, raw_refresh_token = issue_tokens(db, user.id)
    _set_refresh_cookie(response, raw_refresh_token)
    return AccessTokenResponse(access_token=access_token)


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token nije valjan.",
        )
    token_hash = hash_refresh_token(raw_token)

    # with_for_update() zaključava red do commit-a - drugi paralelni zahtjev
    # sa ISTIM refresh tokenom mora čekati da prvi završi, pa onda vidi
    # već ažurirano (is_revoked=True) stanje umjesto zastarjelog. Bez ovoga
    # oba zahtjeva mogu proći provjeru prije nego ijedan commituje i oba
    # dobiju validnu novu sesiju iz jednog tokena.
    stored_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .with_for_update()
        .first()
    )

    if stored_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token nije valjan.",
        )

    if stored_token.is_revoked:
        # Replay detekcija: ovaj token je već iskorišten (rotiran) ranije.
        # Legitimni klijent nikad ne bi trebao ponovo poslati stari token -
        # ovo je znak da je token možda kompromitovan (ukraden pa iskorišten
        # i od napadača i od pravog vlasnika). Poništi CIJELU porodicu
        # (sve tokene nastale rotacijom iz istog originalnog login-a) da se
        # prisili ponovna prijava na svim uređajima te sesije.
        if stored_token.family_id:
            db.query(RefreshToken).filter(
                RefreshToken.family_id == stored_token.family_id,
                RefreshToken.is_revoked == False,
            ).update({"is_revoked": True})
            db.commit()
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
    family_id = stored_token.family_id or secrets.token_hex(16)
    db.commit()

    new_access_token, new_raw_refresh_token = issue_tokens(db, stored_token.user_id, family_id=family_id)
    _set_refresh_cookie(response, new_raw_refresh_token)
    return AccessTokenResponse(access_token=new_access_token)


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)

    if raw_token is not None:
        token_hash = hash_refresh_token(raw_token)
        stored_token = (
            db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .first()
        )
        if stored_token is not None:
            stored_token.is_revoked = True
            db.commit()

    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
    return {"detail": "Odjavljeni ste."}


@router.post("/verify-email", response_model=UserResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == hash_refresh_token(data.token)).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neispravan ili istekao verifikacioni kod.",
        )

    user.email_verified = True
    user.verification_token = None

    # Tek SAD, nakon dokazanog vlasništva nad email adresom, poveži pending
    # Employee zapis (ako postoji) sa ovim nalogom i dodijeli employee rolu.
    pending_employees = db.query(Employee).filter(
        Employee.email == user.email,
        Employee.user_id == None,
        Employee.is_deleted == False,
    ).all()
    for emp in pending_employees:
        emp.user_id = user.id
        existing_role = db.query(UserTenantRole).filter(
            UserTenantRole.user_id == user.id,
            UserTenantRole.tenant_id == emp.tenant_id,
        ).first()
        if existing_role is None:
            db.add(UserTenantRole(
                user_id=user.id,
                tenant_id=emp.tenant_id,
                role="employee",
            ))

    db.commit()
    db.refresh(user)

    return user


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if user:
        reset_token = secrets.token_hex(32)
        user.password_reset_token = hash_refresh_token(reset_token)
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        try:
            send_password_reset_email(user.email, reset_token)
        except Exception as e:
            import logging
            logging.error(f"Password reset email nije poslan: {e}")

    return {"detail": "Ako email postoji u sistemu, poslan je link za reset lozinke."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.password_reset_token == hash_refresh_token(data.token)).first()

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

    # Poništi sve aktivne refresh tokene - ako je neko drugi (napadač) imao
    # aktivnu sesiju, promjena lozinke ga mora izbaciti, ne samo blokirati
    # buduće login pokušaje starom lozinkom.
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.is_revoked == False,
    ).update({"is_revoked": True})

    db.commit()

    return {"detail": "Lozinka je uspješno promijenjena."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.first_name = data.first_name
    current_user.last_name = data.last_name
    current_user.phone = data.phone
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.email_verified:
        return {"detail": "Email je već potvrđen."}

    verification_token = secrets.token_hex(16)
    current_user.verification_token = hash_refresh_token(verification_token)
    db.commit()

    try:
        send_verification_email(current_user.email, verification_token)
    except Exception as e:
        import logging
        logging.error(f"Verifikacioni email nije poslan: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Slanje emaila trenutno nije moguće. Pokušajte ponovo kasnije.",
        )

    return {"detail": "Verifikacijski email je ponovo poslan."}


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trenutna lozinka nije tacna.",
        )

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nova lozinka mora imati barem 8 karaktera.",
        )

    current_user.password_hash = hash_password(data.new_password)

    # Poništi sve aktivne refresh tokene (uklj. trenutnu sesiju) - isti razlog
    # kao kod reset_password: ako je neko drugi imao pristup nalogu, promjena
    # lozinke ga mora izbaciti iz svih sesija. Trenutni access_token ostaje
    # važeći do isteka (kratak vijek), ali refresh više neće raditi.
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.is_revoked == False,
    ).update({"is_revoked": True})

    db.commit()

    return {"detail": "Lozinka je uspjesno promijenjena."}

