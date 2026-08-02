# SmartBooking Platform — Release Checklist v1.0

**Datum:** 26.06.2026. (ažurirano 28.06.2026.; **veliki presjek statusa 02.08.2026.** — svaka stavka označena ✅ GOTOVO / ⏳ OSTAJE na osnovu provjere stvarnog koda, ne po sjećanju)
**Status:** Faza A + B + C + C.5 + Docker + praktično cijela Faza D (security/perf poliranje) — KOMPLETNE. Verzija: v0.9.0-beta.6.
**Sljedeća faza:** deploy na produkcijski VPS — konkretna lista za dan deploya je u Claude memoriji (deploy checklist) i sekciji 5 ispod

---

## 0. SLJEDEĆA SESIJA — konkretna, dogovorena lista (ažurirano 28.06.2026.)

Redoslijed važan zbog zavisnosti između stavki. Detalji i tehničke skice za svaku stavku su u referenciranim dokumentima.

1. ✅ **GOTOVO (29.06.2026.) Prijava problema (bug report).** Dva dugmeta u sidebar-u (Email: boris.kalamanda@gmail.com, WhatsApp: +387 65 497 119), implementirano i testirano — oba linka rade ispravno.
2. ✅ **GOTOVO (29.06.2026.) JIB verifikacija + Admin panel (osnova)** — implementirano i testirano: `jib`/`verification_status` polja, validacija, `is_superadmin` polje, `require_superadmin` zaštita, Admin panel rute (lista/verify/suspend/reactivate), frontend stranica. Vidi sekciju 5.2b i 5.2c za dalje proširenje.
3. ✅ **GOTOVO — Forgot Password flow.** Implementiran i testiran: `POST /auth/forgot-password` + `/auth/reset-password`, token-based (1h istek), token se čuva HEŠIRAN u bazi (ne plaintext), generička poruka bez otkrivanja postoji li email, rate limit 5/min, admin može pokrenuti isti mehanizam kroz Admin panel (`/admin/users/{id}/reset-password`). Nova lozinka prolazi zajedničku validaciju jačine (01.08.2026.) i poništava sve aktivne sesije. *(Originalna stavka:)* Otkriveno tokom razmišljanja o Admin reset lozinke (sekcija 5.2c) — "Forgot Password" mehanizam TRENUTNO NE POSTOJI NIGDJE u sistemu, ni za obične korisnike. Vlasnik je odlučio: implementirati JEDAN, opšti mehanizam (ne odvojeno za admina i za korisnike) — korisnik sam pokreće reset (klikom na "Zaboravljena lozinka" na Login stranici), I admin može pokrenuti isti mehanizam za korisnika kroz Admin panel (support slučaj). Tehnička skica: token-based reset (slično postojećem email verification tokenu), email sa linkom koji vodi na "Postavi novu lozinku" stranicu, token ističe nakon određenog vremena (npr. 1h). Koristi postojeći Gmail SMTP sistem.
4. ✅ **GOTOVO — Employee edit ruta/UI** (`EmployeeUpdate` schema + PUT ruta + edit u `Employees.tsx`; uz to i avatar upload, `allow_self_booking` i `can_manage_own_hours` toggle-ovi).
5. ✅ **GOTOVO — Self-booking sistem** — implementiran tačno po definiciji ispod (Mod A default privatno / Mod B javno, oba kanala istovremeno aktivna u Modu B), plus naknadna očvršćivanja: email verifikacija obavezna za self-booking, max 5 aktivnih termina po klijentu po salonu, max 90 dana unaprijed, rate limit 10/30s, server-side validacija radnog vremena. *(Originalna definicija:)* Vlasnik je eksplicitno potvrdio (29.06.2026.) da ovo MORA biti implementirano prije nego prvi salon (van vlasnika) počne koristiti platformu "live" — nije "nice to have" dodatak za kasnije, već temeljni dio toga kako owner bira da vodi svoje poslovanje. Finalna, potvrđena definicija:
   - **Mod A — "Privatno" (`allow_self_booking = False`, default):** SAMO owner/employee može upisati termin u kalendar. Klijent nema nikakav pristup kreiranju rezervacije, bez obzira da li ima nalog na platformi.
   - **Mod B — "Javno" (`allow_self_booking = True`):** I owner/employee I klijent (koji ima nalog na platformi) mogu upisati termin. Ovo NIJE zamjena jedne opcije drugom — obje opcije su dostupne ISTOVREMENO. Owner/employee i dalje može ručno unijeti rezervaciju (npr. nakon telefonskog poziva), ALI klijent sada DODATNO ima mogućnost da sam, kroz svoj nalog, rezerviše termin direktno, bez posredovanja owner-a/employee-a.
   - Vidi Dokument 18, sekcija 2.7 za kompletnu tehničku skicu (manji obim posla nego prvobitno procijenjeno — proširenje postojeće autorizacije na `appointments` ruti, NE treba nov "javni URL bez logovanja" sistem, jer klijent već ima nalog kroz postojeći login sistem). Vidi Dokument 14 za pozicioniranje u redoslijedu.
