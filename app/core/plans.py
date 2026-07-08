"""
Centralna definicija svih Sattlio paketa.

SVE sto se tice paketa (naziv, cijena, limiti) zivi ovdje, na jednom mjestu.
Landing stranica, Register, backend provjere limita, i buduci Paddle checkout
svi citaju odavde - da se cijena/limit nikad ne mijenja na 5 razlicitih mjesta.

employee_limit = None znaci neograniceno.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Plan:
    key: str
    name: str
    price_bam: float | None  # None = po dogovoru
    employee_limit: int | None  # None = neograniceno


PLANS: dict[str, Plan] = {
    "trial": Plan(key="trial", name="Probni period", price_bam=0.0, employee_limit=20),  # privremeno 20 za betu/testiranje, beta sloj ce ovo kasnije ionako preskakati
    "solo": Plan(key="solo", name="Solo", price_bam=14.90, employee_limit=1),
    "start": Plan(key="start", name="Start", price_bam=29.90, employee_limit=3),
    "pro": Plan(key="pro", name="Pro", price_bam=59.90, employee_limit=10),
    "business": Plan(key="business", name="Business", price_bam=None, employee_limit=None),
}

DEFAULT_PLAN_KEY = "trial"


def get_plan(plan_key: str | None) -> Plan:
    """Vraca Plan za dati kljuc, ili default (trial) ako kljuc ne postoji."""
    if plan_key and plan_key in PLANS:
        return PLANS[plan_key]
    return PLANS[DEFAULT_PLAN_KEY]


def get_employee_limit(plan_key: str | None) -> int | None:
    """Vraca limit broja radnika za dati plan. None = neograniceno."""
    return get_plan(plan_key).employee_limit
