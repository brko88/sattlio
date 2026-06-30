# SmartBooking Platform — Software Architecture Document (SAD)

**Dokument:** 02 — Software Architecture Document (SAD)
**Verzija:** 1.0
**Status:** FINAL
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše tehničku arhitekturu SmartBooking platforme. Dokument služi kao osnov za implementaciju backend-a, frontend-a i mobilnih aplikacija, kao i za buduće skaliranje sistema.

---

## 2. Pregled sistema

SmartBooking je SaaS multi-tenant platforma za upravljanje rezervacijama. Sistem se sastoji od:
- Web aplikacije (frontend)
- Backend API servisa
- Baze podataka
- Mobilnih aplikacija
- Servisa za notifikacije
- Servisa za background jobove

---

## 3. Visok nivo arhitekture

```
[ Web App (React) ]
[ Mobile App (React Native) ]
        ↓
   [ API Layer ]
        ↓
[ Backend Services ]
        ↓
   [ PostgreSQL ]
        ↓
Redis / Background Jobs / Notifications
```

---

## 4. Tehnološki stack

### 4.1 Backend
- Python 3.12
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- JWT autentifikacija
- Uvicorn
- Gunicorn

### 4.2 Frontend (Web)
- React 18+
- TypeScript
- React Router
- Axios
- TailwindCSS

### 4.3 Mobile
- React Native
- Expo (početna faza)
- TypeScript

### 4.4 Baza podataka
- PostgreSQL 15+

### 4.5 Cache i Queue
- Redis
- Celery

### 4.6 DevOps
- Docker
- Docker Compose
- GitHub Actions
- Nginx

---

## 5. Arhitekturni pristup

### 5.1 MVP faza

Monolitni backend sa modularnom FastAPI strukturom.

Razlozi:
- brži razvoj
- jednostavnije održavanje
- niži troškovi
- lakše testiranje

### 5.2 Buduća evolucija

Po potrebi sistem se može podijeliti na:
- Auth Service
- Booking Service
- Notification Service
- Payment Service
- Analytics Service

Ova podjela nije dio MVP-a.

---

## 6. Multi-Tenant Arhitektura

### 6.1 Osnovni princip

Svi korisnici koriste istu aplikaciju. Svi podaci se nalaze u istoj bazi podataka. Izolacija podataka ostvaruje se pomoću `tenant_id`. Svaki poslovni podatak mora biti povezan sa tenant-om.

### 6.2 UserTenantRole Model

SmartBooking koristi Single Account arhitekturu.

Jedan korisnik:
- ima jedan nalog
- može pripadati više tenant-a
- može imati više uloga

Primjer:
```
User: boris@gmail.com
Tenant A: OWNER
Tenant B: EMPLOYEE
Tenant C: CUSTOMER
```

Role se ne čuvaju direktno na User modelu. Role se čuvaju kroz UserTenantRole model.

Prednosti:
- jedan nalog za cijelu platformu
- više poslovnih subjekata
- više uloga po korisniku
- marketplace spremna arhitektura

### 6.3 Princip izolacije

Svaki upit mora sadržavati tenant filter. Nije dozvoljen pristup podacima drugog tenant-a.

```sql
WHERE tenant_id = current_tenant
```

### 6.4 Location arhitektura

Svaki tenant može imati jednu ili više lokacija.

MVP: jedna lokacija
Arhitektura: neograničen broj lokacija

Primjer:
```
Salon Maja
├── Centar
├── Borik
└── Starčevica
```

Svi budući moduli moraju podržavati `location_id` gdje je primjenjivo.

Location mora sadržavati: naziv, adresu, grad, državu, telefon, geolokaciju.

---

## 7. Backend struktura

```
app/
├── main.py
├── core/
│   ├── config.py
│   ├── database.py
│   └── security.py
├── modules/
│   ├── auth/
│   ├── users/
│   ├── tenants/
│   ├── locations/
│   ├── employees/
│   ├── customers/
│   ├── services/
│   └── appointments/
├── api/
├── models/
├── schemas/
├── repositories/
├── services/
├── utils/
└── tests/
```

---

## 8. Frontend struktura

```
src/
├── components/
├── pages/
├── modules/
├── services/
├── hooks/
├── context/
├── utils/
├── assets/
└── i18n/
```

---

## 9. API Dizajn

### 9.1 Principi
- REST API
- JSON komunikacija
- Versioning (`/api/v1`)
- Stateless backend

### 9.2 Standard odgovora

**Success:**
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

**Error:**
```json
{
  "success": false,
  "data": null,
  "error": {}
}
```

### 9.3 Autentifikacija
- JWT Access Token
- Refresh Token
- Email Verification

---

## 10. Sigurnost

### 10.1 Autentifikacija
- email + password login
- bcrypt hash lozinki

### 10.2 Autorizacija

Podržane role: superadmin, owner, employee, customer.

Autorizacija se vrši kroz UserTenantRole model.

