# SmartBooking Platform — Release Checklist v1.0

**Datum:** 26.06.2026. (ažurirano 28.06.2026., pa 13.07.2026.)
**Status:** Faza A + Faza B + Faza C + Faza C.5 (Test Suite) + Docker — KOMPLETNE. Veći dio Faze D takođe završen (vidi ažuriranje 13.07.2026. ispod).
**Sljedeća faza:** Preostali Faza D infra/sigurnost/legal stavke — vidi ažuriranu listu u sekciji 5.

---

## AŽURIRANJE 13.07.2026. — provjera stanja koda naspram ovog dokumenta

Ovaj dokument je bio zastario oko dvije sedmice (pisan 26-29.06, kod je od tada značajno napredovao). Sekcije ispod su ažurirane da odražavaju STVARNO stanje koda na 13.07.2026, provjereno direktno kroz čitanje `app/api/routes/*.py`, `app/main.py`, `app/models/*.py`, `frontend/src/`. Stavke koje su bile otvorene a sad su gotove su označene, dodane su nove poznate praznine, a jedna **nova, stvarna greška** je otkrivena:

- **🐛 BUG: `/api/v1/support/report-issue` je neuklonjivo mrtva ruta.** `app/api/routes/support.py` definiše rutu i frontend `ReportIssue.tsx` je poziva, ALI `app/main.py` nikad ne radi `app.include_router(support.router)` — endpoint trenutno vraća 404 na produkciji. Stavka #1 u sekciji 0 ispod ("GOTOVO 29.06.2026") više NIJE tačna. Treba popraviti dodavanjem jedne linije u `main.py`.

---

## 0. SLJEDEĆA SESIJA — konkretna, dogovorena lista (ažurirano 28.06.2026.)

Redoslijed važan zbog zavisnosti između stavki. Detalji i tehničke skice za svaku stavku su u referenciranim dokumentima.

1. 🟡 **DJELIMIČNO — regresija otkrivena 13.07.2026.** Prijava problema (bug report). Frontend stranica (`ReportIssue.tsx`) i backend ruta (`app/api/routes/support.py`) postoje, ali ruta nije registrovana u `app/main.py` → trenutno vraća 404. Vidi bug napomenu na vrhu dokumenta. Treba jednu liniju popravke.
2. ✅ **GOTOVO (29.06.2026.) JIB verifikacija + Admin panel (osnova)** — implementirano i testirano: `jib`/`verification_status` polja, validacija, `is_superadmin` polje, `require_superadmin` zaštita, Admin panel rute (lista/verify/suspend/reactivate), frontend stranica. Vidi sekciju 5.2b i 5.2c za dalje proširenje.
3. ✅ **GOTOVO (potvrđeno 13.07.2026.) Forgot Password flow.** `POST /api/v1/auth/forgot-password` i `POST /api/v1/auth/reset-password` implementirani u `app/api/routes/auth.py` (rate-limited 3/minute), koriste postojeći Gmail SMTP. Opšti mehanizam, ne odvojen za admina.
4. ✅ **GOTOVO Employee edit ruta/UI** — `PUT /api/v1/employees/{employee_id}` postoji (`app/api/routes/employees.py`).
5. ✅ **GOTOVO Self-booking sistem (privatno/javno po zaposlenom).** Vlasnik je eksplicitno potvrdio (29.06.2026.) da ovo MORA biti implementirano prije nego prvi salon (van vlasnika) počne koristiti platformu "live" — nije "nice to have" dodatak za kasnije, već temeljni dio toga kako owner bira da vodi svoje poslovanje. Finalna, potvrđena definicija:
   - **Mod A — "Privatno" (`allow_self_booking = False`, default):** SAMO owner/employee može upisati termin u kalendar. Klijent nema nikakav pristup kreiranju rezervacije, bez obzira da li ima nalog na platformi.
   - **Mod B — "Javno" (`allow_self_booking = True`):** I owner/employee I klijent (koji ima nalog na platformi) mogu upisati termin. Ovo NIJE zamjena jedne opcije drugom — obje opcije su dostupne ISTOVREMENO. Owner/employee i dalje može ručno unijeti rezervaciju (npr. nakon telefonskog poziva), ALI klijent sada DODATNO ima mogućnost da sam, kroz svoj nalog, rezerviše termin direktno, bez posredovanja owner-a/employee-a.
   - Vidi Dokument 18, sekcija 2.7 za kompletnu tehničku skicu (manji obim posla nego prvobitno procijenjeno — proširenje postojeće autorizacije na `appointments` ruti, NE treba nov "javni URL bez logovanja" sistem, jer klijent već ima nalog kroz postojeći login sistem). Vidi Dokument 14 za pozicioniranje u redoslijedu.
