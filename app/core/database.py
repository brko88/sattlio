from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    # SQLAlchemy default (pool_size=5 + max_overflow=10 = 15) je bio usko
    # grlo pod opterecenjem: sa vise istovremenih zahtjeva nego slobodnih
    # konekcija, ostatak ceka u redu (pool_timeout, default 30s) dok baza
    # sama ostaje skoro besposlena. 20 po worker procesu x 4 workera
    # (vidi Dockerfile --workers 4) = maksimalno 80 konekcija, sigurno ispod
    # Postgres-ovog max_connections=100 (default), sa rezervom za
    # healthcheck/admin alate.
    pool_size=10,
    max_overflow=10,
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