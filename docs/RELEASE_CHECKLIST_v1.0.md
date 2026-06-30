# SmartBooking Platform — Release Checklist v1.0

**Datum:** 26.06.2026. (ažurirano 28.06.2026.)
**Status:** Faza A + Faza B + Faza C + Faza C.5 (Test Suite) + Docker — KOMPLETNE
**Sljedeća faza:** Faza D nastavak — vidi konkretnu listu ispod

---

## 0. SLJEDEĆA SESIJA — konkretna, dogovorena lista (ažurirano 28.06.2026.)

Redoslijed važan zbog zavisnosti između stavki. Detalji i tehničke skice za svaku stavku su u referenciranim dokumentima.

1. ✅ **GOTOVO (29.06.2026.) Prijava problema (bug report).** Dva dugmeta u sidebar-u (Email: boris.kalamanda@gmail.com, WhatsApp: +387 65 497 119), implementirano i testirano — oba linka rade ispravno.
2. ✅ **GOTOVO (29.06.2026.) JIB verifikacija + Admin panel (osnova)** — implementirano i testirano: `jib`/`verification_status` polja, validacija, `is_superadmin` polje, `require_superadmin` zaštita, Admin panel rute (lista/verify/suspend/reactivate), frontend stranica. Vidi sekciju 5.2b i 5.2c za dalje proširenje.
3. **Forgot Password flow (NOVO, dodato 29.06.2026.) — PRIORITET, ide prije Employee edit.** Otkriveno tokom razmišljanja o Admin reset lozinke (sekcija 5.2c) — "Forgot Password" mehanizam TRENUTNO NE POSTOJI NIGDJE u sistemu, ni za obične korisnike. Vlasnik je odlučio: implementirati JEDAN, opšti mehanizam (ne odvojeno za admina i za korisnike) — korisnik sam pokreće reset (klikom na "Zaboravljena lozinka" na Login stranici), I admin može pokrenuti isti mehanizam za korisnika kroz Admin panel (support slučaj). Tehnička skica: token-based reset (slično postojećem email verification tokenu), email sa linkom koji vodi na "Postavi novu lozinku" stranicu, token ističe nakon određenog vremena (npr. 1h). Koristi postojeći Gmail SMTP sistem.
4. **Employee edit ruta/UI** — preduslov za stavku 5, može paralelno sa #2-3.
5. **Self-booking sistem (privatno/javno po zaposlenom) — POTVRĐENO KAO BLOKIRAJUĆI PREDUSLOV PRIJE LIVE TESTA (29.06.2026.).** Vlasnik je eksplicitno potvrdio (29.06.2026.) da ovo MORA biti implementirano prije nego prvi salon (van vlasnika) počne koristiti platformu "live" — nije "nice to have" dodatak za kasnije, već temeljni dio toga kako owner bira da vodi svoje poslovanje. Finalna, potvrđena definicija:
   - **Mod A — "Privatno" (`allow_self_booking = False`, default):** SAMO owner/employee može upisati termin u kalendar. Klijent nema nikakav pristup kreiranju rezervacije, bez obzira da li ima nalog na platformi.
   - **Mod B — "Javno" (`allow_self_booking = True`):** I owner/employee I klijent (koji ima nalog na platformi) mogu upisati termin. Ovo NIJE zamjena jedne opcije drugom — obje opcije su dostupne ISTOVREMENO. Owner/employee i dalje može ručno unijeti rezervaciju (npr. nakon telefonskog poziva), ALI klijent sada DODATNO ima mogućnost da sam, kroz svoj nalog, rezerviše termin direktno, bez posredovanja owner-a/employee-a.
   - Vidi Dokument 18, sekcija 2.7 za kompletnu tehničku skicu (manji obim posla nego prvobitno procijenjeno — proširenje postojeće autorizacije na `appointments` ruti, NE treba nov "javni URL bez logovanja" sistem, jer klijent već ima nalog kroz postojeći login sistem). Vidi Dokument 14 za pozicioniranje u redoslijedu.