6. ✅ **GOTOVO Responsive dizajn + PWA.** `frontend/public/manifest.json`, `sw.js`, ikone — prisutni. Hamburger meni u sva 4 layout fajla (Owner/Employee/Customer/Admin). Push notifikacije nisu nezavisno reverifikovane u ovoj reviziji.
7. ✅ **GOTOVO "Moji termini" lista.** `GET /api/v1/appointments/my` implementirano (`app/api/routes/appointments.py`).
8. ✅ **GOTOVO Employee delete ruta.** `DELETE /api/v1/employees/{employee_id}` (soft delete) implementirano.
9. ✅ **GOTOVO Refresh token interceptor.** `frontend/src/services/api.ts` ima axios response interceptor: hvata 401, poziva `/api/v1/auth/refresh`, ponavlja originalni zahtjev sa retry queue-om.
10. ✅ **GOTOVO Projekat je na GitHub-u** (`brko88/sattlio`) — ova revizija je urađena direktno protiv tog repoa.

**Van ove liste, i dalje otvoreno (potvrđeno 13.07.2026.):**
- ❌ Payment gateway (CorvusPay/Monri/Lemon Squeezy/Paddle/FastSpring) — i dalje nikakve integracije u kodu; `app/core/plans.py` ima samo komentar koji referencira budući Paddle checkout.
- Konsultacija sa knjigovođom o poreskim obavezama — otvoreno pravno/poslovno pitanje, van dometa koda (vidi i Dokument 25).
- ❌ Plan enforcement (Solo/Start/Pro/Business limiti) — model postoji (`app/core/plans.py`, `Tenant.plan`/`billing_status`/`trial_ends_at`), ali kod i dalje NE provjerava limite nigdje u rutama.
- Cjenovnik po zaposlenom (`employee_services`), OCR unos, "predloži sljedeći termin" — i dalje samo ideje, nema koda (vidi Dokument 18).

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

### 1.6 Admin panel (NOVO, dodano nakon 26.06.2026.) — DODATO 13.07.2026.
- [x] Backend: `app/api/routes/admin.py` — lista/verify/suspend/reactivate tenant-a, `/stats`, `/health` (platforma), `/tenants/{id}/health` (Health Score), `/users` lista, `/users/{id}/reset-password`, `/users/{id}/block`/`unblock`, `/analytics/growth`, `/analytics/health`
- [x] Frontend: `AdminLayout.tsx`, `AdminPanel.tsx`, `DashboardAdmin.tsx`
- [ ] Audit log *ekran* — `AdminActionLog` model i `log_admin_action()` postoje i pišu se, ali nema GET/list rute za pregled zapisa

### 1.7 Working Hours v2 / Specijalni dani — DODATO 13.07.2026.
- [x] `app/models/special_day.py` + `app/api/routes/special_days.py` — jednokratna izmjena radnog vremena, neradni dan, pauza (`break_start`/`break_end`), sa detekcijom sukoba postojećih rezervacija prije primjene
- [x] `app/core/scheduling.py::get_effective_hours` — zajednička logika prioriteta (SpecialDay > WorkingHours), koristi je i interni booking i self-booking
- [ ] Samo jedna pauza po danu podržana (dokument traži više)

### 1.8 Self-booking, forgot password, media uploads — DODATO 13.07.2026.
- [x] Self-booking Mod A/Mod B (`allow_self_booking` na Employee, `app/api/routes/public.py`)
- [x] Forgot/reset password flow (`app/api/routes/auth.py`)
- [x] Upload logo/cover slike za tenant, avatar za zaposlenog (`app/core/media.py`, rute u `tenants.py`/`employees.py`)
- [x] "Prijavi problem" support ruta postoji u kodu, ali NIJE registrovana u `main.py` — vidi bug napomenu na vrhu dokumenta

---

## 2. Svi API endpointi (ažurirano 13.07.2026.)

