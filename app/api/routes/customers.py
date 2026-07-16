from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.billing import assert_tenant_writable
from app.core.database import get_db
from app.core.pagination import paginate
from app.core.permissions import require_staff
from app.core.security import get_current_user
from app.models.customer import Customer
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.schemas.pagination import PaginatedResponse

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
    assert_tenant_writable(db, data.tenant_id)

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


@router.get("", response_model=PaginatedResponse[CustomerResponse])
def get_customers(
    tenant_id: int,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_staff(db, current_user.id, tenant_id)

    query = db.query(Customer).filter(Customer.tenant_id == tenant_id, Customer.is_deleted == False)

    if search:
        query = query.filter(
            (Customer.first_name.ilike(f"%{search}%"))
            | (Customer.last_name.ilike(f"%{search}%"))
            | (Customer.phone.ilike(f"%{search}%"))
        )

    query = query.order_by(Customer.first_name, Customer.last_name)
    items, total = paginate(query, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.is_deleted == False)
        .first()
    )
    if customer is None:
        raise HTTPException(status_code=404, detail="Klijent nije pronađen.")

    require_staff(db, current_user.id, customer.tenant_id)
    assert_tenant_writable(db, customer.tenant_id)

    if data.first_name is not None:
        customer.first_name = data.first_name
    if data.last_name is not None:
        customer.last_name = data.last_name
    if data.phone is not None:
        customer.phone = data.phone
    if data.email is not None:
        customer.email = data.email
    if data.notes is not None:
        customer.notes = data.notes

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.is_deleted == False)
        .first()
    )
    if customer is None:
        raise HTTPException(status_code=404, detail="Klijent nije pronađen.")

    require_staff(db, current_user.id, customer.tenant_id)
    assert_tenant_writable(db, customer.tenant_id)

    customer.is_deleted = True
    customer.deleted_at = datetime.now(timezone.utc)
    db.commit()

    return {"detail": "Klijent je obrisan."}