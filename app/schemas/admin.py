from datetime import datetime

from pydantic import BaseModel


class AdminUserTenantInfo(BaseModel):
    tenant_id: int
    tenant_name: str
    role: str


class AdminUserResponse(BaseModel):
    id: int
    email: str
    first_name: str | None
    last_name: str | None
    email_verified: bool
    is_active: bool
    is_superadmin: bool
    is_internal_tester: bool = False
    created_at: datetime
    tenants: list[AdminUserTenantInfo]
