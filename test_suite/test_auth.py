"""
Testovi autentifikacije.

Pokriva: registraciju, login, duplikat email, pogrešnu lozinku,
JWT validaciju, zaštićene rute.

Vidi Dokument 11, sekcija 10 (Authentication Testing).
"""
from conftest import register_and_login, auth_headers


def test_register_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "novi@test.com", "password": "lozinka123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "novi@test.com"
    assert data["email_verified"] is False
    # Lozinka se nikad ne vraća u odgovoru
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "duplikat@test.com", "password": "lozinka123"},
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "duplikat@test.com", "password": "drugalozinka"},
    )
    assert response.status_code == 400
    assert "već registrovan" in response.json()["detail"]


def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "login_test@test.com", "password": "lozinka123"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login_test@test.com", "password": "lozinka123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpass@test.com", "password": "lozinka123"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@test.com", "password": "pogresna"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user_fails(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nepostoji@test.com", "password": "bilokoja"},
    )
    assert response.status_code == 401


def test_protected_route_without_token_fails(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_protected_route_with_invalid_token_fails(client):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer ovo-nije-validan-token"},
    )
    assert response.status_code == 401


def test_protected_route_with_valid_token_succeeds(client):
    token = register_and_login(client, email="validtoken@test.com")
    response = client.get("/api/v1/auth/me", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["email"] == "validtoken@test.com"


def test_verify_email_with_invalid_token_fails(client):
    response = client.post(
        "/api/v1/auth/verify-email", json={"token": "neispravan-token-xyz"}
    )
    assert response.status_code == 400


def test_refresh_token_rotation(client):
    """Refresh token mora izdati nov token i poništiti stari (Dokument 06, sekcija 5)."""
    token = register_and_login(client, email="refresh_test@test.com")

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "refresh_test@test.com", "password": "lozinka123"},
    )
    refresh_token = login_response.json()["refresh_token"]

    # Prva upotreba refresh tokena - treba da uspije
    response1 = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert response1.status_code == 200
    assert "access_token" in response1.json()

    # Druga upotreba ISTOG refresh tokena - mora pasti (rotacija)
    response2 = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert response2.status_code == 401
