"""add unique constraints to working_hours and special_days

Revision ID: a3f8c1d4e7b2
Revises: e98105c6cecd
Create Date: 2026-07-14 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f8c1d4e7b2'
down_revision: Union[str, Sequence[str], None] = 'e98105c6cecd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(
        'uq_working_hours_tenant_employee_day',
        'working_hours',
        ['tenant_id', 'employee_id', 'day_of_week'],
    )
    op.create_unique_constraint(
        'uq_special_days_tenant_employee_date',
        'special_days',
        ['tenant_id', 'employee_id', 'date'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_special_days_tenant_employee_date', 'special_days', type_='unique')
    op.drop_constraint('uq_working_hours_tenant_employee_day', 'working_hours', type_='unique')
