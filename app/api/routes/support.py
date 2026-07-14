from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from app.core.email import send_support_request_email
from app.core.limiter import limiter
from app.core.media import ALLOWED_CONTENT_TYPES
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/support", tags=["support"])

MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024


@router.post("/report-issue")
@limiter.limit("5/minute")
async def report_issue(
    request: Request,
    subject: str = Form(..., max_length=100),
    message: str = Form(..., max_length=2000),
    screenshot: UploadFile | None = File(None),
    current_user: User = Depends(get_current_user),
):
    screenshot_bytes = None
    screenshot_filename = None
    screenshot_subtype = None

    if screenshot is not None:
        if screenshot.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Screenshot mora biti JPG, PNG ili WEBP.")
        raw = await screenshot.read()
        if len(raw) > MAX_SCREENSHOT_BYTES:
            raise HTTPException(status_code=400, detail="Slika je prevelika. Maksimalno 5 MB.")
        screenshot_bytes = raw
        screenshot_filename = screenshot.filename or "screenshot.jpg"
        screenshot_subtype = screenshot.content_type.split("/")[1]

    user_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
    try:
        send_support_request_email(
            current_user.email, user_name, subject, message,
            screenshot_bytes, screenshot_filename, screenshot_subtype,
        )
    except Exception as e:
        import logging
        logging.error(f"Prijava problema nije poslana: {e}")
        raise HTTPException(
            status_code=503,
            detail="Slanje prijave trenutno nije moguće. Pokušajte ponovo kasnije ili nam pišite direktno na podrska@sattlio.com.",
        )

    return {"detail": "Prijava je poslana. Javićemo se uskoro."}
