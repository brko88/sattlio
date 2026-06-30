# Sattlio Platform — API Specification

**Dokument:** 04 — API Specification
**Verzija:** 1.0
**Status:** FINAL
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše kompletan REST API Sattlio platforme. Obuhvata: autentifikaciju, korisnike, poslovne subjekte, lokacije, zaposlenike, usluge, klijente, rezervacije, standard odgovora, autorizaciju, validaciju, error handling.

---

## 2. Osnovni principi API-ja

- REST arhitektura
- JSON format
- Versioning: `/api/v1/`
- Stateless backend
- JWT autentifikacija
- Tenant-aware sistem
- Marketplace ready arhitektura

---

## 3. Standard API odgovora

### 3.1 Success Response
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### 3.2 Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## 4. Autentifikacija

### 4.1 Registracija
`POST /api/v1/auth/register`
```json
{ "email": "test@mail.com", "password": "123456" }
```
Response:
```json
{ "success": true, "data": { "user_id": 1, "email": "test@mail.com", "email_verified": false } }
```

### 4.2 Login
`POST /api/v1/auth/login`
```json
{ "email": "test@mail.com", "password": "123456" }
```
Response:
```json
{ "success": true, "data": { "access_token": "JWT_TOKEN", "refresh_token": "REFRESH_TOKEN" } }
```

### 4.3 Refresh Token
`POST /api/v1/auth/refresh`
```json
{ "refresh_token": "REFRESH_TOKEN" }
```

### 4.4 Verify Email
`POST /api/v1/auth/verify-email` — potvrda email adrese korisnika

### 4.5 Resend Verification Email
`POST /api/v1/auth/resend-verification` — ponovno slanje verifikacijskog emaila

### 4.6 Logout
`POST /api/v1/auth/logout` — poništavanje refresh tokena

---

## 5. User API

- `GET /api/v1/users/me` — Get Current User
- `PUT /api/v1/users/me` — Update Profile (`{ "first_name": "Marko", "last_name": "Markovic" }`)
- `GET /api/v1/users/tenants` — Get My Tenants (vraća sve poslovne subjekte kojima korisnik pripada i ulogu korisnika u svakom)
- `POST /api/v1/users/change-password` — Change Password

---

## 6. Tenant (Business) API

- `POST /api/v1/tenants` — Create Business (`{ "name": "Salon Maja", "address": "...", "city": "Banja Luka", "phone": "+387..." }`)
- `GET /api/v1/tenants/me` — Get My Business
- `PUT /api/v1/tenants/{id}` — Update Business
- `DELETE /api/v1/tenants/{id}` — Delete Business (soft delete)
- `GET /api/v1/public/business/{slug}` — Public Business Profile (marketplace, javni profil — vraća naziv, opis, galeriju, lokacije, usluge, cjenovnik, radno vrijeme)

---

## 7. Locations API

- `POST /api/v1/locations` — Create Location
- `GET /api/v1/locations` — Get Locations
- `PUT /api/v1/locations/{id}` — Update Location
- `DELETE /api/v1/locations/{id}` — Delete Location

---

## 8. Employees API

- `POST /api/v1/employees` — Create Employee
- `GET /api/v1/employees` — Get Employees
- `PUT /api/v1/employees/{id}` — Update Employee
- `DELETE /api/v1/employees/{id}` — Delete Employee (soft delete)
- `POST /api/v1/employees/invite` — Invite Employee
- `POST /api/v1/invitations/accept` — Accept Invitation

---

## 9. Services API

- `POST /api/v1/services` — Create Service (`{ "name": "Šišanje", "duration_minutes": 30, "price": 15 }`)
- `GET /api/v1/services` — Get Services
- `PUT /api/v1/services/{id}` — Update Service
- `DELETE /api/v1/services/{id}` — Delete Service (soft delete)

---

## 10. Customers API

- `POST /api/v1/customers` — Create Customer
- `GET /api/v1/customers` — Get Customers
- `PUT /api/v1/customers/{id}` — Update Customer
- `POST /api/v1/customers/guest` — Create Customer For Another Person (rezervacija za dijete, roditelja, supružnika, drugu osobu)

---

## 11. Appointments API

