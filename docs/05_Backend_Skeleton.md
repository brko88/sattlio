# Sattlio Platform — Backend Skeleton (FastAPI MVP)

**Dokument:** 05 — Backend Skeleton (FastAPI MVP)
**Verzija:** 1.0
**Status:** FINAL
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše osnovni backend skeleton Sattlio platforme. Cilj sistema je da omogući: pokretanje FastAPI servera, povezivanje sa PostgreSQL bazom, JWT autentifikaciju, refresh token sistem, email verifikaciju, multi-tenant arhitekturu, UserTenantRole model, modularnu strukturu spremnu za skaliranje.

Backend skeleton predstavlja početnu osnovu za razvoj MVP verzije.

> **Napomena (vidi Dokument 14):** U stvarnoj implementaciji, PostgreSQL/Redis/Celery dijelovi ovog skeletona su odgođeni za Fazu B/D — v0.1 koristi SQLite i bez Docker-a, prema pristupu "schema wide, code narrow".

---

## 2. Tehnološki stack

**Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL 15+, Pydantic v2

**Autentifikacija:** python-jose, passlib (bcrypt)

**Background poslovi:** Celery, Redis

**DevOps:** Docker, Docker Compose

---

## 3. Struktura projekta

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   └── middleware.py
│   ├── models/
│   │   ├── user.py
│   │   ├── tenant.py
│   │   ├── user_tenant_role.py
│   │   └── location.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── tenant.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── tenants.py
│   │   │   └── locations.py
│   │   └── api.py
│   ├── repositories/
│   ├── services/
│   ├── utils/
│   └── tests/
├── alembic/
├── requirements.txt
├── docker-compose.yml
├── .env
└── README.md
```

---

## 4. Pokretanje sistema

### 4.1 requirements.txt

Osnovni paketi: fastapi, uvicorn, sqlalchemy, alembic, psycopg2-binary, pydantic, python-jose, passlib[bcrypt], python-dotenv, redis, celery

### 4.2 .env

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Sattlio
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
```

### 4.3 docker-compose.yml

Servisi: PostgreSQL, Redis. MVP koristi jedan backend server. Arhitektura mora omogućiti kasnije horizontalno skaliranje.

---

## 5. Database konekcija

Lokacija: `app/core/database.py`

Odgovornosti: kreiranje engine-a, session management, declarative base, dependency injection za bazu.

Mora koristiti: SQLAlchemy 2.0, `pool_pre_ping=True`

---

## 6. Config sistem

Lokacija: `app/core/config.py`

Config mora učitavati: DATABASE_URL, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS.

Sve konfiguracije moraju dolaziti iz environment varijabli. Hardkodirane vrijednosti nisu dozvoljene.

---

## 7. Security Layer

Lokacija: `app/core/security.py`

Odgovornosti: `hash_password()`, `verify_password()`, `create_access_token()`, `create_refresh_token()`, `verify_token()`

Koristiti: bcrypt, JWT

**JWT payload mora sadržavati:** user_id
**Ne smije sadržavati:** role, tenant_id

Role i tenant određuju se iz baze podataka.

---

## 8. Middleware i Dependencies

### 8.1 Authentication Dependency

Sistem mora imati `get_current_user()` koji: validira JWT, učitava korisnika iz baze, vraća User objekat.

### 8.2 Tenant Context

Sattlio koristi UserTenantRole model. Tenant se ne uzima iz JWT tokena. Aktivni tenant određuje se: izborom korisnika, tenant context sistemom.

Ovo omogućava: više tenant-a po korisniku, više uloga po korisniku.

### 8.3 Tenant Isolation

Svaki poslovni endpoint mora: provjeriti tenant pristup, filtrirati podatke po tenant-u. Cross-tenant pristup nije dozvoljen.

### 8.4 Standard API Response

Sav backend mora koristiti standardizovani odgovor (vidi Dokument 04, sekcija 3).

---

## 9. Models

### 9.1 User Model

Lokacija: `app/models/user.py`

Polja: id, email, password_hash, email_verified, preferred_language, is_active, created_at, updated_at

Napomena: User model ne sadrži role. Jedan korisnik može imati više različitih uloga kroz UserTenantRole model.

