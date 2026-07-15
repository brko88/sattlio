"""
Centralna definicija svih Sattlio paketa.

SVE sto se tice paketa (naziv, cijena, opis, funkcionalnosti, limiti) zivi
ovdje, na jednom mjestu. Backend provjere limita ovo koriste direktno;
landing stranica ovo dobija preko GET /api/v1/public/plans (vidi
app/api/routes/public.py) - cijena/opis se vise NE duplira u frontend kodu.

employee_limit = None znaci neograniceno (numericki limit koji backend
stvarno provjerava). employee_limit_label je opisni tekst za prikaz
(npr. "2-4 zaposlena") - moze biti raspon, dok je employee_limit tacan broj
do kojeg se plan smije popuniti.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Plan:
    key: str
    name: str
    price_bam: float | None  # None = po dogovoru
    price_label: str
    employee_limit: int | None  # None = neograniceno
    employee_limit_label: str
    location_limit_label: str
    description: str
    features: tuple[str, ...] = field(default_factory=tuple)
    excluded: tuple[str, ...] = field(default_factory=tuple)
    highlighted: bool = False
    cta_label: str = "Započni probni period"


PLANS: dict[str, Plan] = {
    "trial": Plan(
        key="trial",
        name="Probni period",
        price_bam=0.0,
        price_label="Besplatno",
        # privremeno 20 za betu/testiranje, beta sloj ce ovo kasnije ionako preskakati
        employee_limit=20,
        employee_limit_label="do 20 zaposlenih",
        location_limit_label="1 lokacija",
        description="Isprobajte sve funkcionalnosti besplatno.",
        features=("Sve funkcionalnosti tokom probnog perioda",),
    ),
    "solo": Plan(
        key="solo",
        name="Solo",
        price_bam=19.90,
        price_label="19,90 KM/mj",
        employee_limit=1,
        employee_limit_label="1 zaposleni",
        location_limit_label="1 lokacija",
        description="Salon/obrt sa jednim zaposlenim — najveći segment tržišta (78–80%).",
        features=(
            "Upravljanje zaposlenima, uslugama, klijentima",
            "Vizuelni kalendar rezervacija",
            "Radno vrijeme po zaposlenom",
            "Osnovni dashboard",
            "Neograničen broj rezervacija mjesečno",
        ),
        excluded=("Email notifikacije", "Eksport podataka", "Više lokacija"),
        highlighted=True,
    ),
    "start": Plan(
        key="start",
        name="Start",
        price_bam=39.90,
        price_label="39,90 KM/mj",
        employee_limit=3,
        employee_limit_label="2–4 zaposlena",
        location_limit_label="1 lokacija",
        description="Mali saloni sa nekoliko zaposlenih.",
        features=("Sve iz Solo paketa", "Email notifikacije (uskoro)"),
    ),
    "pro": Plan(
        key="pro",
        name="Pro",
        price_bam=59.90,
        price_label="59,90 KM/mj",
        employee_limit=10,
        employee_limit_label="5–15 zaposlenih",
        location_limit_label="do 3 lokacije",
        description="Srednji poslovni subjekti.",
        features=(
            "Sve iz Start paketa",
            "Napredni dashboard",
            "Izvještaji i eksport podataka",
            "Napredna pretraga",
            "Više lokacija (do 3)",
        ),
    ),
    "business": Plan(
        key="business",
        name="Business",
        price_bam=None,
        price_label="Po dogovoru",
        employee_limit=None,
        employee_limit_label="15+ zaposlenih",
        location_limit_label="Neograničeno lokacija",
        description="Veliki sistemi i lanci — prilagođen pristup pojedinačno.",
        features=("Custom integracije", "Dedicated podrška", "SLA ugovor"),
        cta_label="Kontaktirajte nas",
    ),
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
