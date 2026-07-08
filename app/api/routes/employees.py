from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.employee import Employee
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse

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
            detail="Samo vlasnik poslovnog subjekta moze izvrsiti ovu akciju.",
        )


@router.post("", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_owner(db, current_user.id, data.tenant_id)

    # Validacija: email ne smije vec biti dodijeljen drugom zaposlenom u istom salonu
    existing_employee = db.query(Employee).filter(
        Employee.tenant_id == data.tenant_id,
        Employee.email == data.email,
        Employee.is_deleted == False,
    ).first()
    if existing_employee is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ova email adresa je vec dodijeljena drugom zaposlenom.",
        )

    # Ako User sa ovim emailom vec postoji, povezi ga odmah
    existing_user = db.query(User).filter(User.email == data.email).first()
    linked_user_id = existing_user.id if existing_user else None

    new_employee = Employee(
        tenant_id=data.tenant_id,
        user_id=linked_user_id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
    )
    db.add(new_employee)

    # Ako je User povezan, dodijeli mu employee rolu za ovaj tenant (ako je vec nema)
    if existing_user is not None:
        existing_role = db.query(UserTenantRole).filter(
            UserTenantRole.user_id == existing_user.id,
            UserTenantRole.tenant_id == data.tenant_id,
        ).first()
        if existing_role is None:
            db.add(UserTenantRole(
                user_id=existing_user.id,
                tenant_id=data.tenant_id,
                role="employee",
            ))

    db.commit()
    db.refresh(new_employee)
    return new_employee

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


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id, Employee.is_deleted == False)
        .first()
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Zaposleni nije pronadjen.")

    require_owner(db, current_user.id, employee.tenant_id)

    if data.first_name is not None:
        employee.first_name = data.first_name
    if data.last_name is not None:
        employee.last_name = data.last_name
    if data.phone is not None:
        employee.phone = data.phone
    if data.email is not None:
        employee.email = data.email
    if data.allow_self_booking is not None:
        employee.allow_self_booking = data.allow_self_booking

    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id, Employee.is_deleted == False)
        .first()
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Zaposleni nije pronadjen.")

    require_owner(db, current_user.id, employee.tenant_id)

    employee.is_deleted = True
    db.commit()

    return {"detail": "Zaposleni je obrisan."}
