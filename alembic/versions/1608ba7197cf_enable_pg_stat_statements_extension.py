"""enable pg_stat_statements extension

Revision ID: 1608ba7197cf
Revises: 81498d5145ae
Create Date: 2026-07-19 12:29:56.243313

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1608ba7197cf'
down_revision: Union[str, Sequence[str], None] = '81498d5145ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Kreira pg_stat_statements ekstenziju - agregirana statistika upita
    (calls/mean_exec_time/total_exec_time), bolje od rucnog
    log_min_duration_statement za performance monitoring.

    Ekstenzija ZAHTIJEVA da je 'pg_stat_statements' vec u
    shared_preload_libraries (postavlja se pri startu Postgres-a, ne moze
    ovdje - vidi docker-compose.yml `command:` za db servis). Ako nije
    preload-ovan (npr. buduci managed Postgres bez tog pristupa), CREATE
    EXTENSION bi pukao i srusio cijeli 'alembic upgrade' - zato prvo
    provjeravamo i tiho preskacemo umjesto da migracija padne.
    """
    bind = op.get_bind()
    preload = bind.execute(sa.text("SHOW shared_preload_libraries")).scalar() or ""
    if "pg_stat_statements" in preload:
        op.execute("CREATE EXTENSION IF NOT EXISTS pg_stat_statements")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP EXTENSION IF EXISTS pg_stat_statements")
