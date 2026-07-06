"""add break times to working hours

Revision ID: 3f10b9b8ca0e
Revises: a2ecdbcf310c
Create Date: 2026-07-06 10:30:00.611892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f10b9b8ca0e'
down_revision: Union[str, Sequence[str], None] = 'a2ecdbcf310c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('working_hours', sa.Column('break_start', sa.Time(), nullable=True))
    op.add_column('working_hours', sa.Column('break_end', sa.Time(), nullable=True))


def downgrade() -> None:
    op.drop_column('working_hours', 'break_end')
    op.drop_column('working_hours', 'break_start')