6. 🟡 **DJELIMIČNO — Responsive dizajn ✅ + PWA osnova ✅ + Push notifikacije ⏳.** Responsive GOTOV (mobilni hamburger meniji na sva 4 layouta + Landing, responsive tabele/grid, testirano na mobilnoj rezoluciji). PWA osnova GOTOVA (manifest, service worker sa offline keširanjem, Add to Home Screen, update mehanizam sa banerom "Dostupna je nova verzija" — cache/update tok popravljen i verifikovan 02.08.2026., hard refresh više nikad nije potreban). **Push notifikacije NISU implementirane** — jedina preostala stavka iz ove tačke; ostatak PWA UX detalja (splash, toast...) se vodi u zasebnoj PWA checklisti. *(Originalna stavka:)* Pet konkretnih UI specifikacija već zapisano (full-screen kalendar, 24h format vremena, rješenje za pretrpan raspored, PWA, Google Calendar vizuelni standard). **DODATO 28.06.2026.: Push notifikacije RADE kroz PWA (Android puna podrška, iOS 16.4+ uz instalaciju na Home Screen) — implementirati U ISTOJ sesiji kao PWA "Add to Home Screen", ne čekati native app. Realno pola dana do jedan dan dodatnog rada.** Vidi Dokument 14, stavka v1.1a/v1.1b, i Dokument 18, sekcija 2.15.
7. ✅ **GOTOVO — "Moji termini" lista** (`GET /appointments/my` + `MyAppointments.tsx`, otkazivanje iz liste, N+1 upiti eliminisani batch IN upitima, prikaz u tenant-ovoj vremenskoj zoni).
8. ✅ **GOTOVO — Employee delete ruta** (soft delete, provjereno: `is_deleted` filteri svuda; brisanje kroz `Employees.tsx`).
9. ✅ **GOTOVO — Refresh token interceptor** (provjereno u `api.ts` 02.08.2026.: response interceptor hvata 401 → automatski poziva `/auth/refresh` → ponavlja originalni zahtjev; refresh token je u međuvremenu preseljen u httpOnly cookie sa rotacijom + family replay detekcijom). *(Originalna stavka:)* Trenutno: access token traje 60 minuta (`.env`, `ACCESS_TOKEN_EXPIRE_MINUTES=60`), refresh token postoji i radi (30 dana), ALI frontend (`api.ts`) trenutno NEMA automatski mehanizam koji bi, kad access token istekne, sam pozvao `/api/v1/auth/refresh` i ponovio zahtjev — korisnik trenutno dobija 401 grešku i mora se ponovo ulogovati svakih 60 minuta. Za vlasnika salona koji koristi app cijeli radni dan, ovo je loše iskustvo. Rješenje: axios response interceptor koji hvata 401, automatski pozove refresh, ponovi originalni zahtjev — sve nevidljivo za korisnika. Mali, ali bitan zadatak, treba ići uz ostatak liste.
10. ✅ **GOTOVO — projekat je na GitHub-u** (repo `brko88`, redovni commitovi po cjelinama). ⚠️ Poznata posljedica: stari `.env` sa secretima je jedno vrijeme bio u istoriji JAVNOG repoa — kredencijali opozvani/promijenjeni, istorija svjesno NIJE prepisivana (odluka vlasnika); NOVI `SECRET_KEY` obavezan na produkciji. *(Originalna stavka:)* Razlog: Claude trenutno nema pouzdan, ažuran pristup frontend kodu (samo se "sjeća" iz ranijih poruka u razgovoru, što može biti netačno/zastarjelo) — backend kod je djelimično dostupan jer je generisan kroz raniju sesiju, ali frontend nikad nije sačuvan na isti način. Postavljanje kompletnog projekta na privatan GitHub repo omogućava Claude-u da fetch-uje i provjerava STVARNO, TRENUTNO stanje cijelog koda, ne samo backend dio ili ono što se "sjeća". Koraci: (1) inicijalizovati git repo u `D:\SmartBooking Platform` ako još nije, (2) kreirati privatan repo na github.com, (3) `git push` kompletnog projekta (provjeriti da `.gitignore` isključuje `venv/`, `node_modules/`, `.env`, `*.db` — osjetljivi/nepotrebni fajlovi), (4) dati Claude-u link na repo kad treba provjera koda. Ovo postaje POSEBNO važno prije nego se počne sa stavkama 4-8 ove liste, da Claude radi sa tačnim, ažurnim kodom, ne zastarjelim sjećanjem.

