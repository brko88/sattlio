"""
Testovi za Working Hours modul.

Pokriva i bug koji je otkriven u sesiji 26.06.2026: dodavanje radnog
vremena za isti dan dva puta je pravilo duplikat umjesto ažuriranja.
"""
from conftest import register_and_login, create_tenant, auth_headers


def create_employee(client, token, tenant_id, first_name="Test", last_name="Employee"):
    response = client.post(
        "/api/v1/employees",
        json={"tenant_id": tenant_id, "first_name": first_name, "last_name": last_name},
        headers=auth_headers(token),
    )
    return response.json()["id"]


def test_create_working_hours_success(client):
    token = register_and_login(client, email="wh_owner@test.com")
    tenant_id = create_tenant(client, token, name="WH Test Salon")
    employee_id = create_employee(client, token, tenant_id)

    response = client.post(
        "/api/v1/working-hours",
        json={
            "tenant_id": tenant_id,
            "employee_id": employee_id,
            "day_of_week": 0,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json()["day_of_week"] == 0


def test_start_time_must_be_before_end_time(client):
    """BR-021 ekvivalent za working hours."""
    token = register_and_login(client, email="wh_validation@test.com")
    tenant_id = create_tenant(client, token, name="WH Validation Salon")
    employee_id = create_employee(client, token, tenant_id)

    response = client.post(
        "/api/v1/working-hours",
        json={
            "tenant_id": tenant_id,
            "employee_id": employee_id,
            "day_of_week": 0,
            "start_time": "17:00:00",
            "end_time": "09:00:00",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 400


def test_adding_same_day_twice_updates_not_duplicates(client):
    """
    REGRESIJA: bug otkriven u sesiji - dodavanje radnog vremena za isti dan
    je pravilo duplikat zapis umjesto da ažurira postojeći.
    """
    token = register_and_login(client, email="wh_duplicate_test@test.com")
    tenant_id = create_tenant(client, token, name="WH Duplicate Salon")
    employee_id = create_employee(client, token, tenant_id)

    client.post(
        "/api/v1/working-hours",
        json={
            "tenant_id": tenant_id,
            "employee_id": employee_id,
            "day_of_week": 0,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=auth_headers(token),
    )

    # Drugi put, isti dan, drugo vrijeme
    client.post(
        "/api/v1/working-hours",
        json={
            "tenant_id": tenant_id,
            "employee_id": employee_id,
            "day_of_week": 0,
            "start_time": "10:00:00",
            "end_time": "18:00:00",
        },
        headers=auth_headers(token),
    )

    response = client.get(
        f"/api/v1/working-hours?tenant_id={tenant_id}&employee_id={employee_id}",
        headers=auth_headers(token),
    )

    entries = response.json()
    monday_entries = [e for e in entries if e["day_of_week"] == 0]

    # Mora postojati TAČNO JEDAN zapis za ponedjeljak, ne dva
    assert len(monday_entries) == 1
    # I treba da je AŽURIRAN na novo vrijeme
    assert monday_entries[0]["start_time"] == "10:00:00"


def test_delete_working_hours(client):
    token = register_and_login(client, email="wh_delete@test.com")
    tenant_id = create_tenant(client, token, name="WH Delete Salon")
    employee_id = create_employee(client, token, tenant_id)

    create_response = client.post(
        "/api/v1/working-hours",
        json={
            "tenant_id": tenant_id,
            "employee_id": employee_id,
            "day_of_week": 5,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=auth_headers(token),
    )
    wh_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/working-hours/{wh_id}", headers=auth_headers(token)
    )
    assert delete_response.status_code == 200

    list_response = client.get(
        f"/api/v1/working-hours?tenant_id={tenant_id}&employee_id={employee_id}",
        headers=auth_headers(token),
    )
    assert len(list_response.json()) == 0
