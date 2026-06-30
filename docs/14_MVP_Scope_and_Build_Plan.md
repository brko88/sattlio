# SmartBooking Platform — MVP Scope & Build Plan

**Dokument:** 14 — Pratni dokument uz Blueprint 1.0
**Verzija:** 1.0
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Originalni Blueprint (dokumenti 00–13) opisuje SmartBooking platformu u njenom punom, petogodišnjem obliku: multi-tenant SaaS sistem sa marketplace-om, mobilnim aplikacijama, naplatom, AI funkcijama i međunarodnom ekspanzijom. Ta vizija ostaje važeća i nepromijenjena — svi ti dokumenti se čuvaju kao referenca za pravac u kojem platforma ide.

Ovaj dokument ima drugu, užu svrhu: da definiše šta se tačno gradi u PRVOJ radnoj verziji sistema, koju gradi jedna osoba (Brko) uz Claude-a kao pisača koda, korak po korak.

> **Pravilo koje ovaj dokument primjenjuje:** baza podataka i struktura podataka se projektuju široko, prema punoj viziji iz Blueprint-a, da se kasnije ne mora raditi bolna migracija. Ali KOD i SERVISI koji se pišu danas ostaju uski i jednostavni, i rastu postepeno kroz mjesece i godine.

---

## 2. Princip razdvajanja: ŠEMA vs. KOD

### 2.1 Šema baze podataka — gradi se široko, odmah

Sve tabele, kolone i relacije iz Dokumenta 03 (Database Design) ostaju u potpunosti važeće i preporučene za odmah implementirati, jer je mijenjanje strukture baze nakon što postoje stvarni podaci mnogo teže od pisanja koda koji tu strukturu još ne koristi u potpunosti.

- tenant_id na svakoj poslovnoj tabeli — implementirati odmah
- UserTenantRole model (umjesto role direktno na User) — implementirati odmah
- location_id na appointments i employees — implementirati odmah, čak i kad MVP koristi samo jednu lokaciju
- created_by_user_id odvojen od customer_id na appointments — implementirati odmah
- soft-delete kolone (is_deleted, deleted_at) na employees, customers, services — implementirati odmah
- audit_logs tabela — kolone se mogu definisati odmah, ali se servis koji u nju upisuje ne mora pisati za MVP (vidi sekciju 4)

### 2.2 Kod i servisi — gradi se usko, postepeno

Sljedeće stavke iz Blueprint-a su servisi, infrastruktura ili funkcionalnosti koje se LAKO dodaju kasnije bez izmjene baze podataka. Zato se ne pišu u prvoj verziji, bez obzira što ih dokumenti 02, 05, 06 i 08 spominju kao dio MVP-a.

- Redis i Celery (background poslovi) — dodaju se kad email/notifikacije postanu spori ili kad treba zakazivanje podsjetnika
- Docker i Docker Compose — dodaju se kad se prelazi na deljeni server ili produkciju, ne za lokalni razvoj
- CI/CD pipeline (GitHub Actions) — dodaje se kad postoji dovoljno učestalih izmjena da automatizacija isplati vrijeme pisanja
- Audit log servis (upisivanje događaja) — dodaje se nakon što core rezervacijska logika radi stabilno
- Rate limiting, brute-force zaštita — dodaju se prije javnog launch-a, ne prije prvog internog testiranja
- i18n translation engine u kodu — dodaje se kad postoji potreba za drugim jezikom; tekstovi se mogu pisati direktno u MVP-u
- Monitoring (Prometheus, Grafana, Sentry) — dodaje se kad postoje stvarni korisnici čiji rad treba pratiti

---

## 3. MVP v0.1 — Apsolutni minimum (lokalni razvoj)

Ovo je prva verzija koja se gradi. Cilj: jedan vlasnik (owner) može da se registruje, kreira svoj salon, doda zaposlenog, doda uslugu, i napravi rezervaciju koja poštuje pravila preklapanja. Sve lokalno, bez interneta, bez servera.

