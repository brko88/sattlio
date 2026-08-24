"""add reminder_sent to appointments

Revision ID: 7a1e4c6f9b32
Revises: 9c3f5a1e7d20
Create Date: 2026-08-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a1e4c6f9b32'
down_revision: Union[str, Sequence[str], None] = '9c3f5a1e7d20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Prati da li je email podsjetnik (sat vremena prije termina) vec poslan -
    bez ovoga bi scheduler posao koji se izvrsava na par minuta mogao poslati
    isti podsjetnik vise puta dok je termin unutar prozora podsjecanja.
    """
    op.add_column(
        'appointments',
        sa.Column('reminder_sent', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column('appointments', 'reminder_sent')
