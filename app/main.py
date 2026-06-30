from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.core.database import Base, engine
from app.models import user, tenant, user_tenant_role, employee, service, working_hours, customer, appointment, refresh_token
from app.api.routes import auth, tenants, employees, services, working_hours as working_hours_routes, customers, appointments, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sattlio API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/")
def root():
    return {"status": "Sattlio API running"}
