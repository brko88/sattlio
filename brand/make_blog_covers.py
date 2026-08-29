"""
Generise cover ilustracije za blog postove (frontend/public/blog/*.png).

Flat/geometrijski stil (rounded rect + krugovi + linije), iste boje kao
ostatak brenda (BLUE #2563EB, SLATE_800 #1E293B, docs/24_Brand_Identity_
Design_System.md). Namjerno bez teksta/screenshotova stvarnog UI-ja - ovo su
apstraktne ilustracije uz naslov posta, ne prikaz konkretne funkcionalnosti
(da se izbjegne implicirati necajanje koje ne postoji, npr. status "potvrdjeno").

Supersampling 2x pa LANCZOS smanjenje - isti obrazac kao make_full_logo.py.
"""
from PIL import Image, ImageDraw

BLUE = (37, 99, 235)
BLUE_LIGHT = (219, 234, 254)
SLATE_800 = (30, 41, 59)
SLATE_400 = (148, 163, 184)
SLATE_200 = (226, 232, 240)
WHITE = (255, 255, 255)
GREEN = (34, 197, 94)
RED = (239, 68, 68)
AMBER = (245, 158, 11)

SCALE = 2
FINAL_W, FINAL_H = 1200, 630
W, H = FINAL_W * SCALE, FINAL_H * SCALE


def new_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(img)
    # Pozadinski "stage" panel - svijetlo plava zaobljena podloga iza ikonica
    margin = int(H * 0.10)
    draw.rounded_rectangle(
        (margin, margin, W - margin, H - margin),
        radius=int(H * 0.08),
        fill=BLUE_LIGHT,
    )
    return img, draw


def save(img: Image.Image, slug: str) -> None:
    # NAPOMENA: folder mora biti "blog-covers", NE "blog" - potonje bi u
    # build-u napravilo stvaran direktorijum koji se kosi sa React rutom
    # /blog i pravi nginx da vrati 403 umjesto SPA stranice (otkriveno
    # 29.08.2026. odmah nakon prvog produkcijskog deploya).
    final = img.resize((FINAL_W, FINAL_H), Image.LANCZOS)
    path = f"D:/SmartBooking Platform/frontend/public/blog-covers/{slug}.png"
    final.save(path)
    print(f"Sacuvano: {path}")


def draw_checkmark(draw, cx, cy, r, color, width):
    draw.line(
        [(cx - r * 0.5, cy), (cx - r * 0.15, cy + r * 0.4), (cx + r * 0.55, cy - r * 0.45)],
        fill=color, width=width, joint="curve",
    )


def draw_x(draw, cx, cy, r, color, width):
    draw.line([(cx - r, cy - r), (cx + r, cy + r)], fill=color, width=width)
    draw.line([(cx - r, cy + r), (cx + r, cy - r)], fill=color, width=width)


def draw_bell_badge(draw, cx, cy, r):
    """Zvonce (podsjetnik) u kruznom amber baloncicu."""
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=AMBER)
    bell_w = r * 0.9
    bell_h = r * 0.8
    top = cy - bell_h * 0.55
    draw.pieslice(
        (cx - bell_w / 2, top, cx + bell_w / 2, top + bell_h),
        start=180, end=360, fill=WHITE,
    )
    draw.rectangle((cx - bell_w / 2, top + bell_h / 2, cx + bell_w / 2, top + bell_h * 0.85), fill=WHITE)
    draw.rectangle((cx - bell_w * 0.65, top + bell_h * 0.82, cx + bell_w * 0.65, top + bell_h * 0.95), fill=WHITE)
    clapper_r = bell_h * 0.12
    draw.ellipse(
        (cx - clapper_r, top + bell_h * 0.95, cx + clapper_r, top + bell_h * 0.95 + clapper_r * 2),
        fill=WHITE,
    )


def draw_calendar(draw, x0, y0, w, h, marks=None):
    """Kalendar kartica: bijelo tijelo, plavi header, mreza dana.
    marks: opciono {(row, col): "check"|"x"} za obiljezavanje pojedinih dana.
    """
    radius = int(w * 0.06)
    draw.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=radius, fill=WHITE, outline=SLATE_200, width=int(w * 0.01))
    header_h = h * 0.24
    draw.rounded_rectangle((x0, y0, x0 + w, y0 + header_h + radius), radius=radius, fill=BLUE)
    draw.rectangle((x0, y0 + header_h - radius, x0 + w, y0 + header_h + radius), fill=BLUE)
    draw.rectangle((x0, y0 + header_h, x0 + w, y0 + header_h + 1), fill=BLUE)

    cols, rows = 4, 3
    pad = w * 0.10
    grid_x0, grid_y0 = x0 + pad, y0 + header_h + pad * 0.7
    grid_w, grid_h = w - pad * 2, h - header_h - pad * 1.4
    cell_w, cell_h = grid_w / cols, grid_h / rows
    gap = cell_w * 0.18

    marks = marks or {}
    for row in range(rows):
        for col in range(cols):
            cx0 = grid_x0 + col * cell_w + gap / 2
            cy0 = grid_y0 + row * cell_h + gap / 2
            cx1 = cx0 + cell_w - gap
            cy1 = cy0 + cell_h - gap
            mark = marks.get((row, col))
            fill = SLATE_200
            if mark == "x":
                fill = (254, 226, 226)
            elif mark == "check":
                fill = (220, 252, 231)
            draw.rounded_rectangle((cx0, cy0, cx1, cy1), radius=cell_w * 0.15, fill=fill)
            ccx, ccy = (cx0 + cx1) / 2, (cy0 + cy1) / 2
            r = min(cell_w, cell_h) * 0.22
            if mark == "x":
                draw_x(draw, ccx, ccy, r, RED, max(2, int(w * 0.012)))
            elif mark == "check":
                draw_checkmark(draw, ccx, ccy, r * 1.3, GREEN, max(2, int(w * 0.012)))


