import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.tenant import TenantCreate, TenantResponse, TenantWithRoleResponse

router = APIRouter(prefix="/api/v1/tenants", tags=["tenants"])


class TenantUpdate(BaseModel):
    slot_duration_minutes: int | None = None


def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug


def require_owner(db: Session, user_id: int, tenant_id: int):
    role = db.query(UserTenantRole).filter(
        UserTenantRole.user_id == user_id,
        UserTenantRole.tenant_id == tenant_id,
        UserTenantRole.role == "owner",
    ).first()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Samo vlasnik može mijenjati podešavanja.",
        )


@router.post("", response_model=TenantResponse)
def create_tenant(
    data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_jib = db.query(Tenant).filter(Tenant.jib == data.jib).first()
    if existing_jib is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Poslovni subjekat sa ovim JIB-om već postoji na platformi.",
        )

    base_slug = slugify(data.name)
    slug = base_slug
    counter = 1
    while db.query(Tenant).filter(Tenant.slug == slug).first():
        counter += 1
        slug = f"{base_slug}-{counter}"

    new_tenant = Tenant(
        name=data.name,
        slug=slug,
        address=data.address,
        city=data.city,
        country=data.country,
        phone=data.phone,
        email=data.email,
        jib=data.jib,
        business_category=data.business_category,
        verification_status="pending",
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    owner_role = UserTenantRole(
        user_id=current_user.id,
        tenant_id=new_tenant.id,
        role="owner",
    )
    db.add(owner_role)
    db.commit()

    return new_tenant


@router.patch("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: int,
    data: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_owner(db, current_user.id, tenant_id)

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salon nije pronađen.")

    if data.slot_duration_minutes is not None:
        if data.slot_duration_minutes not in [15, 20, 30, 60]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Interval mora biti 15, 20, 30 ili 60 minuta.",
            )
        tenant.slot_duration_minutes = data.slot_duration_minutes

    db.commit()
    db.refresh(tenant)

    return tenant


@router.get("/my", response_model=list[TenantWithRoleResponse])
def get_my_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    roles = (
        db.query(UserTenantRole)
        .filter(UserTenantRole.user_id == current_user.id)
        .all()
    )

    result = []
    for role in roles:
        tenant = db.query(Tenant).filter(Tenant.id == role.tenant_id).first()
        result.append(
            TenantWithRoleResponse(
                id=tenant.id,
                name=tenant.name,
                slug=tenant.slug,
                city=tenant.city,
                is_active=tenant.is_active,
                jib=tenant.jib,
                verification_status=tenant.verification_status,
                role=role.role,
                slot_duration_minutes=tenant.slot_duration_minutes,
                timezone=tenant.timezone or "Europe/Sarajevo",
            )
        )

    return result