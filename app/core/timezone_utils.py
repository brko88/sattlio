from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.tenant import Tenant

DEFAULT_TZ_NAME = "Europe/Sarajevo"


def zoneinfo_for_tenant(tenant: Tenant | None) -> ZoneInfo:
    name = (tenant.timezone if tenant else None) or DEFAULT_TZ_NAME
    try:
        return ZoneInfo(name)
    except Exception:
        # Odbrana od pokvarenog/nepostojeceg stringa u bazi - ne smije srusiti request.
        return ZoneInfo(DEFAULT_TZ_NAME)


def get_tenant_timezone(db: Session, tenant_id: int) -> ZoneInfo:
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    return zoneinfo_for_tenant(tenant)
