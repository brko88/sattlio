"""add appointment price snapshot

Revision ID: 562fc886480b
Revises: 1608ba7197cf
Create Date: 2026-08-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '562fc886480b'
down_revision: Union[str, Sequence[str], None] = '1608ba7197cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Snimak cijene usluge U TRENUTKU kreiranja termina - ne live spoj na
    Service.price. NULL za postojece termine (istorijska cijena za njih nije
    zabiljezena i ne moze se pouzdano rekonstruisati ako se cjenovnik ikad
    promijenio otad).
    """
    op.add_column('appointments', sa.Column('price', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('appointments', 'price')
