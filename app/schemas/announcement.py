from datetime import datetime

from pydantic import BaseModel, Field


class AnnouncementResponse(BaseModel):
    id: int
    kind: str
    message: str
    is_active: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class AnnouncementCreate(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    is_active: bool = False


class AnnouncementUpdate(BaseModel):
    message: str | None = Field(default=None, min_length=1, max_length=500)
    is_active: bool | None = None
