import mimetypes
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.core.config import settings
from app.core.media import MEDIA_ROOT
from app.core.scheduler import start_scheduler, stop_scheduler
from app.api.routes import auth, tenants, employees, services, working_hours as working_hours_routes, customers, appointments, admin, public, special_days, support

app = FastAPI(title="Sattlio API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


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
