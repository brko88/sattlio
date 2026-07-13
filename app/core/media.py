import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps

MEDIA_ROOT = Path("media")
MEDIA_URL_PREFIX = "/api/media"

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _open_and_normalize(raw: bytes) -> Image.Image:
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception:
        raise HTTPException(status_code=400, detail="Fajl nije validna slika (JPG, PNG ili WEBP).")
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
    return img


def _center_crop_square(img: Image.Image) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def _center_crop_ratio(img: Image.Image, ratio: float) -> Image.Image:
    """ratio = width / height"""
    w, h = img.size
    target_h = w / ratio
    if target_h <= h:
        new_w, new_h = w, target_h
    else:
        new_w, new_h = h * ratio, h
    left = (w - new_w) / 2
    top = (h - new_h) / 2
    return img.crop((int(left), int(top), int(left + new_w), int(top + new_h)))


async def process_and_save_image(
    file: UploadFile,
    subdir: str,
    prefix: str,
    max_bytes: int,
    square_size: int | None = None,
    banner_size: tuple[int, int] | None = None,
) -> str:
    """
    Validira, obrezuje (centrirano) i cuva sliku kao WEBP.
    square_size: ako je zadan, slika se centrirano obrezuje u kvadrat i skalira na square_size x square_size.
    banner_size: (width, height) - ako je zadano, slika se centrirano obrezuje na taj odnos stranica i skalira.
    Vraca relativni URL (npr. /api/media/tenants/5/logo_ab12cd34.webp) koji se cuva u bazi.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Dozvoljeni formati: JPG, PNG, WEBP.")

    raw = await file.read()
    if len(raw) > max_bytes:
        raise HTTPException(status_code=400, detail=f"Fajl je prevelik. Maksimalno {max_bytes // (1024 * 1024)} MB.")

    img = _open_and_normalize(raw)

    if square_size is not None:
        img = _center_crop_square(img)
        img = img.resize((square_size, square_size), Image.LANCZOS)
    elif banner_size is not None:
        width, height = banner_size
        img = _center_crop_ratio(img, width / height)
        img = img.resize((width, height), Image.LANCZOS)

    target_dir = MEDIA_ROOT / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{uuid.uuid4().hex[:10]}.webp"
    img.save(target_dir / filename, "WEBP", quality=85)

    return f"{MEDIA_URL_PREFIX}/{subdir}/{filename}"


def delete_media_file(url: str | None) -> None:
    """Obrise stari fajl sa diska ako url pokazuje na nasu media putanju - bez greske ako ne postoji."""
    if not url or not url.startswith(MEDIA_URL_PREFIX):
        return
    relative = url[len(MEDIA_URL_PREFIX):].lstrip("/")
    path = MEDIA_ROOT / relative
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass
