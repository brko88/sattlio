# Sattlio Platform — Release Checklist v1.0

**Datum:** 26.06.2026.
**Status:** Faza A + Faza B + Faza C + Faza C.5 (Test Suite) — KOMPLETNE
**Sljedeća faza:** Faza D (Docker, deployment, security poliranje) — prije prvog stvarnog salona

---

## 1. Završene funkcionalnosti

### 1.1 Autentifikacija i sigurnost
- [x] Registracija korisnika (email + lozinka, bcrypt heširanje)
- [x] Login (JWT access token + refresh token)
- [x] Refresh token rotacija (stari token se povlači pri svakoj upotrebi)
- [x] Logout (povlačenje refresh tokena)
- [x] Email verifikacija (token generisan, slanje emaila, `/verify-email` ruta)
- [x] Zaštićene rute (`get_current_user` dependency)
- [x] Role-based ovlaštenja (owner-only akcije razdvojene od member-only)
- [x] Tenant izolacija (svaki upit filtrira po `tenant_id`, validiran kroz `UserTenantRole`)

### 1.2 Multi-tenant upravljanje
- [x] Kreiranje poslovnog subjekta (tenant), automatski slug
- [x] Automatsko dodjeljivanje `owner` role kreatoru
- [x] Lista "moji tenant-i" sa rolom po tenant-u
- [x] Tenant switching kroz UI (dropdown u sidebar-u)
- [x] Podrška za jednog korisnika u više tenant-a sa različitim ulogama

### 1.3 Upravljanje poslovanjem
- [x] Employees — CRUD (kreiranje, lista), soft-delete polja spremna
- [x] Services — CRUD (kreiranje, lista), validacija (trajanje, cijena obavezni)
- [x] Customers — CRUD (kreiranje, lista, pretraga po imenu/prezimenu/telefonu)
- [x] Working Hours — CRUD kompletan (dodavanje, **ažuriranje umjesto duplikata**, brisanje)

### 1.4 Booking Engine (najkritičniji dio)
- [x] Kreiranje rezervacije sa automatskim računanjem `end_time` (iz trajanja usluge)
- [x] Overlap provjera (BR-020) — testirano uključujući graničnu vrijednost (termini koji se dodiruju)
- [x] Working hours provjera (termin samo u radno vrijeme i na radni dan)
- [x] Provjera da termin nije u prošlosti (BR-024)
- [x] Provjera da zaposleni/usluga postoje i da su aktivni
- [x] Status tranzicije (created → confirmed → completed/cancelled/no_show), BR-044 (završen ne može biti otkazan)
- [x] **Race condition zaštita** (`with_for_update()` na Employee redu) — sprečava duplikat rezervacije kod istovremenih zahtjeva

### 1.5 Frontend (web aplikacija)
- [x] Login, Register stranice
- [x] Dashboard sa statistikama (broj zaposlenih/usluga/klijenata/rezervacija)
- [x] Layout sa sidebar navigacijom i tenant switcher-om
- [x] Sve CRUD stranice (Employees, Services, Customers, Working Hours)
- [x] Appointments — lista sa filterom, kreiranje, status akcije
- [x] **Vizuelni kalendar** — dnevni prikaz, precizno pozicioniranje termina (uključujući termine koji ne počinju na puni sat), klik-modal sa detaljima i akcijama
- [x] Tailwind CSS dizajn sistem kroz cijelu aplikaciju (konzistentne boje, razmaci, komponente)
- [x] Success/error povratne poruke na svim formama

---

## 2. Svi API endpointi

| Metoda | Putanja | Opis | Ovlaštenje |
|--------|---------|------|-----------|
| POST | `/api/v1/auth/register` | Registracija | Javno |
| POST | `/api/v1/auth/login` | Login (vraća access + refresh token) | Javno |
| POST | `/api/v1/auth/refresh` | Obnova access tokena (rotacija) | Refresh token |
| POST | `/api/v1/auth/logout` | Odjava (povlači refresh token) | Refresh token |
| POST | `/api/v1/auth/verify-email` | Email verifikacija | Javno (token-based) |
| GET | `/api/v1/auth/me` | Podaci ulogovanog korisnika | Ulogovan |
| POST | `/api/v1/tenants` | Kreiranje poslovnog subjekta | Ulogovan (postaje owner) |
| GET | `/api/v1/tenants/my` | Lista tenant-a korisnika sa rolom | Ulogovan |
| POST | `/api/v1/employees` | Dodavanje zaposlenog | Owner |
| GET | `/api/v1/employees` | Lista zaposlenih | Member |
| POST | `/api/v1/services` | Dodavanje usluge | Owner |
| GET | `/api/v1/services` | Lista usluga | Member |
| POST | `/api/v1/working-hours` | Dodavanje/ažuriranje radnog vremena | Owner |
| GET | `/api/v1/working-hours` | Lista radnog vremena za zaposlenog | Member |
| DELETE | `/api/v1/working-hours/{id}` | Brisanje radnog vremena | Owner |
| POST | `/api/v1/customers` | Dodavanje klijenta | Member |
| GET | `/api/v1/customers` | Lista/pretraga klijenata | Member |
| POST | `/api/v1/appointments` | Kreiranje rezervacije | Member |
| GET | `/api/v1/appointments` | Lista rezervacija | Member |
| POST | `/api/v1/appointments/{id}/cancel` | Otkazivanje rezervacije | Member |
| POST | `/api/v1/appointments/{id}/complete` | Završavanje rezervacije | Member |