### 3.1 Tehnički okvir v0.1

- Python 3.12, FastAPI
- SQLite (fajl na disku, nema instalacije servera)
- SQLAlchemy (async nije neophodan na ovom nivou — može sinhrono)
- Pydantic v2 za validaciju
- JWT autentifikacija (python-jose ili pyjwt) + bcrypt/passlib za lozinke
- Bez Dockera. Pokreće se direktno: `uvicorn app.main:app --reload`
- Email verifikacija: simulirana (token se ispisuje u konzoli ili API odgovoru, ne šalje se stvaran email)

### 3.2 Funkcionalni obim v0.1

| Funkcionalnost | Iz dokumenta | Status |
|---|---|---|
| Registracija + login (JWT) | Dok. 05, 06 | **SADA** |
| UserTenantRole model | Dok. 02, 03, 05 | **SADA** |
| Kreiranje tenant-a (salona) | Dok. 01, 04 | **SADA** |
| CRUD zaposlenih (employees) | Dok. 01, 04 | **SADA** |
| CRUD usluga (services) | Dok. 01, 04 | **SADA** |
| Radno vrijeme zaposlenog (working_hours) | Dok. 03 | **SADA** |
| Kreiranje rezervacije + provjera preklapanja | Dok. 02, 10 (BR-020) | **SADA** |
| Otkazivanje / završavanje rezervacije | Dok. 10 (BR-040–045) | **SADA** |
| Tenant izolacija (WHERE tenant_id = ...) | Dok. 06, 10 (BR-080–082) | **SADA** |
| Email verifikacija (stvarni email, SMTP) | Dok. 04, 06 | KASNIJE |
| Refresh token rotacija sa bazom | Dok. 06 | KASNIJE |
| Multi-lokacijski prikaz (UI za izbor lokacije) | Dok. 02, 07 | KASNIJE |
| Audit log (upisivanje događaja) | Dok. 03, 06, 10 | KASNIJE |
| Rate limiting | Dok. 04, 06 | KASNIJE |
| Frontend (React) | Dok. 07 | KASNIJE — v0.1 je API-only, testira se kroz Swagger UI |

> **Status (23.06.2026.):** Svi redovi označeni "SADA" su implementirani i testirani — vidi `16_Phase_A_Completion_Report.md`.

---

## 4. Put rasta — od v0.1 do punog Blueprint-a

Sljedeća tabela pokazuje kako se MVP postepeno širi prema punoj viziji iz originalnih dokumenata. Redoslijed prati zavisnosti (npr. ne može se testirati booking dok ne postoje employees i services).

### 4.1 Faza A — Core rezervacijski sistem (v0.1 → v0.4)

Cilj: kompletan, ispravan booking flow, lokalno, bez interneta.

- v0.1 — Auth + Tenant + Employee CRUD
- v0.2 — Services CRUD + Working Hours
- v0.3 — Customers CRUD
- v0.4 — Appointments + overlap prevencija (najteži dio — BR-020 do BR-045)

✅ **Status: KOMPLETNO** (vidi Dokument 16)

### 4.2 Faza B — Prelazak na produkcijski oblik (v0.5 → v0.7)

Cilj: isti sistem, ali sa PostgreSQL umjesto SQLite, async SQLAlchemy, i pripremljen za pravi server.

- v0.5 — Migracija SQLite → PostgreSQL, Alembic migracije
- v0.6 — Pravi email servis (SMTP) za verifikaciju i potvrde rezervacija
- v0.7 — Refresh token rotacija sa čuvanjem u bazi (Dok. 06, sekcija 5)

### 4.3 Faza C — Frontend (v0.8 → v1.0)

Cilj: web aplikacija sa kojom owner stvarno radi, ne samo Swagger UI.

- v0.8 — React skeleton, login/register stranice, routing
- v0.9 — Dashboard, employees/services/customers stranice
- v1.0 — Kalendar (day/week/month prikaz), kreiranje rezervacije iz UI-a

