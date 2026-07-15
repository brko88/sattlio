from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class PlatformAnnouncement(Base):
    """
    Baneri koji se prikazuju na vrhu SVAKE stranice, svim korisnicima
    (uklj. neulogovane). kind="beta" je jedinstven seed-ovan red (ne moze se
    obrisati, samo ukljuciti/iskljuciti i urediti tekst); kind="custom" su
    slobodno dodavani/brisani baneri (npr. najava planiranog odrzavanja).
    """
    __tablename__ = "platform_announcements"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String, nullable=False, default="custom")
    message = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
