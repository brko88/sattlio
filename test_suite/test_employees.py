"""
Testovi za Employees modul.

Vidi Dokument 04, sekcija 8; Dokument 06, sekcija 8.2 (RBAC pravila).
"""
from conftest import register_and_login, create_tenant, auth_headers


def test_owner_can_create_employee(client):
    token = register_and_login(client, email="emp_owner@test.com")
    tenant_id = create_tenant(client, token, name="Emp Test Salon")

    response = client.post(
        "/api/v1/employees",
        json={"tenant_id": tenant_id, "first_name": "Ivan", "last_name": "Ivic"},
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json()["first_name"] == "Ivan"
    assert response.json()["is_active"] is True


def test_non_member_cannot_create_employee(client):
    """Korisnik koji nema NIKAKVU ulogu u tenant-u ne može dodati zaposlenog."""
    owner_token = register_and_login(client, email="real_owner@test.com")
    tenant_id = create_tenant(client, owner_token, name="Tudji Salon")

    outsider_token = register_and_login(client, email="outsider@test.com")

    response = client.post(
        "/api/v1/employees",
        json={"tenant_id": tenant_id, "first_name": "Upada", "last_name": "Silom"},
        headers=auth_headers(outsider_token),
    )

    assert response.status_code == 403


def test_get_employees_empty_list_for_new_tenant(client):
    token = register_and_login(client, email="empty_list@test.com")
    tenant_id = create_tenant(client, token, name="Prazan Salon")

    response = client.get(
        f"/api/v1/employees?tenant_id={tenant_id}", headers=auth_headers(token)
    )

    assert response.status_code == 200
    assert response.json() == []


def test_get_employees_returns_created_employee(client):
    token = register_and_login(client, email="list_test@test.com")
    tenant_id = create_tenant(client, token, name="Lista Salon")

    client.post(
        "/api/v1/employees",
        json={"tenant_id": tenant_id, "first_name": "Marko", "last_name": "Markovic"},
        headers=auth_headers(token),
    )

    response = client.get(
        f"/api/v1/employees?tenant_id={tenant_id}", headers=auth_headers(token)
    )

    assert len(response.json()) == 1
    assert response.json()[0]["first_name"] == "Marko"