### 4.4 Faza C.5 — Automatizovani Test Suite (dodano nakon sesije od 26.06.2026.)

Nakon dovršetka Faze C (frontend), prije ulaska u Fazu D (Docker, deployment), uvodi se **automatizovani test suite** (pytest), prema Dokumentu 11 (Testing Strategy, sekcija 14 — coverage poslovne logike).

**Razlog uvođenja baš sada:** Tokom razvoja Faze C, ručno testiranje je otkrilo nekoliko ozbiljnih bugova koje obično ručno testiranje ne hvata lako:
- Race condition u booking engine-u (dva istovremena zahtjeva mogla kreirati duplikat rezervacije za isti termin)
- Working Hours duplikati (nedostatak "update ako postoji" logike)

**Šta test suite pokriva:**
- Auth (registracija, login, duplikat email, pogrešna lozinka, email verifikacija, refresh token rotacija)
- Tenant kreiranje i slug generisanje
- Employees/Services/Customers CRUD i validacija
- Working Hours (dodavanje, ažuriranje, brisanje, sprečavanje duplikata)
- Appointments (overlap provjera, working hours provjera, status tranzicije)
- **Race condition test** — automatizovana verzija Promise.all testa koji je otkrio bug
- Tenant izolacija (Dokument 11, sekcija 8 — "KRITIČNO")

**Vrijednost:** Regresija se hvata automatski prilikom budućih izmjena (npr. Docker migracija, V2 funkcionalnosti iz Dokumenta 18), brže od ručnog testiranja, i služi kao implicitna dokumentacija ponašanja sistema.

### 4.5 Faza D — Spremnost za prve korisnike (v1.1 → v1.3)

**KONKRETAN REDOSLIJED ZA SLJEDEĆU SESIJU (ažurirano 26.06.2026. nakon razjašnjenja obima) — pratiti ovim tačnim redom, zbog zavisnosti:**