def draw_phone(draw, cx, cy, w, h):
    x0, y0 = cx - w / 2, cy - h / 2
    x1, y1 = cx + w / 2, cy + h / 2
    radius = w * 0.18
    draw.rounded_rectangle((x0, y0, x1, y1), radius=radius, fill=SLATE_800)
    screen_pad_x, screen_pad_top, screen_pad_bottom = w * 0.10, h * 0.08, h * 0.14
    draw.rounded_rectangle(
        (x0 + screen_pad_x, y0 + screen_pad_top, x1 - screen_pad_x, y1 - screen_pad_bottom),
        radius=radius * 0.4, fill=(71, 85, 105),
    )
    button_r = w * 0.06
    draw.ellipse((cx - button_r, y1 - h * 0.075 - button_r, cx + button_r, y1 - h * 0.075 + button_r), outline=WHITE, width=max(2, int(w * 0.02)))


def draw_chat_bubble(draw, cx, cy, w, h, fill):
    """Oblacic poruke (Instagram/Viber) - zaobljen pravougaonik + rep + tri tacke."""
    x0, y0 = cx - w / 2, cy - h / 2
    x1, y1 = cx + w / 2, cy + h / 2
    radius = h * 0.30
    draw.rounded_rectangle((x0, y0, x1, y1), radius=radius, fill=fill)
    tail = h * 0.22
    draw.polygon(
        [(x0 + w * 0.22, y1 - h * 0.02), (x0 + w * 0.22, y1 + tail), (x0 + w * 0.42, y1 - h * 0.02)],
        fill=fill,
    )
    dot_r = h * 0.07
    for i in (-1, 0, 1):
        dcx = cx + i * dot_r * 3
        draw.ellipse((dcx - dot_r, cy - dot_r, dcx + dot_r, cy + dot_r), fill=WHITE)


def draw_arrow_right(draw, x0, y, length, color, width):
    x1 = x0 + length
    draw.line([(x0, y), (x1, y)], fill=color, width=width)
    head = length * 0.22
    draw.line([(x1 - head, y - head), (x1, y)], fill=color, width=width)
    draw.line([(x1 - head, y + head), (x1, y)], fill=color, width=width)


# ---------------------------------------------------------------------------
# Post 1: online-zakazivanje-vs-telefon — telefon (lijevo) -> strelica -> kalendar (desno)
# ---------------------------------------------------------------------------
img, draw = new_canvas()
cy = H / 2
draw_phone(draw, cx=W * 0.24, cy=cy, w=W * 0.13, h=H * 0.42)
draw_arrow_right(draw, x0=W * 0.36, y=cy, length=W * 0.14, color=SLATE_400, width=int(H * 0.012))
cal_w, cal_h = W * 0.30, H * 0.52
draw_calendar(draw, x0=W * 0.58, y0=cy - cal_h / 2, w=cal_w, h=cal_h, marks={(1, 1): "check"})
save(img, "online-zakazivanje-vs-telefon")

# ---------------------------------------------------------------------------
# Post 2: smanjiti-nedolaske-na-termine — kalendar sa oznacenim danima + zvonce (podsjetnik)
# ---------------------------------------------------------------------------
img, draw = new_canvas()
cal_w, cal_h = W * 0.40, H * 0.62
cal_x0, cal_y0 = W / 2 - cal_w / 2, H / 2 - cal_h / 2
draw_calendar(draw, x0=cal_x0, y0=cal_y0, w=cal_w, h=cal_h, marks={(0, 2): "x", (1, 0): "check", (2, 3): "check"})
draw_bell_badge(draw, cx=cal_x0 + cal_w * 0.96, cy=cal_y0 + cal_h * 0.04, r=H * 0.075)
save(img, "smanjiti-nedolaske-na-termine")

# ---------------------------------------------------------------------------
# Post 3: zasto-salon-treba-online-rezervacije — rasuti kanali (poruke/telefon)
# u pozadini konvergiraju ka jednom kalendaru u prvom planu.
# ---------------------------------------------------------------------------
img, draw = new_canvas()
draw_chat_bubble(draw, cx=W * 0.24, cy=H * 0.28, w=W * 0.15, h=H * 0.16, fill=SLATE_400)
draw_chat_bubble(draw, cx=W * 0.78, cy=H * 0.30, w=W * 0.13, h=H * 0.14, fill=SLATE_400)
draw_phone(draw, cx=W * 0.20, cy=H * 0.72, w=W * 0.08, h=H * 0.26)
cal_w, cal_h = W * 0.34, H * 0.56
draw_calendar(draw, x0=W / 2 - cal_w / 2, y0=H / 2 - cal_h / 2, w=cal_w, h=cal_h, marks={(1, 1): "check", (1, 2): "check"})
save(img, "zasto-salon-treba-online-rezervacije")

print("Gotovo.")
