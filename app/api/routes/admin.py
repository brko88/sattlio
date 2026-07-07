import smtplib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.core.security import require_superadmin
from app.core.email import send_password_reset_email
from app.models.appointment import Appointment
from app.models.employee import Employee
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.models.refresh_token import RefreshToken
from app.models.working_hours import WorkingHours
from app.models.service import Service
from app.schemas.tenant import TenantResponse, TenantAdminResponse
from app.core.analytics_period import resolve_period, generate_buckets

import secrets

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# PostojeÄ‡e rute
# ---------------------------------------------------------------------------

@router.get("/tenants", response_model=list[TenantAdminResponse])
def list_all_tenants(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    from sqlalchemy import or_, func

    query = db.query(Tenant)

    if search:
        search_term = f"%{search}%"

        full_name_match = func.concat(
            func.coalesce(User.first_name, ""),
            " ",
            func.coalesce(User.last_name, ""),
        ).ilike(search_term)

        owner_match = (
            db.query(UserTenantRole.tenant_id)
            .join(User, User.id == UserTenantRole.user_id)
            .filter(
                UserTenantRole.role == "owner",
                or_(
                    User.email.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    full_name_match,
                ),
            )
        )

        query = query.filter(
            or_(
                Tenant.name.ilike(search_term),
                Tenant.jib.ilike(search_term),
                Tenant.city.ilike(search_term),
                Tenant.email.ilike(search_term),
                Tenant.id.in_(owner_match),
            )
        )

    tenants = query.order_by(Tenant.created_at.desc()).all()

    tenant_ids = [t.id for t in tenants]
    owners = (
        db.query(UserTenantRole.tenant_id, User.first_name, User.last_name, User.email)
        .join(User, User.id == UserTenantRole.user_id)
        .filter(UserTenantRole.tenant_id.in_(tenant_ids), UserTenantRole.role == "owner")
        .all()
    )
    owner_by_tenant = {
        tid: {
            "name": f"{first or ''} {last or ''}".strip() or None,
            "email": email,
        }
        for tid, first, last, email in owners
    }

    for t in tenants:
        info = owner_by_tenant.get(t.id, {})
        t.owner_name = info.get("name")
        t.owner_email = info.get("email")

    return tenants


def compute_is_active(tenant) -> bool:
    """Salon je aktivan samo ako oba uslova prolaze - moderacija I billing."""
    billing_ok = tenant.billing_status in ("trial", "active")
    moderation_ok = tenant.verification_status == "verified"
    return billing_ok and moderation_ok


@router.post("/tenants/{tenant_id}/verify")
def verify_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant ne postoji.")
    tenant.verification_status = "verified"
    tenant.is_active = compute_is_active(tenant)
    db.commit()
    return {"detail": "Tenant je verifikovan.", "verification_status": tenant.verification_status}


@router.post("/tenants/{tenant_id}/suspend")
def suspend_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant ne postoji.")
    tenant.verification_status = "suspended"
    tenant.is_active = False  # moderacija uvijek pobjedjuje, bez obzira na billing
    db.commit()
    return {"detail": "Tenant je suspendovan.", "verification_status": tenant.verification_status}


@router.post("/tenants/{tenant_id}/reactivate")
def reactivate_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant ne postoji.")
    tenant.verification_status = "verified"  # FIX: ranije je pogresno vracalo na "pending"
    tenant.is_active = compute_is_active(tenant)
    db.commit()
    return {"detail": "Tenant je reaktiviran.", "verification_status": tenant.verification_status}


# ---------------------------------------------------------------------------
# Platform Stats Dashboard
# ---------------------------------------------------------------------------

@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    total_tenants = db.query(Tenant).count()
    total_users = db.query(User).filter(User.is_superadmin == False).count()
    total_employees = db.query(Employee).filter(Employee.is_deleted == False).count()
    total_appointments = db.query(Appointment).count()
    trial_tenants = db.query(Tenant).filter(Tenant.plan == "trial").count()
    active_tenants = db.query(Tenant).filter(Tenant.plan != "trial", Tenant.is_active == True).count()
    suspended_tenants = db.query(Tenant).filter(Tenant.verification_status == "suspended").count()
    verified_tenants = db.query(Tenant).filter(Tenant.verification_status == "verified").count()
    pending_tenants = db.query(Tenant).filter(Tenant.verification_status == "pending").count()

    return {
        "total_tenants": total_tenants,
        "total_users": total_users,
        "total_employees": total_employees,
        "total_appointments": total_appointments,
        "trial_tenants": trial_tenants,
        "active_tenants": active_tenants,
        "suspended_tenants": suspended_tenants,
        "verified_tenants": verified_tenants,
        "pending_tenants": pending_tenants,
    }


# ---------------------------------------------------------------------------
# Platform Health
# ---------------------------------------------------------------------------

@router.get("/health")
def get_platform_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    # Database check
    db_ok = False
    try:
        db.execute(__import__('sqlalchemy').text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    # SMTP check
    smtp_ok = False
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=5) as server:
            server.ehlo()
            smtp_ok = True
    except Exception:
        pass

    return {
        "backend": {"status": "online"},
        "database": {"status": "online" if db_ok else "offline"},
        "smtp": {"status": "online" if smtp_ok else "offline"},
        "paddle": {"status": "not_configured"},
    }


# ---------------------------------------------------------------------------
# Tenant Health Check
# ---------------------------------------------------------------------------

@router.get("/tenants/{tenant_id}/health")
def get_tenant_health(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant ne postoji.")

    owner = (
        db.query(User)
        .join(UserTenantRole, UserTenantRole.user_id == User.id)
        .filter(UserTenantRole.tenant_id == tenant_id, UserTenantRole.role == "owner")
        .first()
    )

    employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id, Employee.is_deleted == False
    ).all()

    services = db.query(Service).filter(
        Service.tenant_id == tenant_id, Service.is_active == True
    ).all()

    working_hours = db.query(WorkingHours).filter(
        WorkingHours.tenant_id == tenant_id
    ).count()

    self_booking_enabled = any(e.allow_self_booking for e in employees)

    return {
        "tenant_id": tenant_id,
        "tenant_name": tenant.name,
        "checks": {
            "email_verified": owner.email_verified if owner else False,
            "salon_verified": tenant.verification_status == "verified",
            "employees_added": len(employees) > 0,
            "employees_count": len(employees),
            "services_added": len(services) > 0,
            "services_count": len(services),
            "working_hours_set": working_hours > 0,
            "self_booking_enabled": self_booking_enabled,
        },
        "owner_email": owner.email if owner else None,
    }


# ---------------------------------------------------------------------------
# Pregled korisnika
# ---------------------------------------------------------------------------

@router.get("/users")
def list_all_users(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    from sqlalchemy import or_, func

    query = db.query(User)

    if search:
        search_term = f"%{search}%"

        full_name_match = func.concat(
            func.coalesce(User.first_name, ""),
            " ",
            func.coalesce(User.last_name, ""),
        ).ilike(search_term)

        tenant_name_match = (
            db.query(UserTenantRole.user_id)
            .join(Tenant, Tenant.id == UserTenantRole.tenant_id)
            .filter(Tenant.name.ilike(search_term))
        )

        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                full_name_match,
                User.id.in_(tenant_name_match),
            )
        )

    users = query.order_by(User.created_at.desc()).all()
    user_ids = [u.id for u in users]

    # Jedan query za SVE role + tenante odjednom (umjesto po jednog za svakog usera)
    roles_with_tenants = (
        db.query(UserTenantRole, Tenant)
        .join(Tenant, Tenant.id == UserTenantRole.tenant_id)
        .filter(UserTenantRole.user_id.in_(user_ids))
        .all()
    )

    tenants_by_user: dict[int, list[dict]] = {}
    for role, tenant in roles_with_tenants:
        tenants_by_user.setdefault(role.user_id, []).append({
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "role": role.role,
        })

    result = []
    for user in users:
        result.append({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email_verified": user.email_verified,
            "is_active": user.is_active,
            "is_superadmin": user.is_superadmin,
            "created_at": user.created_at,
            "tenants": tenants_by_user.get(user.id, []),
        })

    return result


