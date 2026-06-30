# SmartBooking Platform — Business Rules

**Dokument:** 10 — Business Rules
**Verzija:** 1.0
**Status:** Final
**Datum:** 19.06.2026.

> **Status implementacije:** Pravila označena ✅ su implementirana i testirana u Fazi A (vidi `PHASE_A_COMPLETION_REPORT.md`). Ostala čekaju kasnije faze.

---

## 1. Svrha dokumenta

Ovaj dokument definiše poslovna pravila SmartBooking platforme. Poslovna pravila određuju ponašanje sistema nezavisno od tehnologije implementacije. Sva backend i frontend logika mora biti usklađena sa ovim dokumentom.

---

## 2. Osnovna pravila sistema

- **BR-001** — Svaka rezervacija mora pripadati jednom poslovnom subjektu. ✅
- **BR-002** — Svaka rezervacija mora imati: klijenta, uslugu, zaposlenog, datum, vrijeme početka. ✅
- **BR-003** — Rezervacija ne može postojati bez definisane usluge. ✅

---

## 3. Pravila radnog vremena

- **BR-010** — Rezervacije su dozvoljene samo tokom radnog vremena poslovnog subjekta.
- **BR-011** — Rezervacije su dozvoljene samo tokom radnog vremena zaposlenog. ✅
- **BR-012** — Ako zaposleni nije dostupan, rezervacija nije dozvoljena. ✅
- **BR-013** — Sistem mora podržavati: godišnje odmore, bolovanje, neradne dane, praznike. *(Planirano za V2)*

---

## 4. Pravila termina

- **BR-020** — Dva termina istog zaposlenog ne smiju se preklapati. ✅
- **BR-021** — Početak termina mora biti prije kraja termina. ✅
- **BR-022** — Trajanje termina određuje usluga. ✅
- **BR-023** — Ručno mijenjanje trajanja dozvoljeno je samo vlasniku.
- **BR-024** — Termin ne može biti kreiran u prošlosti. ✅
- **BR-025** — Rezervacija mora biti vezana za jednu lokaciju poslovnog subjekta. *(Lokacija nije implementirana u Fazi A)*
- **BR-026** — Zaposleni može primati rezervacije samo na lokacijama kojima je dodijeljen. *(Planirano za V2)*

---

## 5. Pravila rezervacije

- **BR-030** — Klijent može imati više rezervacija. ✅
- **BR-031** — Jedan termin može imati samo jednog klijenta. ✅
- **BR-032** — Jedan termin može imati samo jednog zaposlenog. ✅
- **BR-033** — Jedna rezervacija može sadržavati samo jednu uslugu. *(MVP ograničenje)* ✅
- **BR-034** — Višestruke usluge po rezervaciji planirane su za verziju 2.

---

## 6. Pravila otkazivanja

- **BR-040** — Rezervacija se može otkazati. ✅
- **BR-041** — Status otkazane rezervacije ostaje trajno sačuvan. ✅
- **BR-042** — Otkazana rezervacija ne briše se iz baze. ✅
- **BR-043** — Sistem mora evidentirati: ko je otkazao, kada je otkazao. *(Nije implementirano u Fazi A)*
- **BR-044** — Završena rezervacija ne može biti otkazana. ✅
- **BR-045** — Rezervacija označena kao no_show ne može se vratiti u status created ili confirmed. ✅ *(djelimično — cancelled/completed su konačni)*

---

## 7. Statusi rezervacija

Dozvoljeni statusi: `created`, `confirmed`, `cancelled`, `completed`, `no_show`

---

## 8. Status tranzicije

Dozvoljene promjene:
```
created
├─> confirmed
└─> cancelled

confirmed
├─> completed
├─> no_show
└─> cancelled
```

Nije dozvoljeno:
```
completed → created
completed → cancelled
```

---

## 9. Pravila klijenata

- **BR-050** — Klijent može postojati bez email adrese. ✅
- **BR-051** — Telefon nije obavezan. ✅
- **BR-052** — Ime i prezime su obavezni. ✅
- **BR-053** — Historija klijenta mora ostati trajno dostupna. ✅

