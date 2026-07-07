"""
Zajednicka logika za period filter na Analytics stranici.

Svaki analytics endpoint (growth, health, usage, revenue...) koristi ovaj
helper da pretvori string kao "30d" u tacan datumski raspon i granularnost
(dnevno ili mjesecno), i da napravi "prazne kutije" za svaki dan/mjesec u
tom rasponu - tako grafikon ne preskace dane bez podataka (npr. 0 novih
salona taj dan), nego ih prikazuje kao 0, ne kao rupu u grafikonu.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

ALLOWED_PERIODS = ("today", "7d", "30d", "12mo", "all")

# Najstariji mogao datum kad koristimo "all" - platforma nije postojala prije ovoga.
# Sattlio je pocelo sa razvojem 30. juna 2026 (prvi commit), pa je ovo sigurna donja granica.
PLATFORM_START = datetime(2026, 6, 1, tzinfo=timezone.utc)


@dataclass
class PeriodRange:
    start: datetime
    end: datetime
    granularity: str  # "day" ili "month"


def resolve_period(period: str, now: datetime | None = None) -> PeriodRange:
    """Pretvara period string u (start, end, granularity)."""
    if period not in ALLOWED_PERIODS:
        raise ValueError(
            f"Nepoznat period '{period}'. Dozvoljeno: {', '.join(ALLOWED_PERIODS)}."
        )

    now = now or datetime.now(timezone.utc)
    end = now

    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        granularity = "day"
    elif period == "7d":
        start = now - timedelta(days=7)
        granularity = "day"
    elif period == "30d":
        start = now - timedelta(days=30)
        granularity = "day"
    elif period == "12mo":
        start = now - timedelta(days=365)
        granularity = "month"
    else:  # "all"
        start = PLATFORM_START
        granularity = "month"

    return PeriodRange(start=start, end=end, granularity=granularity)


def generate_day_buckets(start: datetime, end: datetime) -> list[str]:
    """Lista datuma "YYYY-MM-DD" za svaki dan u rasponu, ukljucujuci oba kraja."""
    buckets = []
    current = start.date()
    last = end.date()
    while current <= last:
        buckets.append(current.isoformat())
        current += timedelta(days=1)
    return buckets


def generate_month_buckets(start: datetime, end: datetime) -> list[str]:
    """Lista mjeseci "YYYY-MM" za svaki mjesec u rasponu, ukljucujuci oba kraja."""
    buckets = []
    year, month = start.year, start.month
    while (year, month) <= (end.year, end.month):
        buckets.append(f"{year:04d}-{month:02d}")
        month += 1
        if month > 12:
            month = 1
            year += 1
    return buckets


def generate_buckets(period_range: PeriodRange) -> list[str]:
    """Generise prazne kutije prema granularnosti - koristi ovo, ne pojedinacne funkcije direktno."""
    if period_range.granularity == "day":
        return generate_day_buckets(period_range.start, period_range.end)
    return generate_month_buckets(period_range.start, period_range.end)