6. **Responsive dizajn + PWA + Push notifikacije** — nezavisno od 2-5, može paralelno. Pet konkretnih UI specifikacija već zapisano (full-screen kalendar, 24h format vremena, rješenje za pretrpan raspored, PWA, Google Calendar vizuelni standard). **DODATO 28.06.2026.: Push notifikacije RADE kroz PWA (Android puna podrška, iOS 16.4+ uz instalaciju na Home Screen) — implementirati U ISTOJ sesiji kao PWA "Add to Home Screen", ne čekati native app. Realno pola dana do jedan dan dodatnog rada.** Vidi Dokument 14, stavka v1.1a/v1.1b, i Dokument 18, sekcija 2.15.
7. **"Moji termini" lista** — agregirani pregled termina kroz sve salone, NE kalendar, samo lista. Manji posao, može nezavisno od self-booking sistema. Vidi Dokument 18, sekcija 2.10.
8. **Employee delete ruta** — soft delete, infrastruktura (`is_deleted`/`deleted_at`) već postoji u bazi, samo nedostaje ruta. Vidi sekciju 4.1 ovog dokumenta.
9. **Automatsko obnavljanje access tokena (refresh token interceptor) — KRITIČNO za UX, otkriveno 28.06.2026.** Trenutno: access token traje 60 minuta (`.env`, `ACCESS_TOKEN_EXPIRE_MINUTES=60`), refresh token postoji i radi (30 dana), ALI frontend (`api.ts`) trenutno NEMA automatski mehanizam koji bi, kad access token istekne, sam pozvao `/api/v1/auth/refresh` i ponovio zahtjev — korisnik trenutno dobija 401 grešku i mora se ponovo ulogovati svakih 60 minuta. Za vlasnika salona koji koristi app cijeli radni dan, ovo je loše iskustvo. Rješenje: axios response interceptor koji hvata 401, automatski pozove refresh, ponovi originalni zahtjev — sve nevidljivo za korisnika. Mali, ali bitan zadatak, treba ići uz ostatak liste.
10. **Postaviti projekat (backend + frontend) na GitHub — DOGOVORENO 28.06.2026.** Razlog: Claude trenutno nema pouzdan, ažuran pristup frontend kodu (samo se "sjeća" iz ranijih poruka u razgovoru, što može biti netačno/zastarjelo) — backend kod je djelimično dostupan jer je generisan kroz raniju sesiju, ali frontend nikad nije sačuvan na isti način. Postavljanje kompletnog projekta na privatan GitHub repo omogućava Claude-u da fetch-uje i provjerava STVARNO, TRENUTNO stanje cijelog koda, ne samo backend dio ili ono što se "sjeća". Koraci: (1) inicijalizovati git repo u `D:\SmartBooking Platform` ako još nije, (2) kreirati privatan repo na github.com, (3) `git push` kompletnog projekta (provjeriti da `.gitignore` isključuje `venv/`, `node_modules/`, `.env`, `*.db` — osjetljivi/nepotrebni fajlovi), (4) dati Claude-u link na repo kad treba provjera koda. Ovo postaje POSEBNO važno prije nego se počne sa stavkama 4-8 ove liste, da Claude radi sa tačnim, ažurnim kodom, ne zastarjelim sjećanjem.

**Van ove liste, ali otvoreno/u toku:**
- Čeka se odgovor od payment gateway providera (CorvusPay, Monri WSPay, Lemon Squeezy, Paddle, FastSpring) — vidi Dokument 19
- **KRITIČNO, prije prve stvarne uplate: konsultacija sa knjigovođom u Banja Luci o poreskim obavezama** (status fizičko lice vs. preduzetnik s obzirom na redovnost prihoda, porez na dohodak, PDV tretman za MoR transakcije) — vidi Dokument 19, sekcija 3.3
- Plan enforcement (provjera Solo/Start/Pro/Business limita u kodu) — NIJE prioritet dok se ne riješi payment gateway, vidi sekciju 5.1a ovog dokumenta
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
- **Nema DELETE rute za zaposlene (potvrđeno 28.06.2026.)** — `Employee` model VEĆ IMA `is_deleted` i `deleted_at` kolone, i postojeća `GET` ruta VEĆ FILTRIRA `is_deleted == False` (soft-delete infrastruktura je spremna) — ali NE postoji nijedna ruta koja postavlja `is_deleted = True`. Treba implementirati `DELETE /api/v1/employees/{id}` (soft delete, NE hard delete iz baze — bitno da se ne pokvare historijske rezervacije koje referenciraju `employee_id`). Razmotriti i provjeru/upozorenje ako zaposleni ima buduće, aktivne rezervacije prije brisanja.
- Appointments nemaju **PUT/update rutu** za izmjenu vremena postojeće rezervacije (samo cancel/complete)
- Kalendar prikazuje samo **dnevni** pregled — sedmični/mjesečni prikaz nije implementiran
- **Admin panel NE POSTOJI** (identifikovano 26.06.2026) — `superadmin` rola postoji u modelu, ali nema UI/rute za pregled svih tenant-a, korisnika, ili JIB verifikaciju. Vidi sekciju 5.2b za plan implementacije.
- **Nema mehanizma provjere legitimnosti salona** — bilo koji korisnik može trenutno kreirati neograničen broj tenant-a bez bilo kakve provjere (vidi sekciju 5.2b)
- **Nema responsive (mobilni) dizajna** — layout je desktop-first, nije testiran/prilagođen za male ekrane (vidi Dokument 14, stavka v1.1a)
- **Nema PWA podrške** ("Add to Home Screen") — vidi Dokument 14, stavka v1.1b

