from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class AdminActionLog(Base):
    """
    Tiha istorija admin akcija (ko je sta uradio i kad).
    Priprema za buduci Audit Log ekran - ova tabela se puni od danas,
    ekran koji je prikazuje pravimo kasnije.
    """
    __tablename__ = "admin_action_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String, nullable=False, index=True)  # npr. "verify_tenant", "block_user"
    target_type = Column(String, nullable=False, index=True)  # "tenant" | "user"
    target_id = Column(Integer, nullable=False, index=True)
    details = Column(String, nullable=True)  # kratak opis, npr. email/naziv za citljivost
    created_at = Column(DateTime(timezone=True), server_default=func.now())