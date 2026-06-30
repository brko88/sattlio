import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


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
    subject = "Potvrdite svoju email adresu — Sattlio"
    body = (
        f"Pozdrav,\n\n"
        f"Hvala sto ste se registrovali na Sattlio platformu.\n"
        f"Vas verifikacioni kod je: {token}\n\n"
        f"Ako se niste registrovali, ignorisite ovaj email."
    )
    send_email(to_email, subject, body)


def send_password_reset_email(to_email: str, token: str):
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    subject = "Reset lozinke — Sattlio"
    body = (
        f"Pozdrav,\n\n"
        f"Primili smo zahtjev za reset lozinke za vas Sattlio nalog.\n\n"
        f"Kliknite na link ispod da postavite novu lozinku:\n"
        f"{reset_url}\n\n"
        f"Link vazi 1 sat.\n\n"
        f"Ako niste zatrazili reset lozinke, ignorisite ovaj email."
    )
    send_email(to_email, subject, body)