**Van ove liste, ali otvoreno/u toku (status 02.08.2026.):**
- ⏳ Payment gateway — smjer je Paddle (MoR), ali integracija NIJE implementirana — vidi Dokument 19
- ⏳ **KRITIČNO, prije prve stvarne uplate: konsultacija sa knjigovođom u Banja Luci o poreskim obavezama** (status fizičko lice vs. preduzetnik s obzirom na redovnost prihoda, porez na dohodak, PDV tretman za MoR transakcije) — vidi Dokument 19, sekcija 3.3
- 🟡 Plan enforcement — MEHANIZAM naplatnog gate-a je izgrađen (~95%): read-only mode za neplaćene salone, trial period, beta-tester zaštita, globalni prekidač (trenutno OFF), admin Pretplate ekran. NISU implementirani per-plan limiti (broj zaposlenih po Solo/Start/Pro/Business paketu) — vidi sekciju 5.1a
- Cjenovnik po zaposlenom, OCR unos cjenovnika, "predloži sljedeći termin", usluge bez cijene — sve V2 ideje, vidi Dokument 18, sekcije 2.11-2.14

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

> ⚠️ **ZASTARJELI SNAPSHOT (26.06.2026.)** — stvarni broj endpointa je danas višestruko veći (public/self-booking modul, admin modul ~20 ruta, special-days, support, media upload, forgot/reset password, no-show...). Tabela ostavljena kao istorijski zapis; izvor istine je kod (`app/api/routes/`) i `/docs` OpenAPI.

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

> ✅ **AŽURIRANO 01.08.2026.: suite je popravljen i proširen — sada 50 testova, svi prolaze (`50 passed`).** Suite je mjesecima zaostajao za API ugovorima (40/46 padalo); popravljen 01.08.2026. i dodana 4 nova testa (slaba lozinka, terms obavezan, neispravan JIB, zaposleni bez emaila). Usput je suite uhvatio i pravi bug (obrnuto radno vrijeme se prihvatalo — popravljeno). Pokretanje: `venv\Scripts\python.exe -m pytest test_suite -q` sa hosta. Pravilo ubuduće: svaka promjena API ugovora ažurira testove U ISTOJ sesiji.

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

### 4.1 Funkcionalna ograničenja *(presjek 02.08.2026.)*
- ⏳ Appointments podržavaju samo **jednu uslugu po rezervaciji** (BR-033, namjerno MVP ograničenje) — i dalje tako
- ⏳ Nema podrške za **višestruke lokacije** po tenant-u u UI-ju — i dalje tako
- ✅ ~~Nema **pauza/blokiranih termina** za zaposlene~~ — RIJEŠENO: radno vrijeme ima pauzu (`break_start`/`break_end`), Specijalni dani (praznik/godišnji/izmijenjeno vrijeme, takođe sa pauzom) pokrivaju blokiranje termina; sa conflict-check + auto-otkazivanjem pogođenih rezervacija uz email
- ⏳ Nema **liste čekanja (waitlist)** — i dalje tako (V2)
- ✅ ~~Nema **edit/update rute** za Employees, Services, Customers~~ — RIJEŠENO: PUT/update rute + UI postoje za sva tri
- ✅ ~~**Nema DELETE rute za zaposlene**~~ — RIJEŠENO: soft delete implementiran (uključujući Services/Customers soft delete)
- ⏳ Appointments nemaju **PUT/update rutu** za izmjenu vremena (reschedule) — PROVJERENO 02.08.2026.: i dalje samo cancel/complete/no-show (+ automatski `expired` status kroz pozadinski posao — to je novo)
- ⏳ Kalendar prikazuje samo **dnevni** pregled — i dalje tako
- ✅ ~~**Admin panel NE POSTOJI**~~ — RIJEŠENO I ZNATNO PREMAŠENO: Dashboard (statistika + Platform Health + DB pool), Saloni (pretraga/filteri/verify/suspend/beta/interni), Korisnici (block/reset lozinke/interni tester), Verifikacije, Pretplate (naplatni prekidač), Statistika, Baneri, Audit log
- ✅ ~~**Nema mehanizma provjere legitimnosti salona**~~ — RIJEŠENO: JIB obavezan (13 cifara, unique u bazi, anti-trivijalna validacija) + verifikacioni statusi + admin akcije
- ✅ ~~**Nema responsive (mobilni) dizajna**~~ — RIJEŠENO (hamburger meniji, responsive tabele, testirano na mobilnoj rezoluciji)
- ✅ ~~**Nema PWA podrške**~~ — RIJEŠENO osnova (manifest, SW, update baner); ⏳ push notifikacije i ostatak PWA UX checkliste ostaju

