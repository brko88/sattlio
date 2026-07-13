"""add cover_url to tenants and avatar_url to employees

Revision ID: 0306673aa8b6
Revises: 943c5604f68c
Create Date: 2026-07-13 08:46:11.555707

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0306673aa8b6'
down_revision: Union[str, Sequence[str], None] = '943c5604f68c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('tenants', sa.Column('cover_url', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('avatar_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('employees', 'avatar_url')
    op.drop_column('tenants', 'cover_url')
