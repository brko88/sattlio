"""
Testovi autentifikacije.

Pokriva: registraciju, login, duplikat email, pogrešnu lozinku,
JWT validaciju, zaštićene rute, refresh token cookie rotaciju.

Vidi Dokument 11, sekcija 10 (Authentication Testing).
"""
from conftest import register_and_login, auth_headers


def register_payload(email, password="lozinka123"):
    """Kompletan registracioni payload — schema zahtijeva ime, prezime i uslove."""
    return {
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "Korisnik",
        "terms_accepted": True,
    }


def test_register_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json=register_payload("novi@test.com"),
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
        json=register_payload("duplikat@test.com"),
    )
    response = client.post(
        "/api/v1/auth/register",
        json=register_payload("duplikat@test.com", password="drugalozinka"),
    )
    assert response.status_code == 400
    assert "već registrovan" in response.json()["detail"]


def test_register_weak_password_fails(client):
    """Lozinka kraća od 8 karaktera se odbija na registraciji (security audit H1)."""
    response = client.post(
        "/api/v1/auth/register",
        json=register_payload("slaba@test.com", password="kratka"),
    )
    assert response.status_code == 422
    assert "8 karaktera" in response.json()["detail"]


def test_register_without_terms_fails(client):
    payload = register_payload("bezuslova@test.com")
    payload["terms_accepted"] = False
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json=register_payload("login_test@test.com"),
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login_test@test.com", "password": "lozinka123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    # Refresh token NE smije biti u tijelu odgovora — živi isključivo u
    # httpOnly kolačiću (vidi _set_refresh_cookie u auth.py).
    assert "refresh_token" not in data
    assert "refresh_token" in response.cookies


def test_login_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json=register_payload("wrongpass@test.com"),
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@test.com", "password": "pogresna1"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user_fails(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nepostoji@test.com", "password": "bilokoja1"},
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
    """
    Refresh mora izdati nov token i poništiti stari (Dokument 06, sekcija 5).
    Token putuje isključivo kroz httpOnly cookie: login ga postavlja, refresh
    ga čita iz kolačića (ne iz tijela) i u odgovoru postavlja novi.
    """
    register_and_login(client, email="refresh_test@test.com")

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "refresh_test@test.com", "password": "lozinka123"},
    )
    old_cookie = login_response.cookies["refresh_token"]

    # Prva upotreba refresh tokena - treba da uspije i rotira cookie
    client.cookies.set("refresh_token", old_cookie)
    response1 = client.post("/api/v1/auth/refresh")
    assert response1.status_code == 200
    assert "access_token" in response1.json()
    new_cookie = response1.cookies["refresh_token"]
    assert new_cookie != old_cookie

    # Druga upotreba STAROG tokena - mora pasti (rotacija ga je poništila)
    client.cookies.set("refresh_token", old_cookie)
    response2 = client.post("/api/v1/auth/refresh")
    assert response2.status_code == 401

    # Novi (rotirani) token je replay-em starog poništen zajedno sa cijelom
    # porodicom (family_id replay detekcija) - i on mora biti mrtav.
    client.cookies.set("refresh_token", new_cookie)
    response3 = client.post("/api/v1/auth/refresh")
    assert response3.status_code == 401