### 4.2 Infrastrukturna ograničenja *(presjek 02.08.2026.)*
- ✅ **Docker implementiran** — uz kasnija poboljšanja: 4 uvicorn workera, DB pool 20+20/workeru + Postgres max_connections=200, pg_stat_statements, log rotation (50m×10), pool monitoring (periodični log + admin panel)
- ✅ ~~**Nema audit log servisa**~~ — RIJEŠENO za admin akcije: `admin_action_logs` tabela + Audit log ekran u admin panelu (ko/šta/nad kim/kada)
- ✅ ~~**Nema rate limiting-a**~~ — RIJEŠENO: auth rute (5-10/min), javne browse rute (120/min), self-booking (10/30s); ključ je user_id za ulogovane / IP za anonimne (CGNAT-otporno); svaki 429 se loguje. Poznata ograda: brojači su per-worker (efektivno do 4× limita) — precizno tek uz Redis, nije bloker
- ✅ ~~**Nema brute-force zaštite**~~ — RIJEŠENO: account lockout u bazi (10 pokušaja → 15 min zaključan, precizno kroz sve workere) + IP rate limit + izjednačeno vrijeme odgovora (timing ne otkriva postoji li nalog)
- ✅ ~~**Nema sigurnosnih HTTP headera**~~ — RIJEŠENO u `frontend/nginx.conf`: HSTS, CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy (+ Cache-Control politika 02.08.2026.)
- ✅ ~~**CORS ograničen na localhost**~~ — RIJEŠENO mehanizmom: čita se iz `FRONTEND_URL` env varijable (docker-compose passthrough popravljen); ⏳ samu produkcijsku vrijednost postaviti na dan deploya
- ⏳ **Development SECRET_KEY** — i dalje važi, pojačano: stari je bio i u javnoj git istoriji → novi nasumičan ključ OBAVEZAN na produkciji (stavka deploy checkliste)
- ⏳ Nema CI/CD pipeline-a — i dalje ručno (svjesno; test suite se pokreće lokalno)

### 4.3 Sigurnosna ograničenja koja zahtijevaju pažnju *(presjek 02.08.2026.)*
- ✅ ~~Email verifikacija ne blokira ništa~~ — RIJEŠENO PO DOKUMENTU 06 (gating PO AKCIJI, ne blanket login blok — svjesna odluka 11.07.2026.): self-booking zahtijeva verifikovan email; povezivanje pending Employee pozivnice sa nalogom dešava se TEK nakon verifikacije (zatvoren account-hijacking vektor)
- ⏳ Nema **2FA** — i dalje tako (nije planirano za betu)
- ✅ ~~Lozinke bez backend validacije~~ — RIJEŠENO 01.08.2026.: zajednički `validate_password` (min 8, max 72 bajta zbog bcrypt-a, ne samo razmaci) na registraciji + resetu + promjeni

---

## 5. Lista za provjeru prije prvog salona (PRE-LAUNCH CHECKLIST)

