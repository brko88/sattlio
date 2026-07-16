from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.billing import assert_tenant_writable
from app.core.database import get_db
from app.core.pagination import paginate
from app.core.security import get_current_user
from app.models.service import Service
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate
from app.schemas.pagination import PaginatedResponse

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
    assert_tenant_writable(db, data.tenant_id)

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


@router.get("", response_model=PaginatedResponse[ServiceResponse])
def get_services(
    tenant_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_member(db, current_user.id, tenant_id)

    query = (
        db.query(Service)
        .filter(Service.tenant_id == tenant_id, Service.is_deleted == False)
        .order_by(Service.name)
    )
    items, total = paginate(query, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id, Service.is_deleted == False)
        .first()
    )
    if service is None:
        raise HTTPException(status_code=404, detail="Usluga nije pronađena.")

    require_owner(db, current_user.id, service.tenant_id)
    assert_tenant_writable(db, service.tenant_id)

    if data.name is not None:
        service.name = data.name
    if data.description is not None:
        service.description = data.description
    if data.duration_minutes is not None:
        service.duration_minutes = data.duration_minutes
    if data.price is not None:
        service.price = data.price
    if data.color is not None:
        service.color = data.color
    if data.is_active is not None:
        service.is_active = data.is_active

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id, Service.is_deleted == False)
        .first()
    )
    if service is None:
        raise HTTPException(status_code=404, detail="Usluga nije pronađena.")

    require_owner(db, current_user.id, service.tenant_id)
    assert_tenant_writable(db, service.tenant_id)

    service.is_deleted = True
    db.commit()

    return {"detail": "Usluga je obrisana."}