"""
Testovi za Services modul.

Vidi Dokument 10, BR-070, BR-071, BR-072.
"""
from conftest import register_and_login, create_tenant, auth_headers


def test_create_service_success(client):
    token = register_and_login(client, email="srv_owner@test.com")
    tenant_id = create_tenant(client, token, name="Srv Test Salon")

    response = client.post(
        "/api/v1/services",
        json={
            "tenant_id": tenant_id,
            "name": "Šišanje",
            "duration_minutes": 30,
            "price": 15.0,
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Šišanje"
    assert data["duration_minutes"] == 30
    assert data["price"] == 15.0
    assert data["is_active"] is True


def test_service_requires_duration_and_price(client):
    """BR-070, BR-071: usluga mora imati trajanje i cijenu."""
    token = register_and_login(client, email="srv_validation@test.com")
    tenant_id = create_tenant(client, token, name="Validation Salon")

    response = client.post(
        "/api/v1/services",
        json={"tenant_id": tenant_id, "name": "Nepotpuna usluga"},
        headers=auth_headers(token),
    )

    # Pydantic validacija treba odbiti zahtjev bez obaveznih polja
    assert response.status_code == 422


def test_non_owner_cannot_create_service(client):
    owner_token = register_and_login(client, email="srv_real_owner@test.com")
    tenant_id = create_tenant(client, owner_token, name="Srv Tudji Salon")

    outsider_token = register_and_login(client, email="srv_outsider@test.com")

    response = client.post(
        "/api/v1/services",
        json={"tenant_id": tenant_id, "name": "Tudja usluga", "duration_minutes": 30, "price": 10},
        headers=auth_headers(outsider_token),
    )

    assert response.status_code == 403