# ---------------------------------------------------------------------------
# Reset lozinke (admin Ĺˇalje link)
# ---------------------------------------------------------------------------

@router.post("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Korisnik ne postoji.")

    from datetime import timedelta
    reset_token = secrets.token_hex(32)
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()

    try:
        send_password_reset_email(user.email, reset_token)
    except Exception:
        pass

    return {"detail": f"Reset link poslan na {user.email}."}


# ---------------------------------------------------------------------------
# Blokiranje / deblokiranje korisnika
# ---------------------------------------------------------------------------

@router.post("/users/{user_id}/block")
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Korisnik ne postoji.")
    if user.is_superadmin:
        raise HTTPException(status_code=400, detail="Ne mozete blokirati superadmina.")

    user.is_active = False

    # Ponisti sve refresh tokene da korisnik ne moze izvaditi novi access token
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked == False,
    ).update({"is_revoked": True})

    db.commit()
    return {"detail": f"Korisnik {user.email} je blokiran."}


@router.post("/users/{user_id}/unblock")
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Korisnik ne postoji.")

    user.is_active = True
    db.commit()
    return {"detail": f"Korisnik {user.email} je deblokiran."}




# ---------------------------------------------------------------------------
# Platform Analytics - Growth
# ---------------------------------------------------------------------------