**Ukupno: 65 endpointa** (prebrojano direktno iz `app/api/routes/*.py`, decorator po decorator) — znatno više od originalnih 20 navedenih ispod. Tabela ispod je IZVORNA lista iz 26.06.2026. i više NIJE potpuna; nove grupe ruta dodane od tada:
- **Admin** (`admin.py`): tenant lista/verify/suspend/reactivate/health, korisnici (lista/block/unblock/reset-password), platform stats, analytics/growth, analytics/health
- **Public** (`public.py`): javna stranica salona (`/tenants/by-slug/{slug}`), lista salona, zaposleni + usluge + slobodni termini za self-booking, `POST` self-booking rezervacija
- **Special Days** (`special_days.py`): CRUD za specijalne dane/pauze
- **Auth dopune**: `forgot-password`, `reset-password`, `change-password`, `resend-verification`, `PUT /auth/me`
- **Media**: upload/delete avatar (employee), logo/cover (tenant)
- **Edit/delete rute** koje su ranije nedostajale: `PUT`/`DELETE` za employees, services, customers; `PATCH` za tenants
- **Support**: `POST /support/report-issue` — postoji u kodu, ali ruter nije registrovan (bug, vidi vrh dokumenta)

Originalna tabela (26.06.2026, i dalje tačna za ovih 20 — samo više nije kompletna lista):

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

**Ukupno u ovoj tabeli: 20 (originalnih). Stvarno ukupno u kodu na 13.07.2026.: 65.**

---

## 3. Svi testovi (automatizovani test suite)

**Ukupno: 46 test funkcija u `test_suite/` na 13.07.2026.** (isti broj kao 26.06 — nema novih testova dodanih uz svu novu funkcionalnost iz sekcija 1.6-1.8 iznad: admin panel, specijalni dani, self-booking, media upload nemaju test pokrivenost). Pokretanje: `pytest --html=test_report.html --self-contained-html` iz root foldera. Nije pokrenuto u ovoj reviziji (samo brojanje `def test_` po fajlu) — pass/fail status nije nezavisno potvrđen 13.07.2026.

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

## 4. Poznata ograničenja (ažurirano 13.07.2026.)

### 4.1 Funkcionalna ograničenja — riješeno naspram 26.06.2026 verzije
Sljedeće stavke iz originalne liste su GOTOVE, uklonjene odavde: edit/update rute za Employees/Services/Customers (sve tri imaju PUT), DELETE ruta za zaposlene, Admin panel, JIB/legitimnost salona provjera, responsive dizajn, PWA podrška.

I dalje otvoreno:
- Appointments podržavaju samo **jednu uslugu po rezervaciji** (BR-033, namjerno MVP ograničenje)
- Nema podrške za **višestruke lokacije** po tenant-u — potvrđeno 13.07.2026: nema `Location` modela/rute u kodu uopšte (ranija napomena o postojećoj `location_id` koloni nije potvrđena u trenutnoj šemi)
- Nema **pauza/blokiranih termina** kao samostalnog koncepta (djelimično pokriveno kroz Specijalne dane — vidi 1.7 — ali nema "blokiraj slot direktno iz kalendara" akcije)
- Nema **liste čekanja (waitlist)** za popunjene termine (Dokument 18)
- Appointments nemaju **PUT/update rutu** za izmjenu vremena postojeće rezervacije (samo cancel/complete) — i dalje tačno
- Kalendar prikazuje samo **dnevni** pregled — sedmični/mjesečni prikaz i dalje nije implementiran
- **`employee_services`** (cjenovnik po zaposlenom) — i dalje ne postoji (Dokument 18, 2.14)
- **Reliability Score / no-show tracking** — `no_show` postoji kao status vrijednost, ali nema rute koja ga postavlja niti `reliability_score` polja
- **Plan enforcement** — `app/core/plans.py` definiše Solo/Start/Pro/Business, ali kod NE provjerava limite (broj zaposlenih i sl.) nigdje
- **🐛 `/api/v1/support/report-issue` ruta nije registrovana u `main.py`** — nova regresija otkrivena 13.07.2026, vidi vrh dokumenta
- **Nema paginacije ni na jednoj listing ruti** — sve liste vraćaju kompletan skup (`.all()`), problem će postati vidljiv sa rastom broja klijenata/rezervacija po tenant-u
- **Audit log ekran** — podaci se pišu (`AdminActionLog`), ali nema rute za pregled u Admin panelu

