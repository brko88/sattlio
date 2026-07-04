"""add slot_duration_minutes to tenants

Revision ID: 78b3404cdf6d
Revises: 3159285c4ee7
Create Date: 2026-07-03 12:04:20.979294

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78b3404cdf6d'
down_revision: Union[str, Sequence[str], None] = '3159285c4ee7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tenants', sa.Column('slot_duration_minutes', sa.Integer(), nullable=False, server_default='30'))


def downgrade() -> None:
    op.drop_column('tenants', 'slot_duration_minutes')