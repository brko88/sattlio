from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
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