@router.get("/analytics/growth")
def get_growth_analytics(
    period: str = "30d",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    try:
        period_range = resolve_period(period)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    buckets = generate_buckets(period_range)

    def bucket_key(dt):
        if period_range.granularity == "day":
            return dt.date().isoformat()
        return f"{dt.year:04d}-{dt.month:02d}"

    new_tenants = db.query(Tenant.created_at).filter(
        Tenant.created_at >= period_range.start,
        Tenant.created_at <= period_range.end,
    ).all()
    tenant_counts = {b: 0 for b in buckets}
    for (created_at,) in new_tenants:
        key = bucket_key(created_at)
        if key in tenant_counts:
            tenant_counts[key] += 1

    new_users = db.query(User.created_at).filter(
        User.created_at >= period_range.start,
        User.created_at <= period_range.end,
        User.is_superadmin == False,
    ).all()
    user_counts = {b: 0 for b in buckets}
    for (created_at,) in new_users:
        key = bucket_key(created_at)
        if key in user_counts:
            user_counts[key] += 1

    new_appointments = db.query(Appointment.created_at).filter(
        Appointment.created_at >= period_range.start,
        Appointment.created_at <= period_range.end,
    ).all()
    appointment_counts = {b: 0 for b in buckets}
    for (created_at,) in new_appointments:
        key = bucket_key(created_at)
        if key in appointment_counts:
            appointment_counts[key] += 1

    series = [
        {
            "date": b,
            "new_tenants": tenant_counts[b],
            "new_users": user_counts[b],
            "new_appointments": appointment_counts[b],
        }
        for b in buckets
    ]

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    summary = {
        "total_tenants": db.query(Tenant).count(),
        "total_users": db.query(User).filter(User.is_superadmin == False).count(),
        "total_appointments": db.query(Appointment).count(),
        "new_tenants_today": db.query(Tenant).filter(Tenant.created_at >= today_start).count(),
        "new_appointments_today": db.query(Appointment).filter(Appointment.created_at >= today_start).count(),
    }

    return {
        "period": period,
        "granularity": period_range.granularity,
        "series": series,
        "summary": summary,
    }
