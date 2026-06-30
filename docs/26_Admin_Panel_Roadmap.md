# Admin Panel — Kompletan Roadmap (MVP / V2 / V3)

**Dokument:** 26 — Pratni dokument uz Blueprint 1.0
**Verzija:** 1.0
**Datum:** 29.06.2026.

---

## Svrha dokumenta

Kompletan plan Admin panel funkcionalnosti, predložen od vlasnika (29.06.2026), organizovan po modulima i podijeljen prema tehničkoj izvodljivosti — ne po željenom redoslijedu, već po TOME DA LI PODACI/INFRASTRUKTURA ZA TU FUNKCIJU VEĆ POSTOJE.

**Princip podjele:**
- **MVP** — može se implementirati SADA, koristi postojeće podatke/infrastrukturu
- **V2** — čeka Paddle (payment gateway) integraciju — nije tehnička složenost, već nedostatak podataka
- **V3** — kompleksnije, ili zavisi od V2 funkcionalnosti da prikupi dovoljno podataka (npr. analitika treba vremensku seriju)

**Cilj svih modula (naglasak vlasnika):** Pomoći da se vidi "modus operandi" — šta promijeniti da više korisnika ostane na platformi, automatizovati stvari da vlasnik ne mora raditi ručno.

---

## MVP — može se implementirati sada

### Dashboard (proširenje postojećeg)
- [x] Broj registrovanih salona — postoji (osnovni Dashboard)
- [ ] Broj aktivnih salona (`is_active = true`)
- [ ] Broj salona po statusu (pending/verified/suspended)
- [ ] Broj rezervacija danas
- [ ] Broj rezervacija ovaj mjesec
- [ ] Broj novih registracija (ovaj mjesec/sedmica)
- [ ] Broj aktivnih zaposlenih (kroz sve tenant-e)

### Tenants (proširenje postojeće Admin panel tabele)
- [x] Naziv, JIB, status, akcije (verify/suspend/reactivate) — postoji
- [ ] Datum registracije (`created_at`, već postoji u bazi, samo dodati u prikaz)
- [ ] Broj zaposlenih po tenant-u (agregacioni upit)
- [ ] Broj rezervacija po tenant-u (agregacioni upit)
- [ ] Pregled profila (detalj stranica/modal za jedan tenant)