- `POST /api/v1/appointments` — Create Appointment
- `GET /api/v1/appointments?date=` — Get Appointments (kalendarski prikaz)
- `GET /api/v1/appointments/available-slots` — Get Available Slots (parametri: date, employee_id, service_id, location_id)
- `GET /api/v1/appointments/my` — Get My Appointments
- `PUT /api/v1/appointments/{id}` — Update Appointment
- `POST /api/v1/appointments/{id}/cancel` — Cancel Appointment
- `POST /api/v1/appointments/{id}/complete` — Complete Appointment

---

## 12. Business Rules (API Level)

### 12.1 Appointment Validation

API mora provjeriti: preklapanje termina, radno vrijeme zaposlenog, trajanje usluge, tenant ownership, dostupnost lokacije, status zaposlenog.

```json
{ "success": false, "error": { "code": "APPOINTMENT_CONFLICT", "message": "Employee is already booked for this time slot" } }
```

### 12.2 Tenant Isolation

Svaki API endpoint mora vraćati samo podatke aktivnog tenant-a. Cross-tenant pristup nije dozvoljen.

---

## 13. Authorization Rules

| Role | Access |
|---|---|
| superadmin | kompletan sistem |
| owner | vlastiti tenant |
| employee | vlastiti raspored i dozvoljene funkcije |
| customer | vlastite rezervacije |

Autorizacija se vrši preko UserTenantRole modela.

---

## 14. Authentication Middleware

Svaki request osim auth endpoint-a mora sadržavati:
```
Authorization: Bearer JWT_TOKEN
```

Token mora sadržavati `user_id`. Aktivni tenant određuje se kroz tenant context / odabrani tenant korisnika.

---

## 15. Error Codes Standard

| Code | Description |
|---|---|
| AUTH_INVALID_CREDENTIALS | Pogrešan login |
| AUTH_UNAUTHORIZED | Nema pristup |
| AUTH_EMAIL_NOT_VERIFIED | Email nije potvrđen |
| TENANT_NOT_FOUND | Tenant ne postoji |
| LOCATION_NOT_FOUND | Lokacija ne postoji |
| EMPLOYEE_NOT_FOUND | Zaposleni ne postoji |
| EMPLOYEE_NOT_AVAILABLE | Termin nije dostupan |
| CUSTOMER_NOT_FOUND | Klijent ne postoji |
| INVALID_INPUT | Neispravni podaci |
| APPOINTMENT_CONFLICT | Sukob termina |
| INTERNAL_SERVER_ERROR | Interna greška sistema |

---

## 16. Pagination

Svi list endpoint-i podržavaju `?page=1&limit=20`.

```json
{ "success": true, "data": { "items": [], "total": 100, "page": 1, "limit": 20 } }
```

---

## 17. Filtering

Podržano: date, employee_id, customer_id, service_id, location_id, city, business_category.

Marketplace verzija: rating, distance, price_range.

---

## 18. Versioning

Svi API endpoint-i koriste `/api/v1/`. Buduće verzije: `/api/v2/`, `/api/v3/`. Nova verzija ne smije narušiti funkcionalnost prethodne verzije.

---

## 19. Rate Limiting

**MVP:** 100 requests/minute po korisniku. Izuzeci: superadmin.
**Kasnije:** različiti limiti po pretplatničkom paketu.

---

## 20. Security Rules

- password nikad ne ide u response
- JWT ima expiration time
- refresh token rotation
- input sanitization
- email verification required
- role validation required
- audit log za kritične akcije
- tenant isolation obavezna
- rate limiting po korisniku i IP adresi

### 20.1 Internationalization

API mora podržavati `Accept-Language` header (npr. `bs`, `en`). Svi sistemski odgovori moraju podržavati lokalizaciju.

### 20.2 Future API Modules

Marketplace API, Public Profiles API, Search API, Partner API, Affiliate API, Mobile Push API, Payments API, Analytics API, Loyalty API.

---

## 21. Zaključak

Ovaj API predstavlja jedini komunikacijski sloj između frontend, mobile i backend sistema. Svi klijenti (Web, Android, iOS) koriste isključivo ove endpoint-e. Direktan pristup bazi nije dozvoljen.

Svi budući moduli moraju proširivati postojeći API bez narušavanja kompatibilnosti sa postojećim verzijama.

API mora ostati: stabilan, skalabilan, siguran, marketplace ready, multi-tenant.

---

*Kraj dokumenta.*

