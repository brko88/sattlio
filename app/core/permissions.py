from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user_tenant_role import UserTenantRole


def require_staff(db: Session, user_id: int, tenant_id: int):
    """
    Dozvoljava pristup SAMO owner-u i employee-u tog tenant-a.
    Customer rola ima svoje, uže scoped rute (npr. /appointments/my) i ne
    smije vidjeti podatke drugih klijenata ili sve termine u salonu.
    """
    role = (
        db.query(UserTenantRole)
        .filter(
            UserTenantRole.user_id == user_id,
            UserTenantRole.tenant_id == tenant_id,
        )
        .first()
    )
    if role is None or role.role not in ("owner", "employee"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom poslovnom subjektu.",
        )
