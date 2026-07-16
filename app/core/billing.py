"""
Centralna logika za read-only mode (istekao trial / neplaćena pretplata).

Kljucna funkcija: is_tenant_read_only(db, tenant). Sve write rute pozivaju
assert_tenant_writable(db, tenant_id) da blokiraju kreiranje/izmjenu podataka
kad je salon u read-only stanju.

Dizajn (potvrdjeno sa vlasnikom):
- Globalni prekidac 'billing_enforcement_enabled' (SystemSetting) je UGASEN
  tokom besplatnog test perioda - dok je ugasen, NIKO nije read-only.
- Kad se prvi put upali, pamti se 'billing_enforcement_since'. Svi saloni
  registrovani PRIJE tog datuma su automatski izuzeti (grandfathering) - da
  se ne zeznu prvi beta korisnici kojima je trial odavno "istekao".
- Po-salon zastavica is_beta_tester rucno izuzima salon (i buduce) od pravila.
- Za sve ostale: trial (14 dana) -> nakon isteka ako billing_status nije
  'active' -> READ ONLY. Paddle webhook ce kasnije postavljati billing_status.
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

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

    # 2. Rucno oznacen beta tester - trajno izuzet
    if getattr(tenant, "is_beta_tester", False):
        return False

    # 3. Grandfathering: registrovan prije paljenja naplate - izuzet
    since = enforcement_since(db)
    if since is not None and tenant.created_at is not None:
        created = tenant.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created < since:
            return False

    # 4. Placena pretplata - pun pristup
    if tenant.billing_status == "active":
        return False

    # 5. Unutar 14-dnevnog trial-a - pun pristup
    now = datetime.now(timezone.utc)
    if tenant.billing_status == "trial" and tenant.trial_ends_at is not None:
        ends = tenant.trial_ends_at
        if ends.tzinfo is None:
            ends = ends.replace(tzinfo=timezone.utc)
        if ends > now:
            return False

    # 6. Trial istekao neplacen, ili past_due/canceled -> READ ONLY
    return True


def assert_tenant_writable(db: Session, tenant_id: int) -> None:
    """Poziva se u write rutama nakon provjere pristupa. Baca 403 ako je salon read-only."""
    from app.models.tenant import Tenant

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant is not None and is_tenant_read_only(db, tenant):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=READ_ONLY_DETAIL)
