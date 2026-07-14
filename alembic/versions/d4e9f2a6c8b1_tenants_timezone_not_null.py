"""tenants timezone not null

Revision ID: d4e9f2a6c8b1
Revises: a3f8c1d4e7b2
Create Date: 2026-07-14 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e9f2a6c8b1'
down_revision: Union[str, Sequence[str], None] = 'a3f8c1d4e7b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("UPDATE tenants SET timezone = 'Europe/Sarajevo' WHERE timezone IS NULL")
    op.alter_column(
        'tenants', 'timezone',
        existing_type=sa.String(),
        nullable=False,
        server_default='Europe/Sarajevo',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'tenants', 'timezone',
        existing_type=sa.String(),
        nullable=True,
        server_default=None,
    )
