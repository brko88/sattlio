"""
Testovi za Employees modul.

Vidi Dokument 04, sekcija 8; Dokument 06, sekcija 8.2 (RBAC pravila).
"""
from conftest import register_and_login, create_tenant, create_employee, auth_headers


def test_owner_can_create_employee(client):
    token = register_and_login(client, email="emp_owner@test.com")
    tenant_id = create_tenant(client, token, name="Emp Test Salon")

    response = client.post(
        "/api/v1/employees",
        json={
            "tenant_id": tenant_id,
            "first_name": "Ivan",
            "last_name": "Ivic",
            "email": "ivan.ivic@test.com",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json()["first_name"] == "Ivan"
    assert response.json()["is_active"] is True


def test_create_employee_without_email_fails(client):
    """Email je obavezan — na njega ide pozivnica za povezivanje naloga."""
    token = register_and_login(client, email="emp_no_email@test.com")
    tenant_id = create_tenant(client, token, name="Bez Email Salon")

    response = client.post(
        "/api/v1/employees",
        json={"tenant_id": tenant_id, "first_name": "Bez", "last_name": "Emaila"},
        headers=auth_headers(token),
    )

    assert response.status_code == 422


def test_non_member_cannot_create_employee(client):
    """Korisnik koji nema NIKAKVU ulogu u tenant-u ne može dodati zaposlenog."""
    owner_token = register_and_login(client, email="real_owner@test.com")
    tenant_id = create_tenant(client, owner_token, name="Tudji Salon")

    outsider_token = register_and_login(client, email="outsider@test.com")

    response = client.post(
        "/api/v1/employees",
        json={
            "tenant_id": tenant_id,
            "first_name": "Upada",
            "last_name": "Silom",
            "email": "upada.silom@test.com",
        },
        headers=auth_headers(outsider_token),
    )

    assert response.status_code == 403


def test_new_tenant_has_owner_as_employee(client):
    """Vlasnik se pri kreiranju salona automatski dodaje kao zaposleni —
    solo frizer mora biti rezervabilan bez ručnog dodavanja samog sebe."""
    token = register_and_login(client, email="empty_list@test.com")
    tenant_id = create_tenant(client, token, name="Prazan Salon")

    response = client.get(
        f"/api/v1/employees?tenant_id={tenant_id}", headers=auth_headers(token)
    )

    assert response.status_code == 200
    employees = response.json()
    assert len(employees) == 1
    # Auto-dodani zaposleni nosi ime vlasnika (iz register_and_login payloada)
    assert employees[0]["first_name"] == "Test"
    assert employees[0]["last_name"] == "Korisnik"


def test_get_employees_returns_created_employee(client):
    token = register_and_login(client, email="list_test@test.com")
    tenant_id = create_tenant(client, token, name="Lista Salon")

    create_employee(client, token, tenant_id, first_name="Marko", last_name="Markovic")

    response = client.get(
        f"/api/v1/employees?tenant_id={tenant_id}", headers=auth_headers(token)
    )

    # Vlasnik (auto-dodan) + Marko
    names = [e["first_name"] for e in response.json()]
    assert len(names) == 2
    assert "Marko" in names