### 5.1 Infrastruktura (KRITIČNO) *(presjek 02.08.2026. — ovo je suština "dana deploya"; detaljna operativna lista sa razlozima je u Claude memoriji: deploy checklist)*
- [ ] Migracija sa lokalnog računara na VPS server (Hetzner/DigitalOcean, prema Dokumentu 08) — ⏳ uz DODATAK: uvicorn `--proxy-headers --forwarded-allow-ips` (bez toga rate limiter vidi proxy IP za sve = samo-DoS)
- [x] Docker + Docker Compose postavka — ✅ GOTOVO (uz napomenu: produkcijski compose mora prenijeti max_connections/pg_stat_statements/log-rotation postavke)
- [ ] Pravi domen registrovan i povezan (DNS) — ⏳ (pokrenuti SEDMICU ranije zbog propagacije)
- [ ] SSL certifikat (Let's Encrypt) — HTTPS obavezan — ⏳ (+ `COOKIE_SECURE` ostaje na default true)
- [ ] PostgreSQL backup strategija (dnevni automatski backup) — ⏳ **+ obavezna JEDNA stvarna proba restore-a**
- [ ] Ažuriranje CORS-a na produkcijski domen — ⏳ (sad je samo env varijabla `FRONTEND_URL`, mehanizam spreman)
- [ ] *(NOVO 02.08.2026.)* Transakcioni email servis (SES/Postmark/Resend) umjesto Gmail SMTP-a — ⏳ Gmail limit ~500/dan; domen verifikaciju (SPF/DKIM) pokrenuti sedmicu ranije

### 5.1a Plan Enforcement (NIJE KRITIČNO za beta, postaje bitno nakon naplate — odluka 28.06.2026.)

Dokument 13 definiše Solo/Start/Pro/Business pakete sa različitim limitima (broj zaposlenih, lokacija) i funkcionalnostima (email notifikacije, izvještaji, napredna pretraga — vidi Dokument 13, sekcija 6).

**AŽURIRANO 02.08.2026.:** OSNOVA naplatnog mehanizma je u međuvremenu izgrađena (~95%): read-only mode za salone bez aktivne pretplate/trial-a (`assert_tenant_writable` gate na svim write rutama), trial period (14 dana), beta-tester zaštita (bulk-flag postojećih pri prvom paljenju naplate), globalni prekidač enforcementa (trenutno **OFF**), admin Pretplate ekran. Šta i dalje NIJE implementirano:
- [ ] Provjera broja zaposlenih/lokacija u odnosu na limit paketa (blokirati dodavanje novog zaposlenog ako je limit dostignut)
- [ ] Provjera plana prije pristupa "premium" funkcijama (eksport, napredna pretraga, itd. — kad budu implementirane)
- [ ] Veza sa downgrade pravilima (Dokument 13, sekcija 9 — provjeriti limite prije dozvoljavanja downgrade-a)
- [ ] Sama Paddle integracija (checkout, webhook → `billing_status`)

### 5.2 Sigurnost (KRITIČNO) *(presjek 02.08.2026.)*
- [ ] Generisati novi, nasumičan `SECRET_KEY` za JWT — ⏳ NA DAN DEPLOYA (pojačan razlog: stari je bio u javnoj git istoriji)
- [x] Premjestiti `.env` van git repozitorija — ✅ `.gitignore` ga isključuje; istorijski leak poznat, kredencijali opozvani
- [x] Implementirati rate limiting — ✅ GOTOVO I ŠIRE od minimuma (auth + javne + self-booking; user/IP ključ; 429 logging)
- [x] Implementirati brute-force zaštitu — ✅ GOTOVO (account lockout 10/15min u bazi + IP limit + anti-timing)
- [x] Dodati sigurnosne HTTP headere — ✅ GOTOVO (nginx: HSTS/CSP/XFO/nosniff/referrer)
- [x] Odlučiti i implementirati email-verifikacija gating — ✅ ODLUČENO I IMPLEMENTIRANO (po akciji: self-booking + employee-invite linkovanje traže verifikaciju; login se ne blokira — svjesna odluka 11.07.2026.)
- [x] *(NOVO — urađeno mimo originalne liste)* JWT bez `exp` claima se odbija; lozinka min 8/max 72 bajta na sva 3 mjesta; token hashing (verifikacija/reset); refresh cookie httpOnly + rotacija + family replay detekcija; IDOR/RBAC popravke; upload streaming limit; validacija cijene/trajanja usluge — sve testirano

### 5.2a Pravni dokumenti (KRITIČNO — odluka donesena 26.06.2026.)

Potreban je sljedeći set dokumenata prije puštanja u produkciju *(presjek 02.08.2026.)*:
- [x] **Pricing** — ✅ planovi javno izloženi (`/public/plans` + prikaz na landing stranici)
- [x] **Terms of Service** — ✅ stranica postoji (`/uslovi-koristenja`), registracija traži eksplicitno prihvatanje (checkbox + `terms_accepted_at` u bazi); ⚠️ pregled lokalnog advokata i dalje preporučen PRIJE naplate
- [x] **Privacy Policy** — ✅ stranica postoji (`/politika-privatnosti`); ⚠️ ista advokat ograda
- [ ] **Refund Policy** — ⏳ nema; postaje bitno tek uz naplatu (Paddle kao MoR nosi dio ovoga)
- [ ] **Cookie Policy** — ⏳ nema (jedini kolačić je auth refresh_token — "strictly necessary" — pa je izloženost mala)
- [ ] **Acceptable Use Policy** — ⏳ nema

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

**STATUS OSNOVE (29.06.2026.): GOTOVO I TESTIRANO.** Koraci 1-7 implementirani i potvrđeni kroz stvaran test (kreiranje tenant-a sa JIB-om, verify, suspend, reactivate akcije). **PROVJERENO PONOVO 02.08.2026.: koraci 8-9 (manuelno admin kreiranje tenant-a bez JIB validacije, generalna admin edit ruta za Tenant polja) i DALJE OSTAJU neimplementirani** — nisko prioritetno (rub-slučajevi), nije bloker za betu.

### 5.2c Proširene Admin Panel funkcije (zapisano 29.06.2026., razmišljanje tokom pauze)

Dopuna na osnovu Dokumenta 01, sekcija 3.1 (Super Administrator ovlaštenja) i novih ideja vlasnika. Status "GOTOVO" odnosi se na već implementiranu osnovu (29.06.2026), ostalo je TODO za buduće sesije.

**Iz Dokumenta 01, sekcija 3.1 (presjek 02.08.2026.):**
- [x] Pregled svih poslovnih subjekata — GOTOVO
- [x] Upravljanje korisnicima — ✅ GOTOVO (Korisnici stranica: lista, blokiranje/odblokiranje, admin reset lozinke, interni-tester flag)
- [x] Upravljanje pretplatama — ✅ OSNOVA GOTOVA (Pretplate ekran: globalni naplatni prekidač, beta-tester zaštita, trial reset; sama Paddle integracija ostaje)
- [x] Pregled statistike — ✅ GOTOVO (Dashboard agregati + Statistika stranica + Platform Health sa DB pool prikazom)
- [x] Blokiranje naloga — ✅ GOTOVO za OBA (Tenant suspend + User block/unblock)
- [ ] Upravljanje sistemskim postavkama — ⏳ i dalje nejasno definisano, van obima (dio pokriven: Baneri/najave, naplatni prekidač)

**Nove ideje vlasnika (29.06.2026.) — presjek 02.08.2026.:**
- [x] **Pretraga tenant-a** — ✅ GOTOVO (pretraga po nazivu, JIB-u, gradu, emailu i vlasniku na Saloni stranici)
- [x] **Pretraga po email-u → koji tenant** — ✅ pokriveno kroz istu pretragu (email/vlasnik su uključeni u tenant search)
- [x] **Reset lozinke korisniku (admin-initiated)** — ✅ GOTOVO (`POST /admin/users/{id}/reset-password`, šalje reset link kroz isti opšti Forgot Password mehanizam, u pozadini kao background task; akcija se bilježi u audit log)

**Dodatne ideje (presjek 02.08.2026.):**
- [x] Brza statistika po tenant-u — ✅ GOTOVO ("Detalji" dugme → tenant health pregled: vlasnik, zaposleni, usluge, radno vrijeme)
- [x] Filter po statusu — ✅ GOTOVO (Sve / Na čekanju / Verifikovano / Suspendovano dugmad na Saloni stranici)
- [x] Audit log pregled — ✅ GOTOVO (`admin_action_logs` + Audit log stranica; puni se od nastanka tabele)
- [ ] Brisanje User naloga (GDPR "right to be forgotten") — ⏳ i dalje otvoreno, relevantno tek za EU fazu

**Status: Lista zapisana za buduće sesije. Redoslijed prioriteta nije fiksiran — odlučiti kad se dođe do implementacije, na osnovu toga šta se pokaže kao stvarno potrebno u praksi (npr. ako bude support upita "ko je registrovan na ovom mailu", to ide prvo).**

### 5.3 Funkcionalna provjera (manuelno testiranje punog toka) *(presjek 02.08.2026.: sve dole je VIŠE PUTA provjereno na dev okruženju — kroz audite 19.07. i ručna testiranja — ali stavke po definiciji traže ponavljanje NA PRODUKCIJI na dan deploya, pa ostaju neoznačene)*
- [ ] Registracija → email stiže → verifikacija → login (na produkcijskom serveru) — *dev ✅*
- [ ] Kreiranje tenant-a → zaposleni → radno vrijeme → usluga → klijent → rezervacija → kalendar — *dev ✅ (uklj. automatski vlasnik-kao-zaposleni od 01.08.)*
- [ ] Self-booking Mod A (privatno) — *dev ✅*
- [ ] Self-booking Mod B (javno, oba kanala istovremeno) — *dev ✅*
- [ ] Email za potvrdu rezervacije — ✅ ODLUČENO I IMPLEMENTIRANO (email pri otkazivanju/auto-otkazivanju; svi emailovi kao background taskovi sa SMTP timeout-om) — na produkciji provjeriti isporuku kroz novi email servis
- [ ] Test na stvarnom mobilnom telefonu — *dev responsive ✅ na emuliranoj rezoluciji; pravi telefon na produkciji ostaje*
- [ ] Test u različitim browserima (Chrome, Safari, Firefox) — ⏳

### 5.4 Operativna spremnost *(presjek 02.08.2026.)*
- [ ] Pokrenuti kompletan test suite na produkcijskoj kopiji koda prije deploya — ⏳ (suite je zelen: 50/50 na dev-u, 01.08.2026.)
- [x] Plan podrške za prve korisnike — ✅ OSNOVA POSTOJI: "Prijavi problem" u aplikaciji (email + WhatsApp + screenshot upload kroz support modul)
- [ ] Jednostavno uputstvo za vlasnika salona — ⏳
- [x] Model pristupa za prve korisnike — ✅ ODLUČENO I IMPLEMENTIRANO: besplatna beta (jasno komunicirano na registraciji), beta-tester zaštita pri budućem paljenju naplate, interni test salon mehanizam za testiranje na produkciji
- [x] Kanal za feedback — ✅ (isti support modul: email boris.kalamanda@gmail.com + WhatsApp)

### 5.5 Monitoring (minimum za prvi launch) *(presjek 02.08.2026.)*
- [ ] Osnovni uptime monitoring (spoljni servis koji pinga) — ⏳ na dan deploya (jeftino: UptimeRobot i sl.)
- [x] Serverski logovi bilježe greške vidljivo — ✅ I VIŠE OD TOGA: Docker log rotation (50m×10), periodični DB pool log po workeru (INFO trend + WARNING na 75%), logovanje svakog 429 i svakog pool-timeout 503, audit log admin akcija, `/admin/health` sa pool prikazom

---

## 6. Zaključak

**AŽURIRANO 02.08.2026. (v0.9.0-beta.6):** Kodna strana je spremna za betu — Faza D (sigurnosno/performansno poliranje) je praktično kompletna: svi nalazi iz četiri audita (funkcionalni, sigurnosni, performance, stress — juli 2026.) su riješeni ili svjesno prihvaćeni, test suite je zelen (50/50), sistem izmjereno podnosi 150+ istovremenih korisnika sa mekom degradacijom (503 + Retry-After) iznad toga.

**Šta stoji između trenutnog stanja i prvog stvarnog salona (sažetak ⏳ stavki):**
1. Dan deploya — sekcija 5.1 + 5.2 SECRET_KEY (detaljna operativna lista: Claude memorija, deploy checklist)
2. Transakcioni email servis (Gmail ne skalira)
3. Produkcijski smoke test (sekcija 5.3 na pravom serveru + pravi telefon + browseri)
4. Uputstvo za vlasnika salona + uptime monitoring (sitno)

**Za naplatu (kasnije, ne blokira betu):** Paddle integracija, per-plan limiti, knjigovođa, Refund/Cookie/AUP dokumenti + advokatski pregled ToS/Privacy.

Nijedna stavka iz sekcije 5.1 i 5.2 ("KRITIČNO") ne treba biti preskočena prije nego prvi salon počne da koristi platformu.

---

*Dokument generisan 26.06.2026.; veliki presjek statusa 02.08.2026. (provjereno protiv stvarnog koda) — SmartBooking Platform.*
