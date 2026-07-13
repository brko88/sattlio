"""add phone to users

Revision ID: 943c5604f68c
Revises: aeab20c9c805
Create Date: 2026-07-13 08:30:03.090841

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '943c5604f68c'
down_revision: Union[str, Sequence[str], None] = 'aeab20c9c805'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'phone')
