"""
Testovi za Tenant kreiranje i upravljanje.

Vidi Dokument 04, sekcija 6 (Tenant API).
"""
from conftest import register_and_login, auth_headers, _jib_counter


def tenant_payload(name, city="Banja Luka"):
    """Kompletan payload — jib (13 cifara, ne sve iste) je obavezan u shemi."""
    _jib_counter[0] += 1
    return {"name": name, "city": city, "jib": str(_jib_counter[0])}


def test_create_tenant_success(client):
    token = register_and_login(client, email="tenant_owner@test.com")
    response = client.post(
        "/api/v1/tenants",
        json=tenant_payload("Salon Maja"),
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
        json=tenant_payload("Salon Maja"),
        headers=auth_headers(token),
    )
    response2 = client.post(
        "/api/v1/tenants",
        json=tenant_payload("Salon Maja"),
        headers=auth_headers(token),
    )

    assert response1.json()["slug"] != response2.json()["slug"]


def test_create_tenant_invalid_jib_fails(client):
    """JIB mora imati tačno 13 cifara i ne smije biti ista cifra 13 puta."""
    token = register_and_login(client, email="jib_test@test.com")
    for bad_jib in ["123", "1111111111111", "abcdefghijklm"]:
        response = client.post(
            "/api/v1/tenants",
            json={"name": "Salon JIB", "jib": bad_jib},
            headers=auth_headers(token),
        )
        assert response.status_code == 422, f"jib={bad_jib} je prošao, a ne smije"


def test_create_tenant_makes_creator_owner(client):
    """Korisnik koji kreira tenant automatski postaje owner (UserTenantRole)."""
    token = register_and_login(client, email="auto_owner@test.com")
    tenant_response = client.post(
        "/api/v1/tenants", json=tenant_payload("Auto Owner Salon"), headers=auth_headers(token)
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
