"""
Pytest konfiguracija i zajedničke fixture funkcije.

Koristi odvojenu, privremenu SQLite bazu za testove - NE dira
stvarnu PostgreSQL bazu (smartbooking). Vidi Dokument 11, sekcija 16:
"Test podaci ne smiju koristiti produkcijske podatke."
"""
import time
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.limiter import limiter
from app.models.user import User
import app.core.email as email_module

limiter.enabled = False

TEST_DATABASE_URL = "sqlite:///./test_smartbooking.db"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Kreira sve tabele prije testova, briše ih nakon."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    time.sleep(0.1)
    try:
        if os.path.exists("test_smartbooking.db"):
            os.remove("test_smartbooking.db")
    except PermissionError:
        pass  # Windows file lock - nije kritično


@pytest.fixture(autouse=True)
def disable_real_email_sending(monkeypatch):
    """
    Sprečava testove da šalju stvarne email-ove kroz Gmail SMTP.
    Standardna praksa: eksterni servisi se simuliraju ("mock") u testovima.
    """
    def fake_send_email(to_email, subject, body):
        pass

    def fake_send_verification_email(to_email, token):
        pass

    monkeypatch.setattr(email_module, "send_email", fake_send_email)
    monkeypatch.setattr(email_module, "send_verification_email", fake_send_verification_email)

    import app.api.routes.auth as auth_module
    monkeypatch.setattr(auth_module, "send_verification_email", fake_send_verification_email)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    session = TestSessionLocal()
    yield session
    session.close()


def register_and_login(client, email="test@example.com", password="lozinka123"):
    """Pomoćna funkcija: registruje korisnika, potvrđuje email (mimo API-ja, direktno u testnoj bazi) i vraća access_token."""
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "first_name": "Test", "last_name": "Korisnik"},
    )

    session = TestSessionLocal()
    user = session.query(User).filter(User.email == email).first()
    if user:
        user.email_verified = True
        session.commit()
    session.close()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    token = login_response.json()["access_token"]
    return token


_jib_counter = [1000000000000]


def create_tenant(client, token, name="Test Salon"):
    """Pomoćna funkcija: kreira tenant, vraća tenant_id."""
    _jib_counter[0] += 1
    response = client.post(
        "/api/v1/tenants",
        json={"name": name, "city": "Banja Luka", "jib": str(_jib_counter[0])},
        headers={"Authorization": f"Bearer {token}"},
    )
    return response.json()["id"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}