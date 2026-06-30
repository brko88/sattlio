# Sattlio Platform — Phase A Completion Report

**Datum:** 23.06.2026.
**Faza:** A — Core Booking System (lokalni razvoj, prema Dokumentu 14/15)
**Status:** ✅ KOMPLETNA
**Stack:** Python 3.12, FastAPI, SQLAlchemy, SQLite, JWT (python-jose), bcrypt (passlib)

---

## 1. Implementirani moduli

| # | Modul | Status | Opis |
|---|-------|--------|------|
| 1 | **Auth** | ✅ | Registracija, login, JWT access token, zaštićene rute (`get_current_user`) |
| 2 | **Tenants** | ✅ | Kreiranje poslovnog subjekta, automatski `owner` UserTenantRole, slug generisanje, lista "moji tenant-i" |
| 3 | **Employees** | ✅ | CRUD (create + list), owner-only kreiranje, soft-delete spremno |
| 4 | **Services** | ✅ | CRUD (create + list), owner-only kreiranje, soft-delete spremno |
| 5 | **Working Hours** | ✅ | Radno vrijeme po danu sedmice za zaposlenog, validacija start < end |
| 6 | **Customers** | ✅ | CRUD (create + list + search), dostupno owner-u i employee-ima |
| 7 | **Appointments (Booking Engine)** | ✅ | Kreiranje sa automatskim `end_time`, overlap provjera, working hours provjera, status tranzicije (cancel/complete) |

**Napomena:** Redis, Celery, Docker, CI/CD, audit log servis, rate limiting — namjerno NISU implementirani u ovoj fazi (vidi Dokument 14, sekcija 2.2). Ovo je svjesna odluka, ne propust.

---

## 2. Šema baze podataka (implementirano u SQLite)

### `users`
| Kolona | Tip | Napomena |
|--------|-----|----------|
| id | Integer, PK | |
| email | String, unique | |
| password_hash | String | bcrypt heš, nikad plain text |
| email_verified | Boolean | default False (verifikacija nije implementirana — simulacija za kasnije) |
| preferred_language | String | default "bs" |
| is_active | Boolean | default True |
| created_at / updated_at | DateTime | |

### `tenants`
| Kolona | Tip | Napomena |
|--------|-----|----------|
| id | Integer, PK | |
| name | String | |
| slug | String, unique | auto-generisan iz name |
| business_category, description, address, city, country, phone, email, logo_url | String, nullable | |
| timezone | String | default "Europe/Sarajevo" |
| currency | String | default "BAM" |
| is_active | Boolean | default True |

### `user_tenant_roles`
| Kolona | Tip | Napomena |
|--------|-----|----------|
| id | Integer, PK | |
| user_id | FK → users.id | |
| tenant_id | FK → tenants.id | |
| role | String | owner / employee / customer / superadmin |
| **UNIQUE** | (user_id, tenant_id) | jedan korisnik = jedna rola po tenant-u |

### `employees`
| Kolona | Tip | Napomena |
|--------|-----|----------|
| id | Integer, PK | |
| tenant_id | FK → tenants.id | |
| user_id | FK → users.id, nullable | veza sa nalogom (invite flow — nije implementirano) |
| first_name, last_name | String, required | |
| phone, email | String, nullable | |
| is_active, is_deleted, deleted_at | soft-delete polja | |

### `services`
| Kolona | Tip | Napomena |
|--------|-----|----------|
| id | Integer, PK | |
| tenant_id | FK → tenants.id | |
| name, description | String | |
| duration_minutes | Integer, required | koristi se za auto-računanje end_time |
| price | Float, required | |
| color | String, nullable | za kalendar UI (kasnije) |
| is_active, is_deleted, deleted_at | soft-delete polja | |

### `working_hours`
| Kolona | Tip | Napomena |
|--------|-----|----------|
| id | Integer, PK | |
| tenant_id | FK → tenants.id | |
| employee_id | FK → employees.id | |
| day_of_week | Integer (0–6) | 0 = ponedjeljak |
| start_time, end_time | Time | |
| is_working_day | Boolean | default True |