### 10.3 Zaštita sistema
- HTTPS
- Rate Limiting
- Input Validation
- SQL Injection zaštita
- CORS kontrola
- Audit Log
- Brute Force zaštita

### 10.4 Verifikacija korisnika

**MVP:** Email Verification
**Kasnije:** SMS Verification, Two Factor Authentication (2FA)

Korisnik mora imati `email_verified`. Opcionalno: `phone_verified`.

Sistem može ograničiti određene funkcije neprovjerenim korisnicima.

---

## 11. Rezervacioni sistem (Core Logika)

### 11.1 Pravila rezervacije

Sistem mora provjeriti:
- da li zaposleni radi u tom terminu
- da li postoji preklapanje termina
- trajanje usluge
- dostupnost zaposlenog
- dostupnost lokacije
- validnost tenant-a

### 11.2 Algoritam validacije

Prilikom kreiranja rezervacije sistem mora:
1. Validirati korisnika
2. Validirati tenant
3. Validirati lokaciju
4. Validirati zaposlenog
5. Provjeriti radno vrijeme
6. Provjeriti preklapanje termina
7. Kreirati rezervaciju

U slučaju greške rezervacija se odbija.

### 11.3 Rezervacija za drugu osobu

Sistem mora podržavati rezervaciju za drugu osobu.

Primjeri: roditelj rezerviše djetetu, sin rezerviše roditelju, supružnik rezerviše supružniku.

Sistem mora razlikovati `created_by_user` i `customer`. To nisu nužno iste osobe.

---

## 12. Background Job Sistem

Koristi se za: slanje emailova, podsjetnike, obradu notifikacija, generisanje izvještaja, statistiku.

Tehnologija: Celery, Redis.

---

## 13. Cache Strategija

Redis se koristi za: sesije, često korištene podatke, prikaz kalendara, rate limiting, privremene podatke.

### 13.1 Internacionalizacija (i18n)

Sistem mora podržavati više jezika i više valuta.

Početni jezici: Bosanski, Engleski.
Planirani jezici: Hrvatski, Srpski, Njemački.

Frontend ne smije sadržavati hardkodirane tekstove. Svi tekstovi moraju koristiti translation key sistem.

Primjer: `booking.create`, `booking.cancel`, `employee.add`

### 13.2 Više valuta

Valute moraju biti konfigurabilne, ne hardkodirane.

Početna valuta: BAM
Planirane valute: EUR, USD, CHF

---

## 14. Skalabilnost

Sistem mora podržavati: horizontalno skaliranje backend-a, više API instanci, load balancer, read replicas, buduću podjelu na servise.

---

## 15. Logging i Monitoring

Sistem mora podržavati: centralizovani logging, audit log, error tracking, monitoring performansi.

Audit log mora bilježiti: prijavu korisnika, promjenu podataka, kreiranje rezervacija, brisanje podataka, administrativne akcije.

---

## 16. Deployment

### 16.1 MVP

Infrastruktura: Docker Compose, jedan server, PostgreSQL, Redis, Nginx.

### 16.2 Buduće verzije

Podržane platforme: Hetzner, DigitalOcean, AWS.
Napredna infrastruktura: Kubernetes, CI/CD pipeline, automatski deployment.

### 16.3 Marketplace Ready arhitektura

Arhitektura mora podržavati marketplace model bez značajnih izmjena baze podataka.

Svaki tenant mora imati: javni profil, javni URL, galeriju, cjenovnik, radno vrijeme, geolokaciju, kategoriju poslovnog subjekta, cjenovni rang.

Marketplace nije dio MVP-a. Arhitektura mora biti spremna za njegovu implementaciju.

---

## 17. Verzije sistema

- **v1** — Backend MVP, Web aplikacija
- **v2** — Android aplikacija
- **v3** — iOS aplikacija, napredne notifikacije
- **v4** — Marketplace
- **v5** — AI funkcionalnosti, automatizacije

---

## 18. Tehnička pravila

- backend mora biti stateless
- svi podaci prolaze kroz API
- frontend nema direktan pristup bazi
- svaka funkcija mora biti testabilna
- svaka nova funkcionalnost mora biti kompatibilna sa postojećim sistemom
- tenant izolacija je obavezna

---

## 19. Tehnički dug

Nije dozvoljeno:
- hardkodiranje poslovne logike u frontend-u
- direktni SQL upiti van repository sloja
- dupliranje business logike
- zaobilaženje servisnog sloja
- ručne izmjene produkcijske baze

---

## 20. Zaključak

Ovaj dokument definiše tehničku arhitekturu SmartBooking platforme. Svi budući moduli i implementacije moraju biti usklađeni sa ovom arhitekturom. Svako odstupanje mora biti dokumentovano i odobreno kroz Project Blueprint proces.

Cilj arhitekture je:
- stabilan MVP
- jednostavno održavanje
- jednostavno skaliranje
- marketplace spremnost
- podrška za više zemalja, jezika i valuta

---

*Kraj dokumenta.*