### 4.2 Infrastrukturna ograničenja — ažurirano 13.07.2026.
- **Docker implementiran** — backend, frontend, PostgreSQL kroz Docker Compose. (Nije reverifikovano u ovoj reviziji da li `Base.metadata.create_all()` konflikt i dalje postoji.)
- ✅ **Rate limiting implementiran** — `slowapi` (`app/core/limiter.py`), primijenjen na login (10/min), register (5/min), forgot/reset-password (3/min), support (5/min) — ranija stavka "nema rate limitinga" više NIJE tačna.
- **CORS više NIJE hardkodiran na `localhost`** — sada čita `settings.frontend_url` iz env varijable (`app/main.py`); i dalje treba ručno potvrditi da produkcijski `.env` sadrži pravi domen, ne dev vrijednost.
- Baza je i dalje **sinhrona** (SQLAlchemy + `psycopg2-binary`), ne async (`asyncpg`) — ako je async ikad bio plan, nije realizovan; nije nužno problem za trenutni obim.
- **Nema brute-force zaštite u smislu lockout-a naloga** — rate limiting na `/login` (10/min) postoji, ali nema blokiranja naloga/IP-a nakon N uzastopnih neuspjelih pokušaja.
- **Nema sigurnosnih HTTP headera** (HSTS, CSP, X-Frame-Options, itd.) — i dalje tačno, provjereno u `app/main.py`.
- Lokalni `.env` sadrži **development SECRET_KEY** — i dalje treba zamijeniti prije produkcije (nije provjerljivo iz koda da li je promijenjeno na serveru).
- Nema CI/CD pipeline-a (`.github/workflows` ne postoji) — i dalje tačno.
- **Nema monitoringa** (Sentry ili sličan error/uptime alat) — i dalje tačno.
- **Nema automatskog DB backup skripta** u repozitoriju — i dalje tačno.
- **Nema `robots.txt`/`sitemap.xml`** u `frontend/public/` — blokira buduće SEO indeksiranje (Dokument 23).
- **i18n i dalje nije implementiran** — potvrđeno u odvojenoj analizi istog dana (Dokument 20).

### 4.3 Sigurnosna ograničenja koja zahtijevaju pažnju
- Email verifikacija postoji, ali **ne blokira** korištenje platforme (korisnik se može ulogovati i koristiti sistem i bez verifikovanog emaila) — Dokument 06, sekcija 12.1 traži da određene akcije budu blokirane dok email nije verifikovan
- Nema **2FA** (two-factor authentication)
- Lozinke nemaju zahtjev za minimalnu kompleksnost (samo `minLength={8}` na frontendu, ne na backendu)

---

## 5. Lista za provjeru prije prvog salona (PRE-LAUNCH CHECKLIST)

