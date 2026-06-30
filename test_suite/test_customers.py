"""
Testovi za Customers modul.

Vidi Dokument 10, BR-050, BR-051, BR-052 (email/telefon opcioni, ime/prezime obavezni).
"""
from conftest import register_and_login, create_tenant, auth_headers


def test_create_customer_without_email_or_phone(client):
    """BR-050, BR-051: klijent može postojati bez email/telefona."""
    token = register_and_login(client, email="cust_owner@test.com")
    tenant_id = create_tenant(client, token, name="Cust Test Salon")

    response = client.post(
        "/api/v1/customers",
        json={"tenant_id": tenant_id, "first_name": "Petar", "last_name": "Petrovic"},
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json()["phone"] is None
    assert response.json()["email"] is None


def test_create_customer_requires_first_and_last_name(client):
    """BR-052: ime i prezime su obavezni."""
    token = register_and_login(client, email="cust_validation@test.com")
    tenant_id = create_tenant(client, token, name="Cust Validation Salon")

    response = client.post(
        "/api/v1/customers",
        json={"tenant_id": tenant_id, "first_name": "Samo Ime"},
        headers=auth_headers(token),
    )

    assert response.status_code == 422


def test_employee_role_can_create_customer(client):
    """Customers ruta koristi require_member, ne require_owner -
    i employee treba moći dodati klijenta (npr. na recepciji)."""
    token = register_and_login(client, email="cust_member_test@test.com")
    tenant_id = create_tenant(client, token, name="Member Test Salon")

    response = client.post(
        "/api/v1/customers",
        json={"tenant_id": tenant_id, "first_name": "Ana", "last_name": "Anic"},
        headers=auth_headers(token),
    )

    assert response.status_code == 200


def test_customer_search_by_name(client):
    token = register_and_login(client, email="cust_search@test.com")
    tenant_id = create_tenant(client, token, name="Search Salon")

    client.post(
        "/api/v1/customers",
        json={"tenant_id": tenant_id, "first_name": "Jovan", "last_name": "Jovanovic"},
        headers=auth_headers(token),
    )
    client.post(
        "/api/v1/customers",
        json={"tenant_id": tenant_id, "first_name": "Mirko", "last_name": "Mirkovic"},
        headers=auth_headers(token),
    )

    response = client.get(
        f"/api/v1/customers?tenant_id={tenant_id}&search=Jovan",
        headers=auth_headers(token),
    )

    results = response.json()
    assert len(results) == 1
    assert results[0]["first_name"] == "Jovan"
