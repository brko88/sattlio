"""
KRITIČNO - Tenant Isolation Testing.

Vidi Dokument 11, sekcija 8: "Za svaki endpoint mora postojati test koji
potvrđuje: Tenant A ne može vidjeti podatke Tenant B."

Ovo testira da TVOJ kod ispravno ODBIJA pokušaje pristupa tuđim podacima -
nije pokušaj "probijanja" sistema, već provjera da postojeća zaštita radi.
"""
from conftest import register_and_login, create_tenant, auth_headers


def setup_two_tenants(client):
    """Pravi dva odvojena korisnika, svaki sa svojim tenant-om."""
    token_a = register_and_login(client, email="owner_a@test.com")
    tenant_a_id = create_tenant(client, token_a, name="Salon A")

    token_b = register_and_login(client, email="owner_b@test.com")
    tenant_b_id = create_tenant(client, token_b, name="Salon B")

    return {
        "token_a": token_a,
        "tenant_a_id": tenant_a_id,
        "token_b": token_b,
        "tenant_b_id": tenant_b_id,
    }


def test_employee_cross_tenant_access_denied(client):
    """Owner B ne može vidjeti zaposlene Tenant-a A."""
    setup = setup_two_tenants(client)

    # Owner A dodaje zaposlenog u svoj tenant
    client.post(
        "/api/v1/employees",
        json={"tenant_id": setup["tenant_a_id"], "first_name": "Tajni", "last_name": "Zaposleni"},
        headers=auth_headers(setup["token_a"]),
    )

    # Owner B pokušava da vidi zaposlene Tenant-a A
    response = client.get(
        f"/api/v1/employees?tenant_id={setup['tenant_a_id']}",
        headers=auth_headers(setup["token_b"]),
    )

    assert response.status_code == 403


def test_employee_cross_tenant_creation_denied(client):
    """Owner B ne može DODATI zaposlenog u Tenant A (ni ako pogodi tenant_id)."""
    setup = setup_two_tenants(client)

    response = client.post(
        "/api/v1/employees",
        json={"tenant_id": setup["tenant_a_id"], "first_name": "Upada", "last_name": "Silom"},
        headers=auth_headers(setup["token_b"]),
    )

    assert response.status_code == 403


def test_services_cross_tenant_access_denied(client):
    setup = setup_two_tenants(client)

    client.post(
        "/api/v1/services",
        json={"tenant_id": setup["tenant_a_id"], "name": "Tajna usluga", "duration_minutes": 30, "price": 20},
        headers=auth_headers(setup["token_a"]),
    )

    response = client.get(
        f"/api/v1/services?tenant_id={setup['tenant_a_id']}",
        headers=auth_headers(setup["token_b"]),
    )

    assert response.status_code == 403


def test_customers_cross_tenant_access_denied(client):
    setup = setup_two_tenants(client)

    client.post(
        "/api/v1/customers",
        json={"tenant_id": setup["tenant_a_id"], "first_name": "Tajni", "last_name": "Klijent"},
        headers=auth_headers(setup["token_a"]),
    )

    response = client.get(
        f"/api/v1/customers?tenant_id={setup['tenant_a_id']}",
        headers=auth_headers(setup["token_b"]),
    )

    assert response.status_code == 403


def test_appointments_cross_tenant_access_denied(client):
    setup = setup_two_tenants(client)

    response = client.get(
        f"/api/v1/appointments?tenant_id={setup['tenant_a_id']}",
        headers=auth_headers(setup["token_b"]),
    )

    assert response.status_code == 403


def test_working_hours_cross_tenant_access_denied(client):
    setup = setup_two_tenants(client)

    emp_response = client.post(
        "/api/v1/employees",
        json={"tenant_id": setup["tenant_a_id"], "first_name": "Test", "last_name": "Employee"},
        headers=auth_headers(setup["token_a"]),
    )
    employee_id = emp_response.json()["id"]

    response = client.get(
        f"/api/v1/working-hours?tenant_id={setup['tenant_a_id']}&employee_id={employee_id}",
        headers=auth_headers(setup["token_b"]),
    )

    assert response.status_code == 403


def test_cannot_use_employee_from_other_tenant_in_appointment(client):
    """
    Owner B ne smije moći kreirati appointment koristeći employee_id
    koji pripada Tenant-u A, čak i u SVOM tenant-u.
    """
    setup = setup_two_tenants(client)

    emp_response = client.post(
        "/api/v1/employees",
        json={"tenant_id": setup["tenant_a_id"], "first_name": "Employee", "last_name": "A"},
        headers=auth_headers(setup["token_a"]),
    )
    employee_a_id = emp_response.json()["id"]

    cust_response = client.post(
        "/api/v1/customers",
        json={"tenant_id": setup["tenant_b_id"], "first_name": "Klijent", "last_name": "B"},
        headers=auth_headers(setup["token_b"]),
    )
    customer_b_id = cust_response.json()["id"]

    srv_response = client.post(
        "/api/v1/services",
        json={"tenant_id": setup["tenant_b_id"], "name": "Usluga B", "duration_minutes": 30, "price": 20},
        headers=auth_headers(setup["token_b"]),
    )
    service_b_id = srv_response.json()["id"]

    # Owner B pokušava kreirati appointment u SVOM tenant-u,
    # ali koristeći employee_id koji pripada Tenant-u A
    response = client.post(
        "/api/v1/appointments",
        json={
            "tenant_id": setup["tenant_b_id"],
            "employee_id": employee_a_id,
            "service_id": service_b_id,
            "customer_id": customer_b_id,
            "start_time": "2026-12-01T10:00:00",
        },
        headers=auth_headers(setup["token_b"]),
    )

    # Mora pasti - employee ne postoji u tenant_b
    assert response.status_code == 404