---

## 10. Pravila zaposlenih

- **BR-060** — Zaposleni može pružati više usluga. ✅
- **BR-061** — Zaposleni može imati vlastito radno vrijeme. ✅
- **BR-062** — Neaktivni zaposleni ne mogu primati nove rezervacije. ✅

---

## 11. Pravila usluga

- **BR-070** — Usluga mora imati trajanje. ✅
- **BR-071** — Usluga mora imati cijenu. ✅
- **BR-072** — Neaktivna usluga ne može biti rezervisana. ✅
- **BR-073** — Brisanje usluge ne smije obrisati historijske rezervacije. *(Soft delete spremno, nije testirano)*

---

## 12. Tenant pravila

- **BR-080** — Korisnik vidi samo podatke svog tenant-a. ✅
- **BR-081** — Tenant ne može pristupiti podacima drugog tenant-a. ✅
- **BR-082** — Svi podaci moraju biti vezani za tenant_id. ✅

### 12.1 UserTenantRole pravila

- **BR-083** — Jedan korisnik može pripadati više tenant-a. ✅
- **BR-084** — Jedan korisnik može imati različite uloge u različitim tenant-ima. ✅

  Primjer: Owner u Tenant A, Employee u Tenant B, Customer u Tenant C

- **BR-085** — Uloga korisnika određuje se kroz UserTenantRole relaciju, a ne direktno na User nalogu. ✅

---

## 13. Audit pravila

- **BR-090** — Sistem mora evidentirati: kreiranje rezervacije, izmjenu rezervacije, otkazivanje rezervacije, promjenu zaposlenog, promjenu usluge. *(Planirano za Fazu D)*
- **BR-091** — Audit log se ne briše. *(Planirano za Fazu D)*

---

## 14. Email pravila (MVP)

- **BR-100** — Prilikom registracije korisnika šalje se email potvrde. *(Simulirano, nije implementirano u Fazi A)*
- **BR-101** — Prilikom kreiranja rezervacije šalje se potvrda rezervacije. *(Planirano za Fazu B)*
- **BR-102** — Korisnik mora potvrditi email adresu prije korištenja određenih funkcionalnosti sistema. *(Planirano)*
- **BR-103** — Sistem mora omogućiti ponovno slanje email verifikacije. *(Planirano)*

---

## 15. Pravila performansi

- **BR-110** — Prikaz dnevnog kalendara mora biti ispod 2 sekunde.
- **BR-111** — Prikaz sedmičnog kalendara mora biti ispod 3 sekunde.

---

## 16. Sigurnosna pravila

- **BR-120** — Lozinke se čuvaju isključivo hashirane. ✅
- **BR-121** — JWT token je obavezan za sve zaštićene API pozive. ✅
- **BR-122** — Tenant ID nikada ne dolazi iz korisničkog inputa bez validacije. ✅ *(validira se protiv UserTenantRole)*

---

## 17. Pravila lokacija

- **BR-130** — Svaka lokacija pripada tačno jednom tenant-u. *(Lokacija model nije implementiran u Fazi A)*
- **BR-131** — Tenant može imati jednu ili više lokacija.
- **BR-132** — MVP podržava jednu lokaciju, ali poslovna pravila moraju ostati kompatibilna sa više lokacija.
- **BR-133** — Rezervacija mora biti povezana sa lokacijom na kojoj će usluga biti izvršena.

---

## 18. Pravila budućih verzija

Planirano za V2: više usluga po rezervaciji, više poslovnica, grupne rezervacije, resursi (sale, stolovi, oprema), online plaćanje.

---

## 19. Kriterijumi validnosti sistema

Sistem je validan samo ako: nema preklapanja termina, nema cross-tenant pristupa, historija rezervacija ostaje sačuvana, sva pravila iz ovog dokumenta se poštuju.

---

## 20. Zaključak

Ovaj dokument predstavlja centralni skup poslovnih pravila SmartBooking platforme. Sva buduća funkcionalnost mora biti usklađena sa ovim pravilima ili zahtijeva novu verziju dokumenta.

---

*Kraj dokumenta.*