### 9.2 Tenant Model

Lokacija: `app/models/tenant.py`

Polja: id, name, slug, business_category, description, address, city, country, phone, email, logo_url, timezone, currency, is_active, created_at, updated_at

### 9.3 UserTenantRole Model

Lokacija: `app/models/user_tenant_role.py`

Polja: id, user_id, tenant_id, role, created_at, updated_at

Podržane role: owner, employee, customer, superadmin

### 9.4 Location Model

Lokacija: `app/models/location.py`

Polja: id, tenant_id, name, address, city, country, phone, latitude, longitude, is_active, created_at, updated_at

MVP koristi jednu lokaciju. Arhitektura podržava više lokacija.

---

## 10. Schemas

Lokacija: `app/schemas/`

Početni schema moduli: auth.py, user.py, tenant.py, location.py

Svaki modul mora sadržavati: Create schema, Update schema, Response schema. Pydantic v2 je obavezan.

---

## 11. Authentication System

### 11.1 Registracija
`POST /auth/register` — 1) Kreira se User, 2) Lozinka se hashira, 3) email_verified = false, 4) Generiše se verification token, 5) Šalje se email

### 11.2 Login
`POST /auth/login` — provjerava email, lozinku, status korisnika. Odgovor: access token, refresh token

### 11.3 Email Verification
`POST /auth/verify-email` — nakon potvrde: email_verified = true

### 11.4 Refresh Token
`POST /auth/refresh` — omogućava produženje sesije, generisanje novog access tokena. Refresh token mora imati zaseban životni vijek.

### 11.5 Logout
`POST /auth/logout` — prilikom logout-a refresh token se poništava

---

## 12. API Router Setup

Lokacija: `app/api/api.py`

Početni routeri: auth, users, tenants, locations
Kasnije: employees, customers, services, appointments

Svi endpoint-i koriste `/api/v1`

---

## 13. Main Entry Point

Lokacija: `app/main.py`

Aplikacija mora: inicijalizovati FastAPI, registrovati middleware, registrovati API routere, omogućiti OpenAPI dokumentaciju.

Početni endpoint: `GET /` → `{ "status": "Sattlio API running" }`

---

## 14. Audit Log Foundation

Sistem mora biti spreman za audit log. Audit log bilježi: login, logout, promjene podataka, kreiranje rezervacija, brisanje podataka, administrativne akcije.

Audit log implementacija nije dio Skeleton MVP-a, ali struktura mora biti pripremljena.

---

## 15. Email Service Foundation

Backend mora imati pripremljen servis za: email verification, password reset, sistemske notifikacije.

**MVP:** Email Verification
**Kasnije:** rezervacijske potvrde, podsjetnici, marketing emailovi

---

## 16. Testing Foundation

Početna struktura mora sadržavati `app/tests/`

Minimalni testovi: auth testovi, user testovi, tenant testovi. Sve nove funkcionalnosti moraju imati testove.

---

## 17. Šta ovaj Skeleton omogućava

✔ Pokretanje FastAPI servera
✔ PostgreSQL konekciju
✔ JWT autentifikaciju
✔ Refresh token sistem
✔ Email verifikaciju
✔ UserTenantRole model
✔ Multi-tenant osnovu
✔ Tenant izolaciju
✔ Modularnu arhitekturu
✔ Pripremu za marketplace
✔ Pripremu za mobilne aplikacije

---

## 18. Sljedeći korak

Sljedeći dokument: **06 — Full Authentication & Authorization System**

Dodaje: kompletan RBAC sistem, UserTenantRole validaciju, tenant switching, permission sistem, protected routes, refresh token storage, email verification flow, audit log implementaciju.

U ovom trenutku Sattlio prelazi iz osnovnog skeletona u funkcionalnu SaaS platformu.

---

## 19. Zaključak

Ovaj dokument definiše početni backend kostur Sattlio platforme. Cilj skeletona nije implementacija svih funkcionalnosti, već stvaranje stabilne osnove za: autentifikaciju, multi-tenant sistem, buduće module, marketplace arhitekturu, skalabilan razvoj.

Sve naredne funkcionalnosti moraju biti implementirane na osnovu ovog dokumenta.

---

*Kraj dokumenta.*

