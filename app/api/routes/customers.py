from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_staff
from app.core.security import get_current_user
from app.models.customer import Customer
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.customer import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/api/v1/customers", tags=["customers"])


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


@router.post("", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_member(db, current_user.id, data.tenant_id)

    new_customer = Customer(
        tenant_id=data.tenant_id,
        created_by_user_id=current_user.id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
        notes=data.notes,
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@router.get("", response_model=list[CustomerResponse])
def get_customers(
    tenant_id: int,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_staff(db, current_user.id, tenant_id)

    query = db.query(Customer).filter(Customer.tenant_id == tenant_id)

    if search:
        query = query.filter(
            (Customer.first_name.ilike(f"%{search}%"))
            | (Customer.last_name.ilike(f"%{search}%"))
            | (Customer.phone.ilike(f"%{search}%"))
        )

    return query.all()