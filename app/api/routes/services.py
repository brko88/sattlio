from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.service import Service
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.service import ServiceCreate, ServiceResponse

router = APIRouter(prefix="/api/v1/services", tags=["services"])


def require_owner(db: Session, user_id: int, tenant_id: int):
    role = (
        db.query(UserTenantRole)
        .filter(
            UserTenantRole.user_id == user_id,
            UserTenantRole.tenant_id == tenant_id,
        )
        .first()
    )

    if role is None or role.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Samo vlasnik poslovnog subjekta može izvršiti ovu akciju.",
        )


def require_member(db: Session, user_id: int, tenant_id: int):
    role = (
        db.query(UserTenantRole)
        .filter(
            UserTenantRole.user_id == user_id,
            UserTenantRole.tenant_id == tenant_id,
        )
        .first()
    )
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom poslovnom subjektu.",
        )


@router.post("", response_model=ServiceResponse)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_owner(db, current_user.id, data.tenant_id)

    new_service = Service(
        tenant_id=data.tenant_id,
        name=data.name,
        description=data.description,
        duration_minutes=data.duration_minutes,
        price=data.price,
        color=data.color,
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return new_service


@router.get("", response_model=list[ServiceResponse])
def get_services(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_member(db, current_user.id, tenant_id)

    services = (
        db.query(Service)
        .filter(Service.tenant_id == tenant_id, Service.is_deleted == False)
        .all()
    )
    return services