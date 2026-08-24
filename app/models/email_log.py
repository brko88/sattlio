from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class EmailLog(Base):
    """
    Zapis svakog pokusaja slanja emaila (uspjesnog i neuspjesnog) - osnova za
    brojac poslatih poruka u Admin panelu (Gmail SMTP limit je 500/24h).
    """
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    email_type = Column(String, nullable=False, index=True)  # npr. "verification", "password_reset"
    to_email = Column(String, nullable=False)
    success = Column(Boolean, nullable=False)
    error = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
