"""
Testovi za Tenant kreiranje i upravljanje.

Vidi Dokument 04, sekcija 6 (Tenant API).
"""
from conftest import register_and_login, auth_headers


def test_create_tenant_success(client):
    token = register_and_login(client, email="tenant_owner@test.com")
    response = client.post(
        "/api/v1/tenants",
        json={"name": "Salon Maja", "city": "Banja Luka"},
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Salon Maja"
    assert data["slug"] == "salon-maja"
    assert data["is_active"] is True


def test_create_tenant_generates_unique_slug(client):
    """Drugi tenant sa istim imenom treba dobiti slug sa brojem (npr. salon-maja-2)."""
    token = register_and_login(client, email="slug_test@test.com")

    response1 = client.post(
        "/api/v1/tenants",
        json={"name": "Salon Maja"},
        headers=auth_headers(token),
    )
    response2 = client.post(
        "/api/v1/tenants",
        json={"name": "Salon Maja"},
        headers=auth_headers(token),
    )

    assert response1.json()["slug"] != response2.json()["slug"]


def test_create_tenant_makes_creator_owner(client):
    """Korisnik koji kreira tenant automatski postaje owner (UserTenantRole)."""
    token = register_and_login(client, email="auto_owner@test.com")
    tenant_response = client.post(
        "/api/v1/tenants", json={"name": "Auto Owner Salon"}, headers=auth_headers(token)
    )
    tenant_id = tenant_response.json()["id"]

    my_tenants = client.get("/api/v1/tenants/my", headers=auth_headers(token))
    tenants_list = my_tenants.json()

    matching = [t for t in tenants_list if t["id"] == tenant_id]
    assert len(matching) == 1
    assert matching[0]["role"] == "owner"


def test_create_tenant_without_auth_fails(client):
    response = client.post("/api/v1/tenants", json={"name": "Bez Auth Salon"})
    assert response.status_code == 401