### 5.1 Infrastruktura (KRITIČNO)
- [ ] Migracija sa lokalnog računara na VPS server (Hetzner/DigitalOcean, prema Dokumentu 08)
- [x] Docker + Docker Compose postavka — `docker-compose.yml` (backend, frontend/nginx, postgres:16) — GOTOVO
- [ ] Pravi domen registrovan i povezan (DNS)
- [ ] SSL certifikat (Let's Encrypt) — HTTPS obavezan
- [ ] PostgreSQL backup strategija (dnevni automatski backup) — nema skripte u repou
- [x] 🟡 CORS više nije hardkodiran (čita `settings.frontend_url`) — samo treba potvrditi da je env varijabla na produkciji postavljena na pravi domen, ne dev vrijednost

### 5.1a Plan Enforcement (NIJE KRITIČNO za beta, postaje bitno nakon naplate — odluka 28.06.2026.)

Dokument 13 definiše Solo/Start/Pro/Business pakete sa različitim limitima (broj zaposlenih, lokacija) i funkcionalnostima (email notifikacije, izvještaji, napredna pretraga — vidi Dokument 13, sekcija 6). Trenutni kod NE PROVJERAVA kojem paketu tenant pripada — sve funkcionalnosti rade identično za sve, nezavisno od plana. Potrebno implementirati prije nego naplata stvarno krene:
- [ ] Provjera broja zaposlenih/lokacija u odnosu na limit paketa (blokirati dodavanje novog zaposlenog ako je limit dostignut)
- [ ] Provjera plana prije pristupa "premium" funkcijama (eksport, napredna pretraga, itd. — kad budu implementirane)
- [ ] Veza sa downgrade pravilima (Dokument 13, sekcija 9 — provjeriti limite prije dozvoljavanja downgrade-a)

### 5.2 Sigurnost (KRITIČNO)
- [ ] Generisati novi, nasumičan `SECRET_KEY` za JWT (ne koristiti dev vrijednost) — nije provjerljivo iz koda, treba potvrditi na serveru
- [ ] Premjestiti `.env` van git repozitorija ako već nije (provjeriti `.gitignore`)
- [x] **GOTOVO** Rate limiting implementiran — `slowapi`, na `/auth/login` (10/min), `/auth/register` (5/min), forgot/reset-password (3/min), support (5/min)
- [ ] Implementirati brute-force zaštitu (blokiranje naloga/IP-a nakon N neuspjelih login pokušaja — rate limiting nije isto što i lockout)
- [ ] Dodati sigurnosne HTTP headere (HSTS, X-Content-Type-Options, itd.) — i dalje nema u `app/main.py`
- [ ] Odlučiti i implementirati: da li email verifikacija treba blokirati funkcionalnost dok nije potvrđena — i dalje ne blokira

### 5.2a Pravni dokumenti (KRITIČNO — odluka donesena 26.06.2026.)

Potreban je sljedeći set dokumenata prije puštanja u produkciju:
- [ ] **Pricing** — javno dostupna stranica/dokument sa cijenama (Claude može napraviti solidan nacrt na osnovu Dokumenta 13)
- [ ] **Terms of Service** — PRAVNO OSJETLJIVO, preporučuje se pregled lokalnog advokata prije objave
- [ ] **Privacy Policy** — PRAVNO OSJETLJIVO, GDPR usklađenost ako se planiraju EU korisnici, preporučuje se pregled advokata
- [ ] **Refund Policy** — PRAVNO OSJETLJIVO, mora biti usklađena sa zakonom o zaštiti potrošača u BiH, preporučuje se pregled advokata
- [ ] **Cookie Policy** — Claude može napraviti solidan nacrt (manje pravno rizično od ToS/Privacy)
- [ ] **Acceptable Use Policy** — Claude može napraviti solidan nacrt (manje pravno rizično)

**Odluka (26.06.2026.):** Vlasnik je odlučio da sačeka sa izradom svih šest dokumenata dok ne bude bliže launch-u. Claude može napraviti nacrte na zahtjev, ali Terms of Service/Privacy Policy/Refund Policy MORAJU biti pregledani od lokalnog advokata prije nego se stvarno koriste sa pravim korisnicima — ovo nisu dokumenti koje AI-generisan nacrt može samostalno garantovati kao pravno punovažne.

### 5.2b JIB Verifikacija Salona — OBAVEZNO (odluka donesena 26.06.2026.)

**Problem identifikovan tokom sesije:** Trenutno NE postoji nikakav mehanizam koji sprečava kreiranje fiktivnih/lažnih salona — bilo koji registrovan korisnik može kreirati neograničen broj tenant-a sa bilo kojim imenom, bez provjere da li poslovni subjekt stvarno postoji. Ovo postaje posebno rizično u kombinaciji sa affiliate programom (Dokument 19) — moguća je prevara gdje partner "dovodi" fiktivne salone da ubere referral nagradu.

**Rješenje — JIB (Jedinstveni identifikacioni broj) kao obavezno polje:**

JIB je javni, registarski poslovni identifikator (nije osjetljiv lični podatak kao JMBG) — svaka legalna firma u BiH ga mora imati. Zahtijevanje JIB-a pri registraciji tenant-a prirodno filtrira fiktivne salone, bez potrebe za automatskim API pozivom prema državnim registrima (provjereno 26.06.2026: ne postoji jasan, besplatan automatski API za to — APIF nudi "ugovor" za automatsko preuzimanje podataka, što je plaćena usluga van trenutnog obima).

**Implementacija — backend:**
1. [ ] Dodati obavezno polje `jib` na `Tenant` model (string, 13 cifara za BiH format), sa **UNIQUE constraint** (potvrđeno 26.06.2026: prema zvaničnom pravilniku o registraciji, poslovna jedinica/podružnica dobija SOPSTVENI, odvojen JIB sa specifičnom strukturom — npr. brojevi "42"/"46" na početku za poslovne jedinice u RS — dakle UNIQUE ne ograničava legitimne lance salona, jer svaka lokacija ima svoj JIB)
2. [ ] Validacija formata: **tačno 13 karaktera, ISKLJUČIVO numerički (cifre 0-9, ne slova ni specijalni znakovi)**, BiH JIB strukturu (provjeriti tačan checksum algoritam ako postoji)
3. [ ] **Validacija protiv trivijalnih lažnih obrazaca** (zahtjev korisnika, 26.06.2026): odbiti JIB koji se sastoji od iste cifre ponovljene 13 puta (npr. "0000000000000", "5555555555555") — ovo prolazi format provjeru (13 cifara) ali je očigledno nevažeći
4. [ ] Dodati `is_verified` / `verification_status` polje na `Tenant` model (vrijednosti npr. `pending`, `verified`, `suspended`) — novi tenant kreće kao `pending`
5. [ ] **Potvrđeno (26.06.2026.): salon sa statusom `pending` MOŽE odmah koristiti platformu** (dodavati zaposlene, usluge, primati rezervacije) — verifikacija JIB-a se odvija U POZADINI, ne blokira korištenje. `pending`/`verified`/`suspended` je informativni status za Admin panel pregled, ne blokirajući gate za funkcionalnost (osim kad admin eksplicitno postavi `suspended`).
5a. [ ] **AUTOMATSKA VERIFIKACIJA PRI PRVOJ UPLATI — odluka 26.06.2026. (vlasnikova ideja, potvrđeno kao odlično rješenje).** Kompletan tok verifikacije kroz dvije faze:
   - **Faza 1 — Beta period** (prvih 20-30 salona, besplatno, bez vremenskog ograničenja, Dokument 17): vlasnik (Brko) RUČNO verifikuje svaki salon kroz Admin panel (companywall.ba pretraga + klik "Verified"). Izvodljivo za ovaj mali obim.
   - **Faza 2 — Nakon beta perioda** (kad svi korisnici prelaze na plaćeni model, Dokument 13): NOVO PRAVILO — kad tenant izvrši PRVU uspješnu uplatu pretplate (kroz payment gateway/MoR integraciju, Dokument 19), `verification_status` se AUTOMATSKI postavlja na `verified`, bez potrebe za ručnom intervencijom. Razlog: plaćanje je samo po sebi jak signal legitimnosti (fiktivni/lažni profil nema razlog da plaća) — ovo automatski skalira verifikacioni proces baš kad bi ručni rad postao neodrživ (rastući broj plaćajućih korisnika).
   - **Implikacija:** Ručna verifikacija (koraci 5-7) ostaje potrebna SAMO za: (a) beta period prije nego payment sistem postoji, (b) korisnike koji ostanu u besplatnom/trial statusu duže vrijeme bez plaćanja. Nakon što payment integracija postoji, ručni rad se prirodno smanjuje.

**Implementacija — Admin panel (NOVI modul, nije još napravljen):**
5. [ ] Napraviti Admin panel rutu/stranicu (dostupna samo `superadmin` roli) koja prikazuje listu svih tenant-a sa njihovim JIB brojevima
6. [ ] Dugme/akcija za ručnu provjeru — vlasnik (Brko) provjeri JIB na javnom registru (npr. companywall.ba, bizreg.pravosudje.ba, ili APIF pretraga) i ručno postavi status na `verified`
7. [ ] Dugme/akcija "Suspenduj salon" — ako se utvrdi da JIB ne postoji ili je nevažeći, postavi status na `suspended` (slično konceptu iz Dokumenta 13, sekcija 12 — suspendovana pretplata, podaci se ne brišu, samo se blokira aktivno korištenje)
8. [ ] **Admin manuelno kreiranje tenant-a (BEZ JIB validacije) — rub-slučaj, odluka 26.06.2026.** Posebna ruta `POST /api/v1/admin/tenants` (superadmin-only), odvojena od standardne `POST /api/v1/tenants` koju koriste obični korisnici. Omogućava superadminu da unese sve podatke ručno, uključujući OPCIONI/placeholder JIB (bez striktne validacije formata), za rijetke, namjerne rub-slučajeve (npr. legitiman obrtnik bez standardnog JIB formata, demo/test nalog). Tenant kreiran kroz ovu rutu automatski dobija `verification_status = verified` (jer je admin lično odlučio o legitimnosti, zaobilazeći automatsku/standardnu provjeru). Razlog zašto je ovo bezbedno: standardna registracija (dostupna svima) i dalje zahtijeva JIB — ovaj zaobilazni put je dostupan SAMO superadmin roli, dakle ne otvara rupu za masovnu/automatizovanu zloupotrebu, samo daje fleksibilnost za rijetke, ljudske odluke.
9. [ ] **Izmjena placeholder JIB-a na stvarni (odluka 26.06.2026.)** — Admin panel mora imati `PUT`/edit mogućnost da superadmin KASNIJE ažurira JIB polje na postojećem tenant-u (npr. kad salon kreiran kroz Korak 8 sa privremenim/placeholder JIB-om naknadno dobije ili dostavi svoj stvarni JIB). Ovo je standardna edit ruta na `Tenant` modelu (trenutno ne postoji nikakva update/PUT ruta za Tenant) — treba dodati kao dio Admin panel modula, za sva tenant polja (JIB, naziv, adresa, telefon), ne samo JIB.

**Odluka o obimu (26.06.2026.):** Owner self-service edit (da vlasnik salona SAM mijenja svoju adresu/telefon kroz svoj Dashboard, bez admina) NIJE prioritet — procjena je da su ovakve promjene rijetke. Za sada je DOVOLJNA samo Admin-only edit ruta (superadmin ažurira za vlasnika na zahtjev, kroz Admin panel). Owner self-service edit ostaje otvorena mogućnost za kasnije, ako se pokaže da je potreba učestalija nego što se trenutno procjenjuje.

**Napomena o redoslijedu:** Ovo zahtijeva i Admin panel modul koji TRENUTNO NE POSTOJI u kodu (Dokument 01 ga spominje kao Super Administrator funkcionalnost, ali nije implementiran kroz sesije do 26.06.2026). Implementacija JIB verifikacije i Admin panela treba ići zajedno, kao jedna cjelina, prije nego affiliate program (Dokument 19) ili javni launch budu aktivni.

**Napomena o CompanyWall API (otkriveno 26.06.2026., još nije kontaktirano):** companywall.ba ima zvaničan, dokumentovan REST API (JSON odgovori) koji bi mogao automatizovati JIB verifikaciju (unos JIB-a → automatsko popunjavanje naziva/adrese firme + trenutna provjera legitimnosti, umjesto ručne provjere u koraku 6). Vlasnik je odlučio da ovo ostavi za kasnije istraživanje — ručna provjera (companywall.ba pretraga + Admin panel klik) je dovoljna za sada.

**STATUS OSNOVE (29.06.2026.): GOTOVO I TESTIRANO.** Koraci 1-7 implementirani i potvrđeni kroz stvaran test (kreiranje tenant-a sa JIB-om, verify, suspend, reactivate akcije). Koraci 8-9 (manuelno admin kreiranje, generalna edit ruta) OSTAJU za implementaciju — vidi sekciju 5.2c ispod za kompletnu, proširenu listu budućih Admin panel funkcija.

### 5.2c Proširene Admin Panel funkcije (zapisano 29.06.2026., razmišljanje tokom pauze)

Dopuna na osnovu Dokumenta 01, sekcija 3.1 (Super Administrator ovlaštenja) i novih ideja vlasnika. Status "GOTOVO" odnosi se na već implementiranu osnovu (29.06.2026), ostalo je TODO za buduće sesije.

**Iz Dokumenta 01, sekcija 3.1 (dokumentovano, provjereno 29.06.2026):**
- [x] Pregled svih poslovnih subjekata — GOTOVO
- [x] **GOTOVO (13.07.2026.)** Upravljanje korisnicima — `GET /admin/users`, `/users/{id}/block`, `/users/{id}/unblock`, `/users/{id}/reset-password` sve implementirano
- [ ] Upravljanje pretplatama — zavisi od payment gateway integracije (Dokument 19), i dalje ne prioritet
- [x] **GOTOVO** Pregled statistike — `GET /admin/stats`, `/admin/analytics/growth`, `/admin/analytics/health`
- [x] Blokiranje naloga — GOTOVO i za Tenant (suspend) i za User (`block`/`unblock`)
- [ ] Upravljanje sistemskim postavkama — nejasno definisano, van obima za sada

**Nove ideje vlasnika (29.06.2026.) — status 13.07.2026.:**
- [x] **GOTOVO Pretraga tenant-a** po nazivu, JIB-u, gradu, email-u — `?search=` parametar na `GET /admin/tenants` (`admin.py`, filtrira `Tenant.name`/`jib`/`city`/`email` sa `ilike`)
- [x] **GOTOVO Pretraga korisnika/email-a** — `?search=` parametar na `GET /admin/users`, filtrira po `User.email`/`first_name`/`last_name` i povezanom nazivu tenant-a
- [x] **GOTOVO Reset lozinke korisniku (admin-initiated)** — `POST /admin/users/{id}/reset-password` implementirano, ISKORIŠTENO zajedno sa opštim forgot-password flow-om kako je predloženo

**Dodatne ideje vrijedne razmatranja (predlog Claude-a, na osnovu iskustva sa sličnim sistemima):**
- [ ] Brza statistika po tenant-u u tabeli (broj zaposlenih/usluga/rezervacija) — vizuelni dodatak postojećoj tabeli
- [ ] Filter po statusu (prikaži samo `pending` / samo `suspended`) — lako, dropdown filter na postojećoj listi
- [ ] Audit log pregled (ko je šta radio) — već zapisano kao v1.2 u glavnom redoslijedu (Faza D), ne duplirati ovdje, samo napomena da se Admin panel UI za to prirodno nadovezuje
- [ ] Brisanje User naloga (GDPR "right to be forgotten") — relevantno SAMO ako se ide na EU tržište (Dokument 20), nije prioritet za BiH fazu

**Status: Lista zapisana za buduće sesije. Redoslijed prioriteta nije fiksiran — odlučiti kad se dođe do implementacije, na osnovu toga šta se pokaže kao stvarno potrebno u praksi (npr. ako bude support upita "ko je registrovan na ovom mailu", to ide prvo).**

### 5.3 Funkcionalna provjera (manuelno testiranje punog toka)
- [ ] Registracija → email stiže → verifikacija → login (kompletan tok, na produkcijskom serveru, ne localhost)
- [ ] Kreiranje tenant-a → dodavanje zaposlenog → radno vrijeme → usluga → klijent → rezervacija → kalendar prikaz
- [ ] **Self-booking Mod A (privatno) — potvrditi da klijent NEMA pristup kreiranju rezervacije kad je `allow_self_booking = False`**
- [ ] **Self-booking Mod B (javno) — potvrditi da klijent MOŽE sam rezervisati kad je `allow_self_booking = True`, I da owner/employee i dalje mogu ručno unositi termine ISTOVREMENO (oba načina aktivna zajedno, ne međusobno isključiva)**
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

## 6. Zaključak (ažurirano 13.07.2026.)

Backend i frontend su ne samo funkcionalno kompletni za originalni MVP (Dokument 14, Faza A-C.5), nego su od 29.06.2026. narasli znatno dalje: Admin panel, JIB verifikacija, self-booking, Working Hours v2 (specijalni dani), forgot-password, refresh-token interceptor, media upload i PWA su svi implementirani i potvrđeni u kodu (65 API endpointa naspram originalnih 20). Automatizovani test suite i dalje ima 46 testova — pokriva Fazu A dobro, ali NE pokriva ništa od nove funkcionalnosti dodane nakon 26.06 (admin, specijalni dani, self-booking, media).

Preostale KRITIČNE stavke prije prvog pravog (van vlasnika) salona, po ovoj reviziji: VPS/domen/SSL/backup (5.1), sigurnosni HTTP headeri i brute-force lockout (5.2), pravni dokumenti — ToS/Privacy/Refund pravno pregledani (5.2a), monitoring (5.5), i popravka `support.router` regresije (vrh dokumenta). Payment gateway i plan enforcement ostaju namjerno odgođeni dok se ne donese odluka o naplati.

---

*Dokument generisan 26.06.2026., ažuriran 28-29.06.2026., pa 13.07.2026. na osnovu direktne provjere koda naspram ovog dokumenta — Sattlio Platform.*
