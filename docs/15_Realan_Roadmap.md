# SmartBooking Platform — Realan Roadmap za Solo Razvoj

**Dokument:** 15 — Pratni dokument uz Blueprint 1.0 i Dokument 14
**Verzija:** 1.0
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Originalni Dokument 12 (Product Roadmap) definiše tačan redoslijed faza razvoja — i taj redoslijed je dobar i ostaje nepromijenjen. Problem nije ŠTA, problem je KOLIKO VREMENA. Originalni rokovi su pisani kao za razvojni tim, ne za jednu osobu koja uči programiranje uz pomoć Claude-a.

Ovaj dokument zadržava identičan redoslijed faza, ali sa realnim vremenskim okvirima, i jasno odvaja: (1) ono što gradimo u narednih nekoliko mjeseci, i (2) punu petogodišnju viziju koja ostaje cilj, ali se ne pokušava postići odjednom.

> Ovaj dokument je živ — vremenski okviri su procjena, ne ugovor. Cilj je realno očekivanje, ne pritisak.

---

## 2. Faza A — Core MVP (lokalni razvoj, prati Dokument 14)

Ovo je period u kojem se gradi v0.1 do v0.4 — auth, tenant, employees, services, customers, booking engine sa overlap provjerom. Radi se lokalno, SQLite, bez interneta.

| Faza | Originalni plan | Realna procjena | Napomena |
|---|---|---|---|
| Auth + Tenant (v0.1) | 7 dana | 2–3 nedjelje | JWT, registracija, login, UserTenantRole model — solidan temelj prije svega ostalog. |
| Employees + Services (v0.2) | 7 dana | 1–2 nedjelje | CRUD obrasci se ponavljaju — drugi i treći CRUD modul idu brže od prvog. |
| Working Hours + Customers (v0.3) | 7 dana | 1–2 nedjelje | Working hours model je jednostavan; customers CRUD je rutina u ovoj tački. |
| Booking Engine (v0.4) | 14 dana | 3–5 nedjelja | Najteži dio sistema. Overlap provjera, validacija radnog vremena, edge case-ovi. Ne žuriti ovdje. |

**Realna procjena za kompletnu Fazu A: 8–12 nedjelja (2–3 mjeseca)** rada u slobodno vrijeme, uz Claude-a kao pisača koda.

> ✅ **Stvarni ishod (vidi Dokument 16):** Faza A je u praksi završena kroz nekoliko intenzivnih sesija rada uz Claude-a kao pisača koda — mnogo brže od ove procjene, jer je procjena pravljena pod pretpostavkom da korisnik samostalno piše i debug-uje kod. Brzina pisanja koda nije zamjena za razumijevanje — vidi diskusiju u sesiji o tome šta "ispred plana" stvarno znači.

---

## 3. Faza B — Produkcijski oblik baze i servisa

Prelazak sa SQLite na PostgreSQL, uvođenje async SQLAlchemy, pravi email servis.

- Migracija na PostgreSQL + Alembic: 1–2 nedjelje
- Pravi email servis (SMTP) za verifikaciju: 3–5 dana
- Refresh token rotacija sa čuvanjem u bazi: 3–5 dana

**Realna procjena za Fazu B: 3–4 nedjelje.**

---

## 4. Faza C — Frontend (web aplikacija)

Originalni Dokument 02 i 12 predviđaju Web Admin kao dio MVP-a od samog početka. Ovdje se pravi svjesna odluka: backend prvo radi kompletno i ispravno (Faze A i B), tek onda se pravi frontend, jer je mnogo lakše graditi UI na API-ju koji je već testiran nego graditi oboje paralelno kao beginner.

- React + TypeScript skeleton, routing, login/register stranice: 1–2 nedjelje
- Dashboard, employees/services/customers stranice (CRUD UI): 2–3 nedjelje
- Kalendar (day/week/month prikaz) + kreiranje rezervacije iz UI: 2–4 nedjelje

**Realna procjena za Fazu C: 5–9 nedjelja.**

---

## 5. Faza D — Spremnost za prve korisnike

Tek u ovoj fazi ulaze Docker, deployment na server, audit log, rate limiting — stvari koje su originalni dokumenti tražili od prvog dana.

