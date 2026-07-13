"""add terms_accepted_at to users

Revision ID: e98105c6cecd
Revises: 5fddd7dacdd5
Create Date: 2026-07-13 14:24:09.148526

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e98105c6cecd'
down_revision: Union[str, Sequence[str], None] = '5fddd7dacdd5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('terms_accepted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'terms_accepted_at')
