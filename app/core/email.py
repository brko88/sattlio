import smtplib
from datetime import datetime
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from zoneinfo import ZoneInfo

from app.core.config import settings

ADMIN_EMAIL = "podrska@sattlio.com"


def send_email(to_email: str, subject: str, body: str):
    message = MIMEText(body, "plain", "utf-8")
    message["Subject"] = subject
    message["From"] = settings.smtp_user
    message["To"] = to_email

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(message)


def send_verification_email(to_email: str, token: str):
    verify_url = f"{settings.frontend_url}/verify-email?token={token}"
    subject = "Potvrdite svoju email adresu — Sattlio"
    body = (
        f"Pozdrav,\n\n"
        f"Hvala što ste se registrovali na Sattlio platformu.\n\n"
        f"Kliknite na link ispod da potvrdite vašu email adresu:\n"
        f"{verify_url}\n\n"
        f"Link je jednokratan i važi samo za vašu registraciju.\n\n"
        f"Ako se niste registrovali, ignorišite ovaj email."
    )
    send_email(to_email, subject, body)


def send_password_reset_email(to_email: str, token: str):
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    subject = "Reset lozinke — Sattlio"
    body = (
        f"Pozdrav,\n\n"
        f"Primili smo zahtjev za reset lozinke za vaš Sattlio nalog.\n\n"
        f"Kliknite na link ispod da postavite novu lozinku:\n"
        f"{reset_url}\n\n"
        f"Link važi 1 sat.\n\n"
        f"Ako niste zatražili reset lozinke, ignorišite ovaj email."
    )
    send_email(to_email, subject, body)


def send_new_tenant_notification(
    owner_email: str,
    owner_name: str,
    tenant_name: str,
    tenant_city: str | None,
    tenant_plan: str,
    total_tenants: int,
):
    subject = f"🆕 Novi salon registrovan — {tenant_name}"
    body = (
        f"Novi poslovni subjekt je registrovan na Sattlio platformi.\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"DETALJI SALONA\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Naziv:       {tenant_name}\n"
        f"Grad:        {tenant_city or '—'}\n"
        f"Plan:        {tenant_plan}\n\n"
        f"VLASNIK\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Ime:         {owner_name}\n"
        f"Email:       {owner_email}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Ukupno salona na platformi: {total_tenants}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"Admin panel: {settings.frontend_url}/admin/tenants"
    )
    try:
        send_email(ADMIN_EMAIL, subject, body)
    except Exception as e:
        import logging
        logging.error(f"Notifikacija nije poslana: {e}")

def send_appointment_cancelled_email(
    to_email: str,
    customer_name: str,
    service_name: str,
    tenant_name: str,
    start_time: datetime,
    reason: str | None,
    tenant_timezone: str = "Europe/Sarajevo",
):
    local_time = start_time.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo(tenant_timezone))
    formatted_time = local_time.strftime("%d.%m.%Y. u %H:%M")
    subject = f"Vaš termin je otkazan — {tenant_name}"
    reason_line = f"\nRazlog otkazivanja: {reason}\n" if reason else ""
    body = (
        f"Pozdrav {customer_name},\n\n"
        f"Obavještavamo vas da je vaš termin za uslugu \"{service_name}\" "
        f"zakazan za {formatted_time} u salonu \"{tenant_name}\" otkazan.\n"
        f"{reason_line}\n"
        f"Za novi termin, slobodno nas kontaktirajte ili zakažite ponovo preko platforme.\n\n"
        f"Izvinjavamo se zbog neugodnosti."
    )
    send_email(to_email, subject, body)


def send_support_request_email(
    user_email: str,
    user_name: str,
    subject: str,
    message: str,
    screenshot_bytes: bytes | None = None,
    screenshot_filename: str | None = None,
    screenshot_subtype: str | None = None,
):
    email_subject = f"[Prijava problema] {subject}"
    attachment_line = f"\nPriložen je screenshot ({screenshot_filename}).\n" if screenshot_bytes else ""
    body = (
        f"Nova prijava problema sa Sattlio platforme.\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"OD\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Ime:   {user_name or '—'}\n"
        f"Email: {user_email}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"PORUKA\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"{message}\n"
        f"{attachment_line}"
    )

    msg = MIMEMultipart()
    msg["Subject"] = email_subject
    msg["From"] = settings.smtp_user
    msg["To"] = ADMIN_EMAIL
    msg["Reply-To"] = user_email
    msg.attach(MIMEText(body, "plain", "utf-8"))

    if screenshot_bytes:
        image = MIMEImage(screenshot_bytes, _subtype=screenshot_subtype or "jpeg")
        image.add_header("Content-Disposition", "attachment", filename=screenshot_filename or "screenshot.jpg")
        msg.attach(image)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


def send_employee_invitation_email(to_email: str, employee_name: str, tenant_name: str):
    register_url = f"{settings.frontend_url}/register"
    subject = f"Dodani ste kao zaposleni — {tenant_name}"
    body = (
        f"Pozdrav {employee_name},\n\n"
        f"Dodani ste kao zaposleni u salon \"{tenant_name}\" na Sattlio platformi.\n\n"
        f"Da biste pristupili svom rasporedu i rezervacijama, registrujte se "
        f"koristeci OVU email adresu ({to_email}):\n"
        f"{register_url}\n\n"
        f"Vazno: obavezno se registrujte sa ovom email adresom, jer se tako "
        f"automatski povezujete sa salonom.\n\n"
        f"Ako mislite da je ovo greska, slobodno ignorisite ovaj email."
    )
    try:
        send_email(to_email, subject, body)
    except Exception as e:
        import logging
        logging.error(f"Employee invitation email nije poslan: {e}")
