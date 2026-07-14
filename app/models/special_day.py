from sqlalchemy import Column, Integer, String, Boolean, Time, Date, ForeignKey, UniqueConstraint
from app.core.database import Base

class SpecialDay(Base):
    __tablename__ = "special_days"
    __table_args__ = (
        UniqueConstraint("tenant_id", "employee_id", "date", name="uq_special_days_tenant_employee_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    is_working_day = Column(Boolean, default=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    break_start = Column(Time, nullable=True)
    break_end = Column(Time, nullable=True)
    note = Column(String, nullable=True)