### `customers`
| Kolona | Tip | Napomena |
|--------|-----|----------|
| id | Integer, PK | |
| tenant_id | FK → tenants.id | |
| created_by_user_id | FK → users.id, nullable | ko je dodao klijenta |
| first_name, last_name | String, required | |
| phone, email | String, nullable, indexed | BR-050/051: nisu obavezni |
| notes | String, nullable | |

### `appointments`
| Kolona | Tip | Napomena |
|--------|-----|----------|
| id | Integer, PK | |
| tenant_id | FK → tenants.id | |
| customer_id | FK → customers.id | |
| employee_id | FK → employees.id | |
| service_id | FK → services.id | |
| created_by_user_id | FK → users.id | razdvojeno od customer_id (rezervacija za drugu osobu) |
| start_time, end_time | DateTime, indexed | end_time se računa server-side |
| status | String, indexed | created / confirmed / cancelled / completed / no_show |
| notes | String, nullable | |

**Sve tabele imaju `tenant_id`** (gdje je relevantno) — multi-tenant izolacija ugrađena u šemu od početka, prema Dokumentu 03.

---

## 3. API Endpoints (implementirano)

| Metoda | Putanja | Opis | Ovlaštenje |
|--------|---------|------|-----------|
| POST | `/api/v1/auth/register` | Registracija korisnika | Javno |
| POST | `/api/v1/auth/login` | Login, vraća JWT | Javno |
| GET | `/api/v1/auth/me` | Podaci ulogovanog korisnika | Ulogovan |
| POST | `/api/v1/tenants` | Kreiranje poslovnog subjekta | Ulogovan (postaje owner) |
| GET | `/api/v1/tenants/my` | Lista tenant-a korisnika sa rolom | Ulogovan |
| POST | `/api/v1/employees` | Dodavanje zaposlenog | Owner |
| GET | `/api/v1/employees?tenant_id=` | Lista zaposlenih | Member (owner/employee) |
| POST | `/api/v1/services` | Dodavanje usluge | Owner |
| GET | `/api/v1/services?tenant_id=` | Lista usluga | Member |
| POST | `/api/v1/working-hours` | Dodavanje radnog vremena | Owner |
| GET | `/api/v1/working-hours?tenant_id=&employee_id=` | Lista radnog vremena | Member |
| POST | `/api/v1/customers` | Dodavanje klijenta | Member |
| GET | `/api/v1/customers?tenant_id=&search=` | Lista/pretraga klijenata | Member |
| POST | `/api/v1/appointments` | Kreiranje rezervacije | Member |
| GET | `/api/v1/appointments?tenant_id=` | Lista rezervacija | Member |
| POST | `/api/v1/appointments/{id}/cancel` | Otkazivanje rezervacije | Member |
| POST | `/api/v1/appointments/{id}/complete` | Završavanje rezervacije | Member |

**Ukupno: 16 endpointa, svi testirani i potvrđeno rade.**

---

## 4. Implementirana poslovna pravila (iz Dokumenta 10)

| Pravilo | Opis | Status |
|---------|------|--------|
| BR-020 | Dva termina istog zaposlenog ne preklapaju se | ✅ Testirano |
| BR-021 | Početak termina prije kraja termina | ✅ (i na working_hours i na appointments) |
| BR-022 | Trajanje termina određuje usluga | ✅ end_time = start_time + service.duration_minutes |
| BR-024 | Termin ne može biti u prošlosti | ✅ Testirano |
| BR-044 | Završena rezervacija ne može biti otkazana | ✅ Testirano |
| BR-045 | (djelimično) Status tranzicije ograničene | ✅ cancelled/completed su konačni |
| BR-050, BR-051 | Email i telefon klijenta nisu obavezni | ✅ |
| BR-052 | Ime i prezime klijenta obavezni | ✅ |
| BR-062 | Neaktivni zaposleni ne mogu primati rezervacije | ✅ Testirano |
| BR-072 | Neaktivna usluga ne može biti rezervisana | ✅ Testirano |
| BR-080, BR-081, BR-082 | Tenant izolacija — korisnik vidi samo svoje podatke | ✅ Provjereno na svakoj ruti |
| BR-083, BR-084, BR-085 | UserTenantRole — više tenant-a/uloga po korisniku | ✅ |
| Working hours provjera | Termin samo u radno vrijeme zaposlenog i na radni dan | ✅ Testirano (uključujući granični slučaj) |