### 4.2 Infrastrukturna ograničenja
- **Docker implementiran (26.06.2026)** — backend, frontend, i PostgreSQL kontejnerizovani kroz Docker Compose. Napomena: `Base.metadata.create_all()` u `app/main.py` treba ukloniti da Alembic bude jedini izvor istine za šemu baze (trenutno može dovesti do "column already exists" konflikta — vidi iskustvo iz sesije).
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

### 5.1a Plan Enforcement (NIJE KRITIČNO za beta, postaje bitno nakon naplate — odluka 28.06.2026.)

Dokument 13 definiše Solo/Start/Pro/Business pakete sa različitim limitima (broj zaposlenih, lokacija) i funkcionalnostima (email notifikacije, izvještaji, napredna pretraga — vidi Dokument 13, sekcija 6). Trenutni kod NE PROVJERAVA kojem paketu tenant pripada — sve funkcionalnosti rade identično za sve, nezavisno od plana. Potrebno implementirati prije nego naplata stvarno krene:
- [ ] Provjera broja zaposlenih/lokacija u odnosu na limit paketa (blokirati dodavanje novog zaposlenog ako je limit dostignut)
- [ ] Provjera plana prije pristupa "premium" funkcijama (eksport, napredna pretraga, itd. — kad budu implementirane)
- [ ] Veza sa downgrade pravilima (Dokument 13, sekcija 9 — provjeriti limite prije dozvoljavanja downgrade-a)

### 5.2 Sigurnost (KRITIČNO)
- [ ] Generisati novi, nasumičan `SECRET_KEY` za JWT (ne koristiti dev vrijednost)
- [ ] Premjestiti `.env` van git repozitorija ako već nije (provjeriti `.gitignore`)
- [ ] Implementirati rate limiting (minimum na `/auth/login` i `/auth/register`)
- [ ] Implementirati brute-force zaštitu (blokiranje IP-a nakon N neuspjelih login pokušaja)
- [ ] Dodati sigurnosne HTTP headere (HSTS, X-Content-Type-Options, itd.)
- [ ] Odlučiti i implementirati: da li email verifikacija treba blokirati funkcionalnost dok nije potvrđena

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
- [ ] Upravljanje korisnicima (User nalozi, ne samo Tenant) — vidi stavke ispod
- [ ] Upravljanje pretplatama — zavisi od payment gateway integracije (Dokument 19), ne prioritet dok ta odluka nije riješena
- [ ] Pregled statistike (platforma-wide: broj salona, broj korisnika, broj rezervacija ukupno) — srednje lako, agregacioni upiti
- [x] Blokiranje naloga — GOTOVO za Tenant (suspend), NEDOSTAJE za User (blokiranje pojedinačnog korisničkog naloga, ne cijelog salona)
- [ ] Upravljanje sistemskim postavkama — nejasno definisano, van obima za sada

**Nove ideje vlasnika (29.06.2026.):**
- [ ] **Pretraga tenant-a** po nazivu, JIB-u — LAKO, dodatak search input-a na postojeću tabelu (filter na frontend strani, ili `?search=` parametar na backend ruti, slično postojećoj Customer pretrazi)
- [ ] **Pretraga po email-u → koji tenant je registrovan na tom mailu** — SREDNJE LAKO. Nova ruta, npr. `GET /api/v1/admin/users/search?email=X`, koja vrati User podatke PLUS sve tenant-e gdje ta osoba ima `UserTenantRole` (join `users` → `user_tenant_roles` → `tenants`). Korisno za support slučajeve ("korisnik X se javio, koji salon kontroliše?").
- [ ] **Reset lozinke korisniku (admin-initiated)** — SREDNJE LAKO. Nova ruta `POST /api/v1/admin/users/{id}/reset-password` — generiše novi privremeni password ili šalje email sa reset linkom (zavisi od toga da li "Forgot Password" flow uopšte postoji — TRENUTNO NE POSTOJI nigdje u sistemu, ni za obične korisnike, ni za admina; vrijedno razmotriti da se ovo radi ZAJEDNO sa običnim "Forgot Password" flow-om, ne odvojeno samo za admin slučaj).

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

## 6. Zaključak

Backend i frontend su funkcionalno kompletni za MVP definisan u Dokumentu 14 (Faza A kroz C.5). Automatizovani test suite potvrđuje da je poslovna logika (booking, tenant izolacija, auth) ispravna i otporna na regresiju. Sljedeći korak je Faza D — infrastrukturna i sigurnosna priprema za izlaganje sistema stvarnim korisnicima, prema listi u sekciji 5 ovog dokumenta.

Nijedna stavka iz sekcije 5.1 i 5.2 ("KRITIČNO") ne treba biti preskočena prije nego prvi salon počne da koristi platformu.

---

*Dokument generisan 26.06.2026. na osnovu zajedničke razvojne sesije — SmartBooking Platform.*