1. **JIB verifikacija + Admin panel** (Release Checklist, sekcija 5.2b) — ide prvo i zajedno, jer Admin panel bez JIB-a nema svrhu, JIB bez Admin panela se ne pregleda. Sigurnosni propust, prioritet.
2. **Employee edit ruta/UI** (osnovni preduslov, trenutno postoji samo Create+List) — može ići paralelno sa #1
3. **Self-booking sistem (Dokument 18, sekcija 2.7) — finalno razjašnjeno, manji obim nego prethodno procijenjeno.** Mora biti potpuno funkcionalno PRIJE javnog launch-a. Mehanizam: Mod A (privatno, default) = samo owner/employee unose termin. Mod B (javno) = I owner/employee I klijent (kroz svoj postojeći nalog/customer rolu) mogu unijeti termin, obje opcije istovremeno aktivne. NE treba novi "javni URL bez logovanja" — proširuje se postojeća autorizacija na `appointments` ruti da `customer` rola može kreirati appointment SAMO za sebe i SAMO kod zaposlenog sa `allow_self_booking = True`. Zahtijeva: Employee edit UI (zavisi od #2) + izmjena autorizacione logike u appointments ruti + jednostavniji customer-facing UI prikaz.
4. **Responsive dizajn + PWA** (v1.1a/v1.1b ispod) — nezavisno od 1-3, može ići paralelno
5. **"Moji termini" lista (Dokument 18, sekcija 2.10) — DODANO 28.06.2026.** Jednostavna, hronološka lista SVIH termina korisnika kroz različite salone (NE kalendar, samo tabela slična postojećoj Appointments listi). Manji posao od self-booking sistema — može ići nezavisno, čak i prije njega. Zahtijeva: `GET /api/v1/appointments/my` rutu (postoji u Dokumentu 04 kao planirana, nikad implementirana) + `user_id` nullable kolonu na `Customer` modelu (mala migracija) + jednostavna frontend stranica.

Cilj: sistem koji je siguran i stabilan da ga koristi nepoznata osoba (prvi salon koji nije ti).

- v1.1 — Docker + Docker Compose, deployment na jedan VPS server ✅ ZAVRŠENO 26.06.2026.
- v1.2 — Audit log servis (Dok. 03, 06, 10)
- v1.3 — Rate limiting, brute-force zaštita, security headeri (Dok. 06, sekcija 15–16)
- **v1.1a — Responsive (mobilni) prikaz** — sidebar/layout/kalendar/tabele trenutno su dizajnirani desktop-first (suprotno Dokumentu 09, sekcija 14, "Mobile First pravilo"). Treba: hamburger meni za sidebar na malim ekranima, kalendar koji se drugačije prikazuje na mobilnom, tabele koje se prilagode širini ekrana. **Provjereno (26.06.2026): trenutni izgled NIJE testiran na malom ekranu i vjerovatno ne radi dobro (fiksni sidebar od 240px, kalendar rešetka sa horizontalnim skrolom). DODATO 28.06.2026: koristiti EKSPLICITNE breakpoint-e iz Dokumenta 24 (Brand Identity), sekcija 13 — Desktop ≥1280px, Tablet 768-1279px, Mobile ≤767px, "sidebar prelazi u hamburger meni" — ne izmišljati nove vrijednosti.**
  - **Konkretna UI specifikacija — Kalendar na mobilnom (zahtjev vlasnika, 26.06.2026.):** Kalendar prikaz na telefonu mora biti "peek cijelog ekrana" — koristiti maksimalnu moguću visinu/širinu ekrana (full-screen ili gotovo full-screen), ne uklopljen u isti layout kao desktop sa sidebar-om koji oduzima prostor. Dugmad za unos/izbor termina moraju biti jednostavna, velika, lako dostupna na touch ekranu (ne mali desktop-stil dugmići).
  - **Konkretna UI specifikacija — Format vremena (zahtjev vlasnika, 26.06.2026.):** Vrijeme se prikazuje u 24-časovnom formatu sa "h" oznakom, npr. "13:00h" — NE 12-časovni AM/PM format (npr. "1:00 PM"). Ovo se odnosi na prikaz vremena kroz CIJELU aplikaciju (kalendar, lista rezervacija, working hours), ne samo mobilni prikaz — provjeriti i ispraviti svuda gdje se vrijeme prikazuje korisniku.
  - **Konkretna UI specifikacija — Pretrpan raspored (pitanje vlasnika, 26.06.2026., rješenje dogovoreno):** Kad zaposleni ima puno termina u jednom danu (npr. 15+ kratkih usluga od 15-30 min), trenutna implementacija (proporcionalno pozicioniranje prema stvarnom trajanju, `Math.max(height, 20px)` minimalna visina) postaje teško čitljiva, posebno na malom ekranu. Dogovoreno rješenje za implementaciju (MVP nivo, dovoljno za sada — ne treba odmah napredniji "zoom"/"+N sažimanje" mehanizam):
    1. **Minimalna čitljiva visina po terminu** (npr. 40px, ne strogo proporcionalna stvarnom trajanju) — termin postaje kompaktna pločica sa SKRAĆENIM imenom klijenta (npr. "Marko P." umjesto "Marko Petrović"), puna informacija dostupna klikom (postojeći modal za detalje, već implementiran, ostaje isti mehanizam)
    2. **Na malom ekranu (telefon): prikazati SAMO JEDNOG zaposlenog odjednom** (dropdown/tab birač na vrhu kalendara), NE sve kolone paralelno sa horizontalnim skrolom kao na desktopu — korisnik bira zaposlenog, vidi njegov raspored full-screen, vertikalno skrolovano. Ovo drastično smanjuje gustinu prikaza po ekranu u kombinaciji sa stavkom 1.
  - **Konkretna UI specifikacija — Vizuelni standard po uzoru na Google Calendar (referenca priložena 28.06.2026.):** Vlasnik je priložio screenshot Google Calendar dnevnog prikaza (mobilni) kao referentni standard. Elementi vrijedni kopiranja u naš kalendar:
    1. **Linija trenutnog vremena** — horizontalna linija (sa tačkom na lijevoj strani) koja pokazuje TRENUTNI trenutak u danu, pomjera se kroz dan. Trenutno NEMAMO ovaj element — vrijedno dodati, jednostavna CSS/JS implementacija (računa se pozicija iz `new Date()`, isti princip kao postojeće pozicioniranje termina).
    2. **Minimalistički prikaz termina** — Google Calendar prikazuje SAMO tekst u kućici (naziv događaja), bez dodatnih ikonica/badge-ova — potvrđuje raniju odluku (sekcija 2.8 u Dokumentu 18) da se NE dodaju vizuelni elementi koji bi zauzeli prostor u kućici.
    3. **Fiksno "+" dugme za brzo kreiranje** — okruglo dugme fiksirano u donjem desnom uglu ekrana (floating action button), uvijek vidljivo bez obzira na scroll pozicije. Na mobilnom, ovo bi trebalo zamijeniti trenutni pristup (forma "Nova rezervacija" na vrhu stranice, koja na malom ekranu nepotrebno guta prostor) — klik na "+" otvara formu/modal za kreiranje, ne stalno prikazanu formu.
    4. **Čiste, vidljive linije razdvajanja sati, prazan prostor je vizuelno "tih"** — lako se skenira pogledom koji je termin slobodan, bez vizuelnog šuma.
- **v1.1b — PWA (Progressive Web App) podrška + Push notifikacije** — DOGOVORENO (26.06.2026, ažurirano 28.06.2026): kad se radi responsive sesija (v1.1a), u istoj sesiji dodati `manifest.json` i service worker, da frontend postane instalabilan na telefon ("Add to Home Screen") sa sopstvenom ikonicom, fullscreen prikaz bez browser adresne trake. **ISPRAVKA (28.06.2026.): ranije zapisano da push notifikacija "čeka native Android/iOS app" — ovo je bilo previše konzervativno.** Provjereno (28.06.2026): PWA push notifikacije RADE i na Android (puna podrška, zrelo) i na iOS 16.4+ (podržano, ali korisnik MORA prvo instalirati PWA na Home Screen kroz Safari — push ne radi iz otvorenog browser taba). Pošto se PWA "Add to Home Screen" already planira u ovoj istoj sesiji, push notifikacija se PRIRODNO uklapa kao dodatak na isti service worker rad — NE treba čekati native app. Realna procjena: pola dana do jedan dan dodatnog rada (VAPID ključevi, nova tabela za "subscription" podatke, backend slanje preko Push API-ja, iOS-specifična provjera instalacije) — isti modularni pattern kao postojeći email sistem (vidi Dokument 18, sekcija 2.16). **PODSJETNIK: korisnik je eksplicitno tražio da se ovo ne zaboravi kad krene responsive sesija — uvijek napomenuti na početku te sesije.**
- **v1.1c — Prijava problema (bug report) — DOGOVORENO 28.06.2026., SPREMNO ZA IMPLEMENTACIJU.** Dva dugmeta u sidebar-u, iznad "Odjavi se": "Prijavi problem (Email)" — `mailto:` link sa predefinisanim subjektom, i "Prijavi problem (WhatsApp)" — `wa.me/` deep-link. Kod je već pripremljen (vidi transkript sesije od 28.06.2026.) — samo treba: (1) zamijeniti placeholder email sa vlasnikovim stvarnim email-om, (2) zamijeniti placeholder broj sa stvarnim WhatsApp brojem u internacionalnom formatu bez "+" i razmaka, (3) zalijepiti kod u `Layout.tsx`. Brz zadatak (par minuta), ne treba posebnu sesiju — može se odraditi na početku sljedeće sesije prije ostalog posla. Razlog prioriteta: kritično da postoji kanal za prijavu problema PRIJE nego prvi salon (van vlasnika) počne koristiti platformu.

### 4.6 Faza E — Ono što originalni Roadmap (Dok. 12) zove V1, V2, V3...

**v1.0a — Anketa o spremnosti na plaćanje ("willingness to pay survey")** — DOGOVORENO (26.06.2026): kad se nakupi ~20-30 besplatnih salona (prije nego se otvori SP/payment gateway), implementirati malu anketu koja se prikazuje na login-u (modal, sličan pattern kao Appointment detail modal iz kalendara) — pitanje tipa "Da li biste platili [X] KM/mjesečno za ovu platformu?" sa par opcija odgovora. Cilj: dobiti stvaran signal o spremnosti na plaćanje PRIJE nego se uloži u registraciju SP-a i payment gateway aktivaciju (vidi Dokument 17, akvizicijska strategija). Tehnički jednostavno — jedna nova tabela/polje + jedan modal komponent, ne zahtijeva novu infrastrukturu. **Status: IZVODLJIVO, spremno za implementaciju kad dođe vrijeme (prije beta faze sa platnim korisnicima).**

Od ove tačke, dalji rast prati originalni Dokument 12 — Product Roadmap — bez izmjena:

- V1: napredna pretraga, eksport podataka, napredni dashboard
- V2: SaaS naplata (Stripe/PayPal), pretplate, trial period (Dok. 13)
- V3: Android i iOS aplikacije
- V4: Marketplace (javni profili, pretraga, online rezervacije bez poziva). **SEO strategija (Dokument 23) je vezana uz ovu fazu** — meta tagovi, server-side rendering za javne profile salona, sitemap, treba ići ZAJEDNO sa implementacijom Marketplace-a, ne prije (nema javnog sadržaja za indeksiranje prije ove faze).
- V5–V9: marketing alati, više poslovnica, analitika, AI, integracije — sve kako je opisano u Dok. 12

> Redis, Celery, CI/CD i monitoring se uvode negdje u ovom dijelu puta — onda kada stvarna potreba (broj korisnika, broj email-ova, broj deploy-eva) to opravda, a ne unaprijed.

---

## 5. Kriterijum "gotovo" za v0.1–v0.4 (Faza A)

Faza A se smatra završenom kada, pokrenuto lokalno kroz Swagger UI, sledeće radi od početka do kraja, bez greške:

- Vlasnik se registruje i prijavljuje (JWT token)
- Vlasnik kreira svoj poslovni subjekt (tenant)
- Vlasnik dodaje zaposlenog i definiše njegovo radno vrijeme
- Vlasnik dodaje uslugu sa trajanjem i cijenom
- Vlasnik dodaje klijenta
- Vlasnik kreira rezervaciju koja poštuje radno vrijeme i ne preklapa se sa postojećom
- Pokušaj kreiranja rezervacije koja se preklapa biva odbijen sa jasnom porukom greške
- Vlasnik može otkazati ili završiti rezervaciju, status se ispravno mijenja (Dok. 10, sekcija 8)

✅ **Svih 8 stavki potvrđeno radi — vidi Dokument 16, Phase A Completion Report.**

---

## 6. Zaključak

Ovaj dokument ne mijenja niti jednu odluku iz Blueprint-a 1.0 — vizija, baza, API ugovor i poslovna pravila ostaju isti. On samo dodaje vremensku dimenziju: redoslijed kojim se taj Blueprint pretvara u stvarni, radni kod, prilagođen tempu jedne osobe koja uči programiranje uz Claude-a.

Svaki put kad se otvori novo poglavlje razvoja, prva provjera treba biti: da li je ova funkcionalnost u Fazi A, B, C, D ili E ovog dokumenta — i ne preskakati faze.

---

*Kraj dokumenta.*
