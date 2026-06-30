"""
Testovi za Appointments (Booking Engine) - najkritičniji dio sistema.

Pokriva: overlap provjeru (BR-020), working hours provjeru, status
tranzicije (Dokument 10, sekcija 8), i RACE CONDITION test - regresija
za bug otkriven u sesiji 26.06.2026 (dva istovremena zahtjeva mogla su
kreirati duplikat rezervacije za isti termin).
"""
import threading

from conftest import register_and_login, create_tenant, auth_headers


def setup_booking_environment(client, email="booking@test.com"):
    """Kreira tenant, employee sa working hours, service, customer.
    Vraća dict sa svim potrebnim ID-jevima i tokenom."""
    token = register_and_login(client, email=email)
    tenant_id = create_tenant(client, token, name="Booking Test Salon")

    emp_response = client.post(
        "/api/v1/employees",
        json={"tenant_id": tenant_id, "first_name": "Frizer", "last_name": "Test"},
        headers=auth_headers(token),
    )
    employee_id = emp_response.json()["id"]

    for day in range(7):
        client.post(
            "/api/v1/working-hours",
            json={
                "tenant_id": tenant_id,
                "employee_id": employee_id,
                "day_of_week": day,
                "start_time": "07:00:00",
                "end_time": "21:00:00",
            },
            headers=auth_headers(token),
        )

    srv_response = client.post(
        "/api/v1/services",
        json={"tenant_id": tenant_id, "name": "Šišanje", "duration_minutes": 30, "price": 15},
        headers=auth_headers(token),
    )
    service_id = srv_response.json()["id"]

    cust_response = client.post(
        "/api/v1/customers",
        json={"tenant_id": tenant_id, "first_name": "Klijent", "last_name": "Test"},
        headers=auth_headers(token),
    )
    customer_id = cust_response.json()["id"]

    return {
        "token": token,
        "tenant_id": tenant_id,
        "employee_id": employee_id,
        "service_id": service_id,
        "customer_id": customer_id,
    }


def book(client, env, start_time):
    return client.post(
        "/api/v1/appointments",
        json={
            "tenant_id": env["tenant_id"],
            "employee_id": env["employee_id"],
            "service_id": env["service_id"],
            "customer_id": env["customer_id"],
            "start_time": start_time,
        },
        headers=auth_headers(env["token"]),
    )


def test_create_appointment_success(client):
    env = setup_booking_environment(client, email="appt_success@test.com")
    response = book(client, env, "2026-12-01T10:00:00")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "created"
    assert data["end_time"] == "2026-12-01T10:30:00"


def test_overlapping_appointment_rejected(client):
    """BR-020: Dva termina istog zaposlenog ne smiju se preklapati."""
    env = setup_booking_environment(client, email="appt_overlap@test.com")

    book(client, env, "2026-12-01T10:00:00")
    response = book(client, env, "2026-12-01T10:15:00")

    assert response.status_code == 409
    assert "već zauzet" in response.json()["detail"]


def test_back_to_back_appointments_allowed(client):
    """Termin koji počinje TAČNO kad se prethodni završava NE smije biti odbijen."""
    env = setup_booking_environment(client, email="appt_backtoback@test.com")

    book(client, env, "2026-12-01T10:00:00")
    response = book(client, env, "2026-12-01T10:30:00")

    assert response.status_code == 200


def test_appointment_in_the_past_rejected(client):
    """BR-024: Termin ne može biti kreiran u prošlosti."""
    env = setup_booking_environment(client, email="appt_past@test.com")
    response = book(client, env, "2020-01-01T10:00:00")

    assert response.status_code == 400
    assert "prošlosti" in response.json()["detail"]


