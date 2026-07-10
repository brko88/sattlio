from datetime import date, time

from sqlalchemy.orm import Session

from app.models.special_day import SpecialDay
from app.models.working_hours import WorkingHours


class EffectiveHours:
    def __init__(self, is_working_day: bool, start_time: time | None, end_time: time | None,
                 break_start: time | None = None, break_end: time | None = None):
        self.is_working_day = is_working_day
        self.start_time = start_time
        self.end_time = end_time
        self.break_start = break_start
        self.break_end = break_end


def get_effective_hours(db: Session, tenant_id: int, employee_id: int, target_date: date) -> EffectiveHours:
    """
    Vraća stvarno važeće radno vrijeme zaposlenog za dati datum.
    Ako postoji SpecialDay za taj datum, on IMA PRIORITET nad redovnim
    sedmičnim rasporedom (WorkingHours) - to je jedini izvor istine
    koji smiju koristiti i interno kreiranje termina i javno samostalno
    zakazivanje, da se ne razilaze (BR-011, BR-012, BR-020).
    """
    special_day = db.query(SpecialDay).filter(
        SpecialDay.tenant_id == tenant_id,
        SpecialDay.employee_id == employee_id,
        SpecialDay.date == target_date,
    ).first()

    if special_day is not None:
        if not special_day.is_working_day:
            return EffectiveHours(is_working_day=False, start_time=None, end_time=None)
        return EffectiveHours(
            is_working_day=True,
            start_time=special_day.start_time,
            end_time=special_day.end_time,
        )

    day_of_week = target_date.weekday()
    wh = db.query(WorkingHours).filter(
        WorkingHours.tenant_id == tenant_id,
        WorkingHours.employee_id == employee_id,
        WorkingHours.day_of_week == day_of_week,
    ).first()

    if wh is None or not wh.is_working_day:
        return EffectiveHours(is_working_day=False, start_time=None, end_time=None)

    return EffectiveHours(
        is_working_day=True,
        start_time=wh.start_time,
        end_time=wh.end_time,
        break_start=wh.break_start,
        break_end=wh.break_end,
    )