**Ukupno: 20 endpointa.**

---

## 3. Svi testovi (automatizovani test suite)

**Ukupno: 46 testova, svi prolaze (`46 passed`).** Pokretanje: `pytest --html=test_report.html --self-contained-html` iz root foldera.

| Fajl | Broj testova | Pokriva |
|---|---|---|
| `test_auth.py` | 10 | Registracija, duplikat email, login (uspjeh/pogrešna lozinka/nepostojeći korisnik), zaštićene rute (sa/bez/nevažeći token), email verifikacija, **refresh token rotacija** |
| `test_tenants.py` | 4 | Kreiranje, unique slug generisanje, auto-owner dodjela, zahtjev bez autentifikacije |
| `test_tenant_isolation.py` | 7 | **KRITIČNO** — cross-tenant pristup odbijen za employees/services/customers/appointments/working-hours, cross-tenant creation odbijen, employee iz drugog tenant-a ne može se koristiti u appointment-u |
| `test_employees.py` | 4 | Owner kreira, non-member odbijen, prazna lista, lista sa podacima |
| `test_services.py` | 3 | Kreiranje, validacija obaveznih polja, non-owner odbijen |
| `test_customers.py` | 4 | Bez email/telefona, validacija imena, member kreira, pretraga |
| `test_working_hours.py` | 4 | Kreiranje, start<end validacija, **regresija duplikata** (dodavanje istog dana ažurira, ne duplira), brisanje |
| `test_appointments.py` | 10 | Kreiranje, overlap odbijen, granični slučaj (termini se dodiruju), prošlost odbijena, van radnog vremena odbijeno, neaktivna usluga odbijena, status tranzicije, BR-044, otkazan termin oslobađa slot, **race condition regresija** (threading test) |

**Napomena:** Testovi koriste izolovanu SQLite test bazu (ne dira produkcijsku PostgreSQL bazu) i mock-uju slanje email-a (ne zavise od mreže/WiFi-ja).

---

## 4. Poznata ograničenja (trenutna verzija)

### 4.1 Funkcionalna ograničenja
- Appointments podržavaju samo **jednu uslugu po rezervaciji** (BR-033, namjerno MVP ograničenje)
- Nema podrške za **višestruke lokacije** po tenant-u u UI-ju (baza je spremna — `location_id` kolona postoji — ali UI/logika koriste samo jednu implicitnu lokaciju)
- Nema **pauza/blokiranih termina** za zaposlene (zapisano u Dokumentu 18 kao V2 ideja)
- Nema **liste čekanja (waitlist)** za popunjene termine (Dokument 18)
- Nema **edit/update rute** za Employees, Services, Customers (samo create + list trenutno; update postoji samo za Working Hours)
- Appointments nemaju **PUT/update rutu** za izmjenu vremena postojeće rezervacije (samo cancel/complete)
- Kalendar prikazuje samo **dnevni** pregled — sedmični/mjesečni prikaz nije implementiran

### 4.2 Infrastrukturna ograničenja
- **Nema Dockera** — backend i frontend se pokreću direktno (`uvicorn`, `npm run dev`), nisu kontejnerizovani
- **Nema audit log servisa** — Dokument 06/10 traže bilježenje akcija (login, promjene, brisanja), trenutno nije implementirano
- **Nema rate limiting-a** — endpointi nisu zaštićeni od učestalih zahtjeva sa istog IP-a
- **Nema brute-force zaštite** na login ruti (neograničen broj pokušaja)
- **Nema sigurnosnih HTTP headera** (HSTS, CSP, X-Frame-Options, itd.)
- **CORS je ograničen samo na `localhost:5173`** — treba ažurirati za produkcijski domen
- Lokalni `.env` sadrži **development SECRET_KEY** — mora se zamijeniti pravim, nasumično generisanim ključem prije produkcije
- Nema CI/CD pipeline-a — deploy je trenutno ručan

