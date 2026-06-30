from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.employee import Employee
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.models.working_hours import WorkingHours
from app.schemas.working_hours import WorkingHoursCreate, WorkingHoursResponse

router = APIRouter(prefix="/api/v1/working-hours", tags=["working-hours"])


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


@router.post("", response_model=WorkingHoursResponse)
def create_working_hours(
    data: WorkingHoursCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_owner(db, current_user.id, data.tenant_id)

    employee = (
        db.query(Employee)
        .filter(Employee.id == data.employee_id, Employee.tenant_id == data.tenant_id)
        .first()
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zaposleni ne postoji u ovom poslovnom subjektu.",
        )

    if data.start_time >= data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vrijeme početka mora biti prije vremena završetka.",
        )

    existing = (
        db.query(WorkingHours)
        .filter(
            WorkingHours.tenant_id == data.tenant_id,
            WorkingHours.employee_id == data.employee_id,
            WorkingHours.day_of_week == data.day_of_week,
        )
        .first()
    )

    if existing is not None:
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        existing.is_working_day = data.is_working_day
        db.commit()
        db.refresh(existing)
        return existing

    new_entry = WorkingHours(
        tenant_id=data.tenant_id,
        employee_id=data.employee_id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        is_working_day=data.is_working_day,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return new_entry


@router.get("", response_model=list[WorkingHoursResponse])
def get_working_hours(
    tenant_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_member(db, current_user.id, tenant_id)

    entries = (
        db.query(WorkingHours)
        .filter(
            WorkingHours.tenant_id == tenant_id,
            WorkingHours.employee_id == employee_id,
        )
        .order_by(WorkingHours.day_of_week)
        .all()
    )

    return entries
@router.delete("/{working_hours_id}")
def delete_working_hours(
    working_hours_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(WorkingHours).filter(WorkingHours.id == working_hours_id).first()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zapis ne postoji.")

    require_owner(db, current_user.id, entry.tenant_id)

    db.delete(entry)
    db.commit()

    return {"detail": "Radno vrijeme je obrisano."}