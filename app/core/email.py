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
    subject = "Potvrdite svoju email adresu — SmartBooking"
    body = (
        f"Pozdrav,\n\n"
        f"Hvala što ste se registrovali na SmartBooking platformu.\n"
        f"Vaš verifikacioni kod je: {token}\n\n"
        f"Ako se niste registrovali, ignorišite ovaj email."
    )
    send_email(to_email, subject, body)