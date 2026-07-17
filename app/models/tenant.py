from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    business_category = Column(String, nullable=True)
    description = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True, index=True)
    country = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    timezone = Column(String, default="Europe/Sarajevo", nullable=False, server_default="Europe/Sarajevo")
    currency = Column(String, default="BAM")
    jib = Column(String, unique=True, nullable=True, index=True)
    verification_status = Column(String, default="pending", nullable=False)
    is_active = Column(Boolean, default=True)
    slot_duration_minutes = Column(Integer, default=30, nullable=False)
    plan = Column(String, default="trial", nullable=False)
    billing_status = Column(String, default="trial", nullable=False)  # trial | active | past_due | canceled
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    # Beta tester izuzet od trial+naplata pravila dok je ovo True (vidi app/core/billing.py)
    is_beta_tester = Column(Boolean, default=False, nullable=False, server_default="false")
    # Interni/skriveni test salon: nevidljiv javnosti, vide ga i mogu rezervisati
    # SAMO korisnici sa users.is_internal_tester (vidi app/api/routes/public.py).
    is_internal = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user_roles = relationship("UserTenantRole", back_populates="tenant")

