from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class SystemSetting(Base):
    """
    Platform-wide key-value postavke (ne po-tenant). Prva upotreba: globalni
    prekidac za naplatu (billing_enforcement_enabled) koji je UGASEN tokom
    besplatnog test perioda, i billing_enforcement_since (datum paljenja) za
    grandfathering postojecih korisnika.
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
