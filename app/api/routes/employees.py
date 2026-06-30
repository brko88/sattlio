from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.employee import Employee
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.employee import EmployeeCreate, EmployeeResponse

router = APIRouter(prefix="/api/v1/employees", tags=["employees"])


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


@router.post("", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_owner(db, current_user.id, data.tenant_id)

    new_employee = Employee(
        tenant_id=data.tenant_id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee


@router.get("", response_model=list[EmployeeResponse])
def get_employees(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = (
        db.query(UserTenantRole)
        .filter(
            UserTenantRole.user_id == current_user.id,
            UserTenantRole.tenant_id == tenant_id,
        )
        .first()
    )
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom poslovnom subjektu.",
        )

    employees = (
        db.query(Employee)
        .filter(Employee.tenant_id == tenant_id, Employee.is_deleted == False)
        .all()
    )
    return employees