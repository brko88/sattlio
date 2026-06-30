# SmartBooking Platform — Testing Strategy

**Dokument:** 11 — Testing Strategy
**Verzija:** 1.0
**Status:** Final
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše strategiju testiranja SmartBooking platforme. Cilj je osigurati: stabilnost sistema, pouzdanost poslovne logike, sigurnost podataka, zaštitu od regresija, kvalitet prije produkcijskog puštanja.

---

## 2. Ciljevi testiranja

Testiranje mora potvrditi da: funkcionalnosti rade prema specifikaciji, poslovna pravila se poštuju, nema cross-tenant pristupa, API vraća očekivane odgovore, aplikacija ostaje stabilna nakon izmjena.

---

## 3. Vrste testiranja

SmartBooking koristi: Unit Testing, Integration Testing, API Testing, Security Testing, Manual Testing, End-to-End Testing.

---

## 4. Unit Testing

Unit testovi provjeravaju pojedinačne funkcije.

Primjeri: kreiranje JWT tokena, hashiranje lozinke, validacija email adrese, validacija rezervacije, provjera preklapanja termina.

---

## 5. Integration Testing

Integration testovi provjeravaju saradnju više komponenti.

Primjeri: API + Database, API + Authentication, API + Redis, API + Email Service.

---

## 6. API Testing

Testiraju se svi endpointi.

Obavezno testirati: success scenario, invalid input, unauthorized access, forbidden access, tenant isolation.

Primjer — `POST /api/v1/appointments`:
- validan termin
- zauzet termin
- nepostojeći employee
- nepostojeći service

> **Status:** U Fazi A, ovi scenariji su testirani manuelno kroz PowerShell (`Invoke-RestMethod`), uključujući granični slučaj preklapanja termina. Automatizovani test suite (pytest) je planiran za Fazu D.

---

## 7. Security Testing

Obavezne provjere: JWT validacija, istek tokena, role permissions, tenant isolation, brute force zaštita, rate limiting.

---

## 8. Tenant Isolation Testing

**KRITIČNO**

Za svaki endpoint mora postojati test koji potvrđuje: Tenant A ne može vidjeti podatke Tenant B.

Primjeri: appointments, customers, employees, services, locations.

---

## 9. Business Rules Testing

Moraju biti testirana sva pravila iz Dokumenta 10.

Primjeri: BR-020 (nema preklapanja termina), BR-024 (termin ne može biti kreiran u prošlosti), BR-072 (neaktivna usluga ne može biti rezervisana), BR-082 (svi podaci moraju biti vezani za tenant).

---

## 10. Authentication Testing

Obavezni scenariji: registracija, login, logout, refresh token, email verifikacija, neispravan password, nepostojeći korisnik, istekao token.

---

## 11. Authorization Testing

Moraju biti testirane sve uloge: superadmin, owner, employee, customer.

Primjeri: Owner može kreirati zaposlenog. Employee ne može kreirati zaposlenog. Customer ne može uređivati usluge.

---

## 12. End-to-End (E2E) Testing

Testira kompletan tok rada korisnika.

**Scenario 1:** Registracija korisnika → Email verifikacija → Login → Kreiranje poslovnog subjekta

**Scenario 2:** Owner → Dodaje zaposlenog → Dodaje uslugu → Definiše radno vrijeme

**Scenario 3:** Kreiranje klijenta → Kreiranje rezervacije → Potvrda rezervacije → Završavanje rezervacije

**Scenario 4:** Pregled kalendara → Izmjena termina → Otkazivanje termina

---

## 13. Performance Testing

Sistem mora zadovoljiti: dnevni kalendar < 2 sekunde, sedmični kalendar < 3 sekunde, login < 1 sekunda, API response < 500 ms za standardne zahtjeve.

---

## 14. Test Coverage

**Backend:** 80% coverage poslovne logike, 100% coverage sigurnosnih modula
**Frontend:** kritične korisničke putanje, auth flow, rezervacije

---

## 15. Regression Testing

Prije svakog release-a mora se izvršiti: API test suite, security test suite, tenant isolation test suite, business rules test suite.

---

## 16. Test Data Pravila

Test podaci ne smiju koristiti produkcijske podatke. Koristiti: dummy korisnike, dummy rezervacije, test email adrese.

---

## 17. Release Criteria

Nova verzija može biti deployana samo ako:
- ✔ svi testovi prolaze
- ✔ nema kritičnih bugova
- ✔ nema sigurnosnih propusta
- ✔ tenant isolation testovi prolaze
- ✔ business rules testovi prolaze

---

## 18. MVP Acceptance Testing

MVP se smatra prihvaćenim ako korisnik može:

1. Registrovati nalog
2. Potvrditi email
3. Prijaviti se
4. Kreirati poslovni subjekt
5. Dodati lokaciju
6. Dodati zaposlenog
7. Dodati uslugu
8. Definisati radno vrijeme
9. Dodati klijenta
10. Kreirati rezervaciju
11. Pregledati kalendar
12. Izmijeniti rezervaciju
13. Otkazati rezervaciju
14. Završiti rezervaciju
15. Odjaviti se iz sistema

---

## 19. Bug Prioriteti

| Prioritet | Primjeri |
|---|---|
| Critical | gubitak podataka, cross-tenant pristup, sigurnosni propust |
| High | rezervacije ne rade, login ne radi, API vraća pogrešne podatke |
| Medium | UI greške, problemi sa prikazom |
| Low | kozmetički problemi, tekstualne greške |

---

## 20. Zaključak

Ovaj dokument definiše standard kvaliteta SmartBooking platforme. Nijedna verzija sistema ne smije biti puštena u produkciju bez prolaska testova definisanih ovim dokumentom.

Testiranje nije opcionalno već sastavni dio razvoja i procesa isporuke softvera.

---

*Kraj dokumenta.*
