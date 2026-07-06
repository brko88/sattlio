from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.special_day import SpecialDay
from app.models.user import User
from app.models.user_tenant_role import UserTenantRole
from app.schemas.special_day import SpecialDayCreate, SpecialDayResponse

router = APIRouter(prefix="/api/v1/special-days", tags=["special-days"])


def require_member(db: Session, user_id: int, tenant_id: int):
    role = db.query(UserTenantRole).filter(
        UserTenantRole.user_id == user_id,
        UserTenantRole.tenant_id == tenant_id,
    ).first()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom poslovnom subjektu.",
        )


@router.post("", response_model=SpecialDayResponse)
def create_special_day(
    data: SpecialDayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_member(db, current_user.id, data.tenant_id)

    if data.is_working_day:
        if not data.start_time or not data.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Za radni dan morate unijeti radno vrijeme.",
            )
        if data.start_time >= data.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Početak mora biti prije kraja radnog vremena.",
            )

    # Ako već postoji za taj datum i zaposlenog — ažuriraj
    existing = db.query(SpecialDay).filter(
        SpecialDay.tenant_id == data.tenant_id,
        SpecialDay.employee_id == data.employee_id,
        SpecialDay.date == data.date,
    ).first()

    if existing:
        existing.is_working_day = data.is_working_day
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        existing.note = data.note
        db.commit()
        db.refresh(existing)
        return existing

    new_sd = SpecialDay(
        tenant_id=data.tenant_id,
        employee_id=data.employee_id,
        date=data.date,
        is_working_day=data.is_working_day,
        start_time=data.start_time,
        end_time=data.end_time,
        note=data.note,
    )
    db.add(new_sd)
    db.commit()
    db.refresh(new_sd)
    return new_sd


@router.get("", response_model=list[SpecialDayResponse])
def get_special_days(
    tenant_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_member(db, current_user.id, tenant_id)

    days = db.query(SpecialDay).filter(
        SpecialDay.tenant_id == tenant_id,
        SpecialDay.employee_id == employee_id,
    ).order_by(SpecialDay.date).all()

    return days


@router.delete("/{special_day_id}")
def delete_special_day(
    special_day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sd = db.query(SpecialDay).filter(SpecialDay.id == special_day_id).first()
    if sd is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nije pronađeno.")

    require_member(db, current_user.id, sd.tenant_id)

    db.delete(sd)
    db.commit()
    return {"detail": "Obrisano."}