- Docker + Docker Compose + deployment na 1 VPS: 1–2 nedjelje
- Audit log servis: 3–5 dana
- Rate limiting, brute-force zaštita, security headeri: 1 nedjelja
- Ručno testiranje cijelog toka (Dokument 11, MVP Acceptance Testing): 1–2 nedjelje

**Realna procjena za Fazu D: 4–6 nedjelja.**

---

## 6. Ukupna procjena do prvog pravog korisnika

| Faza | Realno trajanje |
|---|---|
| A — Core MVP (backend logika) | 8–12 nedjelja |
| B — Produkcijska baza i email | 3–4 nedjelje |
| C — Frontend | 5–9 nedjelja |
| D — Deployment i sigurnost | 4–6 nedjelja |
| **UKUPNO** | **~20–31 nedjelja (5–7.5 mjeseci)** |

> Ovo pretpostavlja rad u slobodno vrijeme, uz posao/život, ne puno radno vrijeme. Ako se radi svakodnevno više sati, vrijeme se može prepoloviti. Ako se radi povremeno (vikendima), može potrajati i duže — i to je u redu.

---

## 7. Faza E i dalje — puna petogodišnja vizija (nepromijenjena)

Od trenutka kad prvi salon počne da koristi sistem, dalji razvoj prati originalni Dokument 12 — Product Roadmap — bez izmjena. Ovaj dokument se ne ponavlja ovdje u detalje; samo se potvrđuje redoslijed:

- **V1** — Profesionalizacija: napredna pretraga, eksport, napredni dashboard
- **V2** — Monetizacija: Stripe/PayPal, pretplate, trial period (Dokument 13)
- **V3** — Mobilne aplikacije: Android, zatim iOS
- **V4** — Marketplace: javni profili, pretraga, online rezervacije bez poziva
- **V5** — Marketing alati: kuponi, loyalty program, kampanje *(uključuje i ideje o bonus-poen sistemu i referral programu razmatrane u razvojnim sesijama — vidi napomenu ispod)*
- **V6** — Više poslovnica: centralni dashboard, agregirani KPI
- **V7** — Napredna analitika: KPI dashboard, predviđanja
- **V8** — AI funkcionalnosti
- **V9** — Integracije: Google/Outlook/Apple Calendar, SMS servisi

Vremenski okvir za V1–V9 zavisi od stvarnog rasta broja korisnika i prihoda, ne od fiksnog kalendara — originalni Dokument 12 predlaže mjesece (npr. Android u februaru-julu 2027), ali realan pristup je: **sljedeća faza počinje kada prethodna stabilno radi i kada postoji stvarna potražnja korisnika za njom**, ne po unaprijed fiksiranom datumu.

> **Napomena o loyalty/referral sistemu (V5):** Bonus-poen sistem (npr. 1 poen po završenoj rezervaciji, zamjenjivo za besplatnu uslugu) i referral program (bonus za pozivanje novih korisnika) su razmatrani kao ideje. Arhitekturno se lako uklapaju — dodaju se nove tabele (`loyalty_points`, `loyalty_transactions`, `referrals`), bez izmjene postojeće šeme. Preporučena poslovna odluka: trošak poena snosi tenant (salon), ne platforma — platforma daje alat, salon nosi cijenu popusta.

---

## 8. Pravilo za svaki naredni korak

Kad dođe vrijeme da se odluči šta je sljedeće, postavi sebi ovo pitanje, istim redom:

1. Da li trenutna faza (A, B, C ili D) potpuno radi i ispravna je? Ako ne — ne kreći dalje.
2. Da li sljedeća stvar koju želim dodati zahtijeva izmjenu baze podataka? Ako da — provjeri Dokument 03, vjerovatno je kolona već tu.
3. Da li sljedeća stvar zahtijeva novi servis (Redis, Celery, plaćanje)? Ako da — uvodi se tek kad postoji stvarna potreba, ne unaprijed.

---

## 9. Zaključak

Redoslijed iz originalnog Blueprint-a je ispravan i ostaje vodeći okvir. Ovaj dokument samo razvlači vrijeme na realniju skalu i pravi jasnu razliku između onoga što se gradi danas (Faze A–D, idućih ~6 mjeseci) i onoga što je vizija za narednih 5 godina (Faza E, Dokument 12).

Cilj nije brzina po svaku cijenu. Cilj je da svaka faza bude stvarno, čvrsto završena prije prelaska na sljedeću.

---

*Kraj dokumenta.*
