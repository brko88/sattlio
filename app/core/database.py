from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    # SQLAlchemy default (pool_size=5 + max_overflow=10 = 15) je bio usko
    # grlo pod opterecenjem: sa vise istovremenih zahtjeva nego slobodnih
    # konekcija, ostatak ceka u redu dok baza sama ostaje skoro besposlena.
    #
    # VAZNO: pool je PO WORKER PROCESU, ne dijeljen. Stress test (21.07.2026.)
    # je pokazao da se svaki worker zaglavi na SVOJIH 20 konekcija i onda baca
    # "QueuePool limit of size 10 overflow 10 reached" - iako je baza mirna.
    # 40 po workeru x 4 workera (vidi Dockerfile --workers 4) = maksimalno 160,
    # ispod Postgres max_connections=200 (postavljen u docker-compose.yml),
    # sa rezervom od 40 za healthcheck/migracije/psql.
    pool_size=20,
    max_overflow=20,
    # Default je 30s. Zahtjev koji je 30 sekundi cekao slobodnu konekciju je
    # ionako izgubljen - korisnik je odavno odustao - a dotle drzi worker nit
    # zauzetu i pogorsava zagusenje. Bolje brzo odustati i vratiti 503 sa
    # Retry-After (vidi handler u app/main.py) nego dugo visiti pa baciti 500.
    pool_timeout=10,
)

if engine.dialect.name == "postgresql":
    @event.listens_for(engine, "connect")
    def set_utc_timezone(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("SET TIME ZONE 'UTC'")
        cursor.close()
        # SET je transakciono osjetljivo — bez commit-a, pool-ov reset-on-return
        # (ROLLBACK pri vraćanju konekcije u pool) poništi ovu promjenu nakon prvog
        # zahtjeva na toj konekciji, pa se sesija vraća na default (server) timezone.
        dbapi_connection.commit()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()