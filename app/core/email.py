import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

ADMIN_EMAIL = "sattlio.app@gmail.com"


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