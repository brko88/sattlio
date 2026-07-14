from sqlalchemy import Column, Integer, String, Boolean, Time, ForeignKey, UniqueConstraint

from app.core.database import Base


class WorkingHours(Base):
    __tablename__ = "working_hours"
    __table_args__ = (
        UniqueConstraint("tenant_id", "employee_id", "day_of_week", name="uq_working_hours_tenant_employee_day"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)

    day_of_week = Column(Integer, nullable=False)  # 0 = ponedjeljak ... 6 = nedjelja
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    break_start = Column(Time, nullable=True)
    break_end = Column(Time, nullable=True)
    is_working_day = Column(Boolean, default=True)