### Korisnici (NOVI modul)
- [ ] Lista svih User naloga: email, email_verified status, broj tenant-a (kroz UserTenantRole join)
- [ ] Pretraga po email-u → koji tenant je registrovan (već zapisano, Dokument 19/Release Checklist sekcija 5.2c)
- [ ] Reset lozinke (vezano za "Forgot Password" flow, već prioritet #3 na listi)
- [ ] NOVO POLJE POTREBNO: last_login_at na User modelu — trenutno se ne prati kada se korisnik posljednji put ulogovao
- [ ] Zaključavanje naloga (postavi is_active = false na User nivou — razlika od Tenant suspend, ovo blokira pojedinačnog korisnika, ne cijeli salon)

### Audit Log (već planiran kao v1.2 u Fazi D — povezati sa Admin panelom)
- [ ] Nova tabela audit_logs: id, user_id, action, target_type, target_id, ip_address, created_at
- [ ] Logovati: login, verify/suspend/reactivate tenant-a, reset lozinke, broadcast slanje
- [ ] Admin panel stranica — lista zapisa, filtriranje po korisniku/akciji/datumu
- [ ] Vlasnik je eksplicitno naglasio da ovo mora postojati — standardna praksa za ozbiljne SaaS admin panele

### Sistem (djelimično)
- [ ] Status konekcije sa bazom (jednostavan healthcheck poziv)
- [ ] Verzija aplikacije (statički prikaz iz package.json/git tag-a)
- [ ] Status Docker kontejnera — moguće kroz API poziv (zahtijeva pažljivo razmišljanje o sigurnosti)
- [ ] Disk/Memorija — zahtijeva poseban monitoring alat, veći posao, razmotriti tek kad postane stvarna potreba

### Release info (lako, niska prioritet vrijednost)
- [ ] Prikaz verzije, datum deploy-a, git commit hash

---

## V2 — čeka Paddle (payment gateway) integraciju

Razlog kategorije: ovi moduli nisu tehnički složeni — jednostavno ne postoje podaci za prikazati dok Paddle integracija (webhook sistem, Dokument 19 sekcija 3.4) ne proradi.

### Pretplate (kompletan novi modul)
- [ ] Tabela: paket, cijena, Paddle Subscription ID, status, datum sljedeće naplate, trial/istek, zadnja uplata
- [ ] Akcije: produži pretplatu, otkaži, vrati na trial, ručno aktiviraj (override za rub-slučajeve)

### Finansije
- [ ] MRR, ARR, prihod danas/mjesec, refundacije, Trial → Paid konverzija

### Email Centar
- [ ] Pregled poslatih/neuspjelih/verifikacionih email-ova
- [ ] Tehnička napomena: trenutno se slanje email-a ne loguje nigdje — treba nova tabela email_logs

### Obavještenja — proširenje već planirane funkcije
- [ ] Već zapisano kao broadcast (Dokument 18, sekcija 2.18) — V2 dodaje filtere po paketu/trial statusu

---

## V3 — kompleksnije, ili zavisi od vremenske serije podataka

### Analitika (grafici)
- [ ] Novi saloni po mjesecima, rast rezervacija, aktivni korisnici — tehnički lako, smisleno tek kad postoji nekoliko mjeseci podataka
- [ ] Najaktivniji saloni — lako, može i ranije
- [ ] Churn, MRR grafik kroz vrijeme — zavisi od Paddle podataka

### JIB Verifikacija — proširenje postojećeg
- [ ] V3 dodatak: "Odbijen" status (razlikovati od suspended)

### Feature Flags
- [ ] Uključivanje/isključivanje funkcionalnosti bez novog deploy-a
- [ ] Napomena: nije prioritet za trenutni obim (solo developer kontroliše deploy direktno)

---

## Health Score — izdvojeno, posebno vrijedna ideja (MVP djelimično + V2 puna verzija)

Vlasnikov "favorit" — sistem koji za svaki salon prikazuje status: Aktivan / Rizik / Neaktivan, na osnovu kombinacije faktora.

Zašto je ovo posebno vrijedno: direktno odgovara na osnovni cilj vlasnika — koji modus operandi promijeniti da više korisnika ostane na platformi. Health Score je alat za PROAKTIVNO djelovanje (kontaktirati salon prije nego otkaže), ne samo retroaktivno gledanje statistike.

**MVP dio (može se računati odmah, bez Paddle-a):**
- Zadnji login (zahtijeva last_login_at polje)
- Broj rezervacija (postoji)
- Broj otkazivanja (postoji)

**V2 dio (zahtijeva Paddle podatke):**
- Istek trial-a
- Neuspjele uplate

**Predlog formule (jednostavna verzija za MVP):**
- Aktivan: login u zadnjih 7 dana, ima rezervacija ovaj mjesec, niska stopa otkazivanja
- Rizik: login 7-30 dana, malo/nikako rezervacija ovaj mjesec, ili visoka stopa otkazivanja
- Neaktivan: nije se ulogovao 30+ dana, nema rezervacija

**Status: vrijedi implementirati MVP verziju čim last_login_at polje postoji — ne treba čekati Paddle za osnovnu verziju. Puna verzija ide u V2.**

---

## Sumarni zaključak

Većina MVP modula zahtijeva samo proširenje postojećih podataka (agregacioni upiti, nova kolona ovdje-ondje) — ne veliki novi sistemi. Najveći MVP zadatak je Audit Log (nova tabela + logovanje na više mjesta u kodu) i Korisnici modul (nova stranica). V2 moduli su prirodno blokirani dok Paddle integracija ne proradi — ne radi se o tehničkoj složenosti, već o nedostatku podataka za prikazati. Health Score je izdvojen kao posebno vrijedna ideja koja se može djelimično implementirati i prije V2, jer direktno služi osnovnom cilju (retencija korisnika).

---

*Kraj dokumenta.*
