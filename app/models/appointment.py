from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)

    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)

    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)

    status = Column(String, default="created", index=True)
    notes = Column(String, nullable=True)

    cancelled_by_type = Column(String, nullable=True)  # "customer" ili "staff"
    cancelled_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancelled_by_name = Column(String, nullable=True)  # snapshot imena u trenutku otkazivanja
    cancellation_reason = Column(String, nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
