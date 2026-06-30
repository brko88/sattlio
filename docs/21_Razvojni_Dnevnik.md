# SmartBooking Platform — Razvojni Dnevnik

**Dokument:** 21 — Pratni dokument uz Blueprint 1.0
**Verzija:** 1.0 (živi dokument, dopunjuje se kontinuirano)
**Prvi unos:** Juni 2026.

---

## Svrha dokumenta

Hronološki pregled razvoja platforme, po mjesecima/kvartalima — šta je urađeno, koje odluke su donesene i zašto, koji bugovi su otkriveni i ispravljeni. Razlikuje se od ostalih pratnih dokumenata (14-20) po tome što je **vremenski organizovan** (šta se desilo KAD), ne tematski (kako nešto treba implementirati).

**Princip vođenja:** Dopunjuje se postepeno, na kraju svakog mjeseca/kvartala, ne retroaktivno — da se ne izgube detalji koji se najbolje pamte u trenutku kad se dešavaju.

---

## Juni 2026.

### Sedmica 1 (19-20.06.) — Početak, prvi backend

- Pokrenut razvoj SmartBooking platforme (booking sistem za salone/ordinacije/servise u BiH)
- Napisan kompletan Blueprint (Dokumenti 00-13): vizija, arhitektura, baza, API specifikacija, poslovna pravila, roadmap, pricing
- Prva verzija backend-a (v0.1-v0.4): FastAPI + SQLite, osnovni CRUD moduli (Tenants, Employees, Services)
- Ova prva verzija je naknadno **odbačena** kao prototip/učenje — prelazak na PostgreSQL i ažurirane blueprint dokumente

### Sedmica 2 (23.06.) — Faza A kompletirana

- Kompletan rebuild na PostgreSQL, async SQLAlchemy, Pydantic v2
- Core booking engine: JWT auth, multi-tenant arhitektura (`UserTenantRole`), Employees/Services/Customers/Appointments CRUD
- Booking logika: overlap provjera, working hours provjera, status tranzicije (created→confirmed→completed/cancelled/no_show)
- Dokument 16 (Phase A Completion Report) napisan — svih 8 acceptance kriterija ispunjeno

### Sedmica 3 (25.06.) — Faza B, planiranje akvizicije

- Email verifikacija (Gmail SMTP), refresh token rotacija sa SHA256 hash čuvanjem
- Alembic migracije uvedene (initial schema, verification token, refresh tokens)
- Dokument 17 — Akvizicijska strategija: prvih 5-10 salona besplatno, bez vremenskog ograničenja
- Razmotrena i zapisana ideja za "Bend Booking App" (odvojen koncept, calendar integracija za muzičke bendove)

### Sedmica 4 (26-28.06.) — Faza C, Faza C.5, Faza D počinje, veliki broj poslovnih odluka

**Frontend (Faza C):**
- Kompletan React + TypeScript + Vite frontend: Login/Register, Dashboard, sve CRUD stranice
- Vizuelni kalendar — dnevni prikaz, precizno pozicioniranje termina, klik-modal za detalje
- Tenant switching (multi-salon po nalogu)
- Velika Tailwind CSS migracija — konzistentan dizajn kroz cijelu aplikaciju

**Kritični bugovi otkriveni i ispravljeni:**
- **Race condition u booking engine-u** — dva istovremena zahtjeva mogla kreirati duplikat rezervacije. Ispravljeno sa `with_for_update()` zaključavanjem na Employee redu. Otkriveno kroz namjeran Promise.all test, ne kroz obično korištenje.
- Working Hours duplikati — dodavanje istog dana je pravilo duplikat zapis umjesto ažuriranja postojećeg
- Timezone bug u refresh token logici (offset-naive vs offset-aware datetime poređenje)
- Services.tsx je greškom sadržao Employees kod (otkriveno kroz testiranje, ne kroz code review)

**Automatizovani test suite (Faza C.5 — nova faza dodana u plan):**
- 46 testova napisano i svi prolaze (auth, tenant izolacija, CRUD moduli, booking engine, race condition regresija)
- Izolovana SQLite test baza, email mock-ovan (testovi ne zavise od mreže)

**Docker (Faza D počinje):**
- Backend, frontend, PostgreSQL kontejnerizovani kroz Docker Compose
- Otkriven i ispravljen `Base.metadata.create_all()` konflikt sa Alembic migracijama

**Veliki broj poslovnih/strateških odluka kroz razgovor:**
- Affiliate/referral program koncept — otvoreno pitanje strukture nagrade (100% prve uplate vs trajni postotak)
- Istraženi payment gateway providers za BiH tržište — otkriveno da Stripe NE podržava BiH; identifikovane Merchant of Record alternative (Lemon Squeezy, Paddle, FastSpring) koje rade bez registrovane firme
- **JIB verifikacija salona** — ključna sigurnosna ideja vlasnika da se spriječi kreiranje fiktivnih salona, sa automatskom verifikacijom pri prvoj uplati (nakon beta perioda)
- Strategija internacionalizacije — BiH prvo (6-12 mjeseci), moguć pivot na njemačko tržište ("Termin kultur"), sa identifikovanim preduslovima (i18n, GDPR, valuta)
- Self-booking sistem definisan (privatno/javno po zaposlenom) — kroz tri iteracije razjašnjenja do finalnog, tačnog razumijevanja
- Niz UI/UX odluka za responsive (mobilni) prikaz: full-screen kalendar, 24h format vremena, rješenje za pretrpan raspored, PWA podrška, Google Calendar kao vizuelni referentni standard
- Otkrivene više dokumentovanih, ali neimplementiranih funkcionalnosti iz originalnog Blueprint-a: `GET /appointments/my` ruta, `employee_services` tabela (cjenovnik po zaposlenom), Tenant edit ruta, Employee delete ruta — sve sa postojećom infrastrukturom u bazi (npr. `is_deleted` kolone) ali bez implementacije
- Ukupno 14 V2/buduća funkcionalnost ideja zapisano u Dokumentu 18, sortiranih po složenosti

**Status na kraju Juna 2026.:** Faza A, B, C, C.5 kompletne. Faza D u toku (Docker završen, JIB+Admin panel+self-booking+responsive planiran za sljedeću sesiju).

---

## [Sljedeći unos — dopuniti na kraju sljedećeg mjeseca/kvartala]