### 4.3 Sigurnosna ograničenja koja zahtijevaju pažnju
- Email verifikacija postoji, ali **ne blokira** korištenje platforme (korisnik se može ulogovati i koristiti sistem i bez verifikovanog emaila) — Dokument 06, sekcija 12.1 traži da određene akcije budu blokirane dok email nije verifikovan
- Nema **2FA** (two-factor authentication)
- Lozinke nemaju zahtjev za minimalnu kompleksnost (samo `minLength={8}` na frontendu, ne na backendu)

---

## 5. Lista za provjeru prije prvog salona (PRE-LAUNCH CHECKLIST)

### 5.1 Infrastruktura (KRITIČNO)
- [ ] Migracija sa lokalnog računara na VPS server (Hetzner/DigitalOcean, prema Dokumentu 08)
- [ ] Docker + Docker Compose postavka
- [ ] Pravi domen registrovan i povezan (DNS)
- [ ] SSL certifikat (Let's Encrypt) — HTTPS obavezan
- [ ] PostgreSQL backup strategija (dnevni automatski backup)
- [ ] Ažuriranje CORS podešavanja sa `localhost` na stvarni produkcijski domen

### 5.2 Sigurnost (KRITIČNO)
- [ ] Generisati novi, nasumičan `SECRET_KEY` za JWT (ne koristiti dev vrijednost)
- [ ] Premjestiti `.env` van git repozitorija ako već nije (provjeriti `.gitignore`)
- [ ] Implementirati rate limiting (minimum na `/auth/login` i `/auth/register`)
- [ ] Implementirati brute-force zaštitu (blokiranje IP-a nakon N neuspjelih login pokušaja)
- [ ] Dodati sigurnosne HTTP headere (HSTS, X-Content-Type-Options, itd.)
- [ ] Odlučiti i implementirati: da li email verifikacija treba blokirati funkcionalnost dok nije potvrđena

### 5.3 Funkcionalna provjera (manuelno testiranje punog toka)
- [ ] Registracija → email stiže → verifikacija → login (kompletan tok, na produkcijskom serveru, ne localhost)
- [ ] Kreiranje tenant-a → dodavanje zaposlenog → radno vrijeme → usluga → klijent → rezervacija → kalendar prikaz
- [ ] Provjera da email za potvrdu rezervacije (ako se odluči implementirati) radi
- [ ] Test na **stvarnom mobilnom telefonu** (ne samo desktop browser) — provjeriti responsive prikaz
- [ ] Test u različitim browserima (Chrome, Safari, Firefox)

### 5.4 Operativna spremnost
- [ ] Pokrenuti kompletan test suite (`pytest`) na produkcijskoj kopiji koda prije deploya
- [ ] Pripremiti plan podrške za prve korisnike (ko odgovara na pitanja/probleme)
- [ ] Pripremiti jednostavno uputstvo za vlasnika salona (kako se registrovati i postaviti prvi termin)
- [ ] Odlučiti model pristupa za prve korisnike (vidi Dokument 17 — besplatan pristup bez ograničenja dok se validira proizvod)
- [ ] Pripremiti kanal za prikupljanje feedbacka (čak i jednostavan — email ili telefon)

### 5.5 Monitoring (minimum za prvi launch)
- [ ] Osnovni uptime monitoring (provjera da server radi — može biti i jednostavan, besplatan servis)
- [ ] Provjeriti da serverski logovi (uvicorn) bilježe greške vidljivo

---

## 6. Zaključak

Backend i frontend su funkcionalno kompletni za MVP definisan u Dokumentu 14 (Faza A kroz C.5). Automatizovani test suite potvrđuje da je poslovna logika (booking, tenant izolacija, auth) ispravna i otporna na regresiju. Sljedeći korak je Faza D — infrastrukturna i sigurnosna priprema za izlaganje sistema stvarnim korisnicima, prema listi u sekciji 5 ovog dokumenta.

Nijedna stavka iz sekcije 5.1 i 5.2 ("KRITIČNO") ne treba biti preskočena prije nego prvi salon počne da koristi platformu.

---

*Dokument generisan 26.06.2026. na osnovu zajedničke razvojne sesije — Sattlio Platform.*