---

## 5. Implementirane sigurnosne funkcije

| Funkcija | Implementacija |
|----------|----------------|
| Heširanje lozinki | bcrypt (passlib), nikad plain text u bazi |
| JWT autentifikacija | python-jose, `user_id` u payload-u (NE role/tenant — čitaju se iz baze svaki put) |
| Zaštićene rute | `get_current_user()` dependency — provjerava token, postojanje korisnika, `is_active` |
| Role-based authorization | `require_owner()` / `require_member()` provjere na svakoj osjetljivoj ruti |
| Tenant isolation | Svaki upit filtrira po `tenant_id`; cross-tenant pristup nemoguć (provjereno na employee/service/customer FK-ovima unutar appointment kreiranja) |
| Lozinka nikad u odgovoru | `UserResponse` šema isključuje `password_hash` |
| Greške sa odgovarajućim statusima | 401 (nije ulogovan) razdvojeno od 403 (nema dozvolu) od 404 (ne postoji) od 409 (konflikt/overlap) |

**Napomena:** Email verifikacija je simulirana (polje postoji, `email_verified` se ne mijenja automatski). Refresh token, rate limiting, audit log, brute-force zaštita — namjerno odgođeno za Fazu D (vidi Dokument 14).

---

## 6. Preostali rad za Fazu B (prema Dokumentu 15)

Faza B = produkcijski oblik baze i servisa, realna procjena 3–4 nedjelje:

- [ ] Migracija SQLite → PostgreSQL
- [ ] Uvođenje Alembic migracija (umjesto `Base.metadata.create_all`)
- [ ] Pravi email servis (SMTP) za verifikaciju i potvrde rezervacija
- [ ] Refresh token sistem sa čuvanjem u bazi (rotacija, revoke)
- [ ] Async SQLAlchemy (opciono, zavisno od potrebe za performansama)

**Nakon Faze B dolazi Faza C (Frontend), Faza D (Deployment/Security), pa onda originalni Dokument 12 (V1–V9: monetizacija, mobilne app, marketplace, itd.)**

---

## 7. Procjena završenosti backend-a

Procjena je relativna na **kompletan Blueprint** (svi originalni dokumenti 00–13, uključujući daleku V1–V9 viziju), ne samo na MVP.

| Komponenta | % završeno | Napomena |
|---|---|---|
| Core booking logika (Faza A) | **100%** | Auth, Tenant, Employee, Service, Working Hours, Customer, Appointment — sve implementirano i testirano |
| MVP backend ukupno (uključujući Fazu B, D) | **~45–50%** | Core logika gotova; nedostaje produkcijska baza, email, refresh token, deployment, audit log |
| Kompletan Blueprint backend (sve V1–V9 funkcije) | **~12–15%** | Core booking je temelj, ali marketplace, naplata, multi-lokacija UI, analitika, AI, integracije — sve to još nije ni započeto (namjerno, po planu) |

**Tumačenje:** Backend je u odličnoj poziciji za **prelazak na frontend** (Faza C) čak i prije nego Faza B bude gotova — moguće je paralelno raditi na React UI-u protiv postojećeg SQLite/dev API-ja, dok se PostgreSQL migracija radi nezavisno. Najvažniji, najrizičniji dio sistema (booking overlap logika) je gotov i potvrđeno stabilan.

---

## 8. Zaključak

Faza A je u potpunosti završena i testirana kroz stvarne HTTP pozive (PowerShell `Invoke-RestMethod`), ne samo kroz čitanje koda. Svi ključni granični slučajevi su provjereni: preklapanje termina (uključujući ivicu gdje se termini tačno dodiruju), rad van radnog vremena, neradni dan, neaktivni entiteti, i status tranzicije rezervacija.

Sistem je spreman za prelazak na Fazu B (produkcijska infrastruktura) ili Fazu C (frontend), u zavisnosti od prioriteta koje odredi vlasnik proizvoda.

---

*Izvještaj generisan 23.06.2026. na osnovu zajedničke razvojne sesije — Sattlio Platform Backend, Faza A.*

