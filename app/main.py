import logging
import mimetypes
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import TimeoutError as SQLAlchemyPoolTimeout

from app.core.limiter import limiter
from app.core.config import settings
from app.core.media import MEDIA_ROOT
from app.core.scheduler import start_scheduler, stop_scheduler
from app.api.routes import auth, tenants, employees, services, working_hours as working_hours_routes, customers, appointments, admin, public, special_days, support

app = FastAPI(title="Sattlio API")
app.state.limiter = limiter


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Standardni slowapi 429 odgovor + log linija. Skok broja ovih linija na
    javnim browse rutama je signal da CGNAT (mnogo korisnika iza istog
    operaterskog IP-a) gusi legitiman saobracaj - reagovati podizanjem
    limita ili finijim kljucem PRIJE nego sto stignu zalbe korisnika.
    """
    from app.core.limiter import user_or_ip
    logging.warning(
        "Rate limit 429: %s %s [kljuc %s, limit %s]",
        request.method,
        request.url.path,
        user_or_ip(request),
        exc.detail,
    )
    return _rate_limit_exceeded_handler(request, exc)


app.add_exception_handler(RateLimitExceeded, rate_limit_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    FastAPI po defaultu vraca `detail` kao LISTU objekata kod 422. Frontend svuda
    radi `setError(err.response?.data?.detail)` pa to renderuje - a React ne moze
    renderovati objekat kao child, sto znaci bijeli ekran umjesto poruke o gresci.
    Ovdje spljostavamo gresku u obican string da `detail` ima isti oblik kao kod
    svakog HTTPException-a u aplikaciji.
    """
    messages = []
    for error in exc.errors():
        error_type = error.get("type", "")

        if error_type in ("value_error", "assertion_error"):
            message = error.get("msg", "").removeprefix("Value error, ")
            # EmailStr javlja gresku kao value_error, ali na engleskom - jedini
            # ugradeni slucaj koji upada u ovu granu, pa ga hvatamo posebno.
            if message.startswith("value is not a valid email address"):
                messages.append("Email adresa nije ispravna.")
            else:
                # Nase vlastite provjere (npr. validate_password) - poruka je vec
                # na nasem jeziku, Pydantic je samo prefiksuje.
                messages.append(message)
            continue

        # Ugradene Pydantic poruke su na engleskom, pa ih prevodimo. Ime polja
        # dolazi iz loc-a (npr. ["body", "price"]) da korisnik zna GDJE je greska.
        loc = [str(part) for part in error.get("loc", []) if part != "body"]
        field = ".".join(loc) or "podatak"
        ctx = error.get("ctx") or {}

        def num(value):
            # Pydantic vraca granice kao float (0.0), a korisniku je citljivije "0".
            if isinstance(value, float) and value.is_integer():
                return str(int(value))
            return str(value)

        if error_type == "missing":
            messages.append(f"Polje '{field}' je obavezno.")
        elif error_type in ("greater_than_equal", "greater_than"):
            messages.append(f"Polje '{field}' ne smije biti manje od {num(ctx.get('ge', ctx.get('gt')))}.")
        elif error_type in ("less_than_equal", "less_than"):
            messages.append(f"Polje '{field}' ne smije biti veće od {num(ctx.get('le', ctx.get('lt')))}.")
        elif error_type == "string_too_long":
            messages.append(f"Polje '{field}' je predugačko (maksimalno {ctx.get('max_length')} karaktera).")
        elif error_type == "string_too_short":
            messages.append(f"Polje '{field}' je prekratko (minimalno {ctx.get('min_length')} karaktera).")
        else:
            messages.append(f"Polje '{field}' nije ispravno popunjeno.")

    detail = " ".join(m for m in messages if m) or "Poslani podaci nisu ispravni."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": detail},
    )


@app.exception_handler(SQLAlchemyPoolTimeout)
async def pool_timeout_handler(request: Request, exc: SQLAlchemyPoolTimeout):
    """
    Kad su sve konekcije iz pool-a zauzete, SQLAlchemy baca TimeoutError koji bi
    inace izasao kao goli 500 ("Internal Server Error") - sto je i pogresno
    (server radi, samo je preopterecen) i beskorisno korisniku.

    503 + Retry-After je tacan odgovor: privremeno zagusenje, pokusaj ponovo.
    Bitno i za buducnost: load balanceri i browseri razumiju 503 i ne racunaju ga
    kao kvar aplikacije, dok 500 obicno pali alarme i retry logiku bez cekanja.
    """
    logging.warning(
        "DB pool iscrpljen (%s %s) - vracen 503. Ako se ponavlja, povecati "
        "pool_size/max_overflow u app/core/database.py i max_connections u Postgres-u.",
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Sistem je trenutno preopterećen. Pokušajte ponovo za nekoliko sekundi."},
        headers={"Retry-After": "5"},
    )


@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.on_event("shutdown")
def on_shutdown():
    stop_scheduler()

mimetypes.add_type("image/webp", ".webp")
Path(MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
app.mount("/api/media", StaticFiles(directory=MEDIA_ROOT), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(employees.router)
app.include_router(services.router)
app.include_router(working_hours_routes.router)
app.include_router(customers.router)
app.include_router(appointments.router)
app.include_router(admin.router)
app.include_router(public.router)
app.include_router(special_days.router)
app.include_router(support.router)

@app.get("/")
def root():
    return {"status": "Sattlio API running"}
