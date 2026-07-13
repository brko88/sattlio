"""add soft delete to customers

Revision ID: 5fddd7dacdd5
Revises: 0306673aa8b6
Create Date: 2026-07-13 13:16:49.841224

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5fddd7dacdd5'
down_revision: Union[str, Sequence[str], None] = '0306673aa8b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('customers', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('customers', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('customers', 'is_deleted', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('customers', 'deleted_at')
    op.drop_column('customers', 'is_deleted')