def test_appointment_outside_working_hours_rejected(client):
    token = register_and_login(client, email="appt_no_wh@test.com")
    tenant_id = create_tenant(client, token, name="No WH Salon")

    emp_response = client.post(
        "/api/v1/employees",
        json={"tenant_id": tenant_id, "first_name": "Bez", "last_name": "RadnogVremena"},
        headers=auth_headers(token),
    )
    employee_id = emp_response.json()["id"]

    srv_response = client.post(
        "/api/v1/services",
        json={"tenant_id": tenant_id, "name": "Usluga", "duration_minutes": 30, "price": 10},
        headers=auth_headers(token),
    )
    service_id = srv_response.json()["id"]

    cust_response = client.post(
        "/api/v1/customers",
        json={"tenant_id": tenant_id, "first_name": "Klijent", "last_name": "Test"},
        headers=auth_headers(token),
    )
    customer_id = cust_response.json()["id"]

    response = client.post(
        "/api/v1/appointments",
        json={
            "tenant_id": tenant_id,
            "employee_id": employee_id,
            "service_id": service_id,
            "customer_id": customer_id,
            "start_time": "2026-12-01T10:00:00",
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 400
    assert "ne radi" in response.json()["detail"]


def test_inactive_service_cannot_be_booked(client):
    """BR-072: Neaktivna usluga ne može biti rezervisana."""
    env = setup_booking_environment(client, email="appt_inactive_srv@test.com")

    from app.models.service import Service
    from conftest import TestSessionLocal

    db = TestSessionLocal()
    service = db.query(Service).filter(Service.id == env["service_id"]).first()
    service.is_active = False
    db.commit()
    db.close()

    response = book(client, env, "2026-12-01T10:00:00")
    assert response.status_code == 400
    assert "nije aktivna" in response.json()["detail"]


def test_complete_appointment_status_transition(client):
    """Dokument 10, sekcija 8: created -> completed je dozvoljena tranzicija."""
    env = setup_booking_environment(client, email="appt_complete@test.com")
    create_response = book(client, env, "2026-12-01T10:00:00")
    appt_id = create_response.json()["id"]

    response = client.post(
        f"/api/v1/appointments/{appt_id}/complete", headers=auth_headers(env["token"])
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_cannot_cancel_completed_appointment(client):
    """BR-044: Završena rezervacija ne može biti otkazana."""
    env = setup_booking_environment(client, email="appt_cancel_completed@test.com")
    create_response = book(client, env, "2026-12-01T10:00:00")
    appt_id = create_response.json()["id"]

    client.post(f"/api/v1/appointments/{appt_id}/complete", headers=auth_headers(env["token"]))

    response = client.post(
        f"/api/v1/appointments/{appt_id}/cancel", headers=auth_headers(env["token"])
    )

    assert response.status_code == 400


def test_cancelled_appointment_frees_up_the_slot(client):
    """BR-042 ekvivalent: otkazan termin ne blokira novu rezervaciju za isti slot."""
    env = setup_booking_environment(client, email="appt_cancel_frees@test.com")
    create_response = book(client, env, "2026-12-01T10:00:00")
    appt_id = create_response.json()["id"]

    client.post(f"/api/v1/appointments/{appt_id}/cancel", headers=auth_headers(env["token"]))

    response = book(client, env, "2026-12-01T10:00:00")
    assert response.status_code == 200


def test_race_condition_concurrent_booking_only_one_succeeds(client):
    """
    REGRESIJA - KRITIČAN TEST za bug otkriven u sesiji 26.06.2026.

    Dva ISTOVREMENA zahtjeva za isti termin/zaposlenog ne smiju oba uspjeti.
    Bez with_for_update() zaključavanja na Employee redu, oba zahtjeva bi
    "vidjela" praznu bazu istovremeno i oba bi prošla overlap provjeru.
    """
    env = setup_booking_environment(client, email="race_condition_test@test.com")

    results = []

    def make_booking():
        response = book(client, env, "2026-12-15T14:00:00")
        results.append(response.status_code)

    thread1 = threading.Thread(target=make_booking)
    thread2 = threading.Thread(target=make_booking)

    thread1.start()
    thread2.start()
    thread1.join()
    thread2.join()

    assert results.count(200) == 1
    assert results.count(409) == 1
