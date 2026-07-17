"""
Centralna logika za read-only mode (istekao trial / neplaćena pretplata).

Kljucna funkcija: is_tenant_read_only(db, tenant). Sve write rute pozivaju
assert_tenant_writable(db, tenant_id) da blokiraju kreiranje/izmjenu podataka
kad je salon u read-only stanju.

Dizajn (potvrdjeno sa vlasnikom):
- Globalni prekidac 'billing_enforcement_enabled' (SystemSetting) je UGASEN
  tokom besplatnog test perioda - dok je ugasen, NIKO nije read-only.
- Zastita prvih beta korisnika ide iskljucivo preko zastavice is_beta_tester:
  kad se naplata PRVI PUT upali, svi tada postojeci saloni se jednokratno
  oznace kao beta testeri (vidi admin.update_billing_settings). Namjerno NEMA
  tihog pravila "po datumu registracije" - da bi izuzece bilo vidljivo i da bi
  se moglo SKINUTI kad se odluci da i oni krenu placati.
- Skidanje beta oznake salonu kojem je trial istekao mu daje svjezih TRIAL_DAYS
  dana (vidi admin.set_tenant_beta_tester) da ne padne u read-only iste sekunde.
- Za sve ostale: trial (TRIAL_DAYS) -> nakon isteka ako billing_status nije
  'active' -> READ ONLY. Paddle webhook ce kasnije postavljati billing_status.
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

TRIAL_DAYS = 14

READ_ONLY_DETAIL = (
    "Pristup je trenutno ograničen (samo pregled). Probni period je istekao ili "
    "pretplata nije aktivna. Pretplatite se da ponovo možete kreirati i mijenjati podatke."
)


def get_setting(db: Session, key: str, default: str | None = None) -> str | None:
    from app.models.system_setting import SystemSetting

    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return row.value if row is not None else default


def set_setting(db: Session, key: str, value: str) -> None:
    from app.models.system_setting import SystemSetting

    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if row is None:
        row = SystemSetting(key=key, value=value)
        db.add(row)
    else:
        row.value = value


def billing_enforcement_enabled(db: Session) -> bool:
    return get_setting(db, "billing_enforcement_enabled", "false") == "true"


def enforcement_since(db: Session) -> datetime | None:
    raw = get_setting(db, "billing_enforcement_since")
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def is_tenant_read_only(db: Session, tenant) -> bool:
    if tenant is None:
        return False

    # 1. Prekidac ugasen (besplatni test period) - niko nije read-only
    if not billing_enforcement_enabled(db):
        return False

    # 2. Oznacen kao beta tester - izuzet (skidanjem oznake ulazi u naplatu)
    if getattr(tenant, "is_beta_tester", False):
        return False

    # 3. Placena pretplata - pun pristup
    if tenant.billing_status == "active":
        return False

    # 4. Unutar trial perioda - pun pristup
    now = datetime.now(timezone.utc)
    if tenant.billing_status == "trial" and tenant.trial_ends_at is not None:
        ends = tenant.trial_ends_at
        if ends.tzinfo is None:
            ends = ends.replace(tzinfo=timezone.utc)
        if ends > now:
            return False

    # 5. Trial istekao neplacen, ili past_due/canceled -> READ ONLY
    return True


def assert_tenant_writable(db: Session, tenant_id: int) -> None:
    """Poziva se u write rutama nakon provjere pristupa. Baca 403 ako je salon read-only."""
    from app.models.tenant import Tenant

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is not None and is_tenant_read_only(db, tenant):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=READ_ONLY_DETAIL)
