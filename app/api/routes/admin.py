from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_superadmin
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantResponse

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/tenants", response_model=list[TenantResponse])
def list_all_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    return tenants


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
    tenant.is_active = False
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

    tenant.verification_status = "pending"
    tenant.is_active = True
    db.commit()

    return {"detail": "Tenant je reaktiviran.", "verification_status": tenant.verification_status}