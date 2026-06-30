# Sattlio Platform — Frontend Architecture (Web Application)

**Dokument:** 07 — Frontend Architecture (Web Application)
**Verzija:** 1.0
**Status:** Final
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše frontend arhitekturu Sattlio platforme. Cilj dokumenta je osigurati: konzistentan razvoj korisničkog interfejsa, jednostavno održavanje aplikacije, podršku za više jezika, podršku za buduće mobilne aplikacije, jednostavno povezivanje sa backend API-jem.

---

## 2. Tehnološki stack

- React 18+
- TypeScript
- React Router
- Axios
- TailwindCSS

Razlozi: brz razvoj, velika zajednica, dugoročna održivost, jednostavna integracija sa FastAPI backendom.

---

## 3. Arhitektura aplikacije

Frontend koristi modularnu arhitekturu. Svaki modul ima: stranice, komponente, API servise, tipove podataka.

Primjeri modula: Auth, Tenants, Employees, Customers, Services, Appointments, Profile, Admin

---

## 4. Struktura projekta

```
src/
├── assets/
├── components/
├── layouts/
├── pages/
├── modules/
├── services/
├── hooks/
├── contexts/
├── routes/
├── utils/
├── translations/
├── App.tsx
└── main.tsx
```

---

## 5. Routing

Koristi se React Router.

Primjeri ruta: `/login`, `/register`, `/dashboard`, `/employees`, `/services`, `/customers`, `/calendar`, `/profile`, `/admin`, `/tenant-switch`, `/select-business`, `/businesses`

Zaštićene rute zahtijevaju prijavljenog korisnika.

---

## 6. State Management

MVP koristi: React Context, Custom Hooks. Nije potrebno uvoditi Redux u MVP fazi.

Kasnije se može dodati: Zustand, Redux Toolkit — ukoliko aplikacija postane kompleksnija.

---

## 7. API komunikacija

Komunikacija sa backendom ide isključivo putem REST API-ja. Koristi se Axios.

Primjer: `GET /api/v1/services`, `POST /api/v1/appointments`

Frontend nikada ne pristupa direktno bazi podataka.

---

## 8. Autentifikacija

Frontend koristi: JWT Access Token, Refresh Token, Active Tenant Context

Prilikom logina:
1. korisnik unosi email i lozinku
2. backend vraća access i refresh token
3. token se čuva na siguran način
4. korisnik bira aktivni poslovni subjekt (tenant)
5. svi naredni requesti koriste Authorization header

Sistem mora podržavati promjenu aktivnog tenant-a bez ponovne prijave korisnika.

---

## 9. Role Based UI

Interfejs mora prikazivati funkcionalnosti u skladu sa ulogom korisnika.

Moguće uloge: SuperAdmin, Owner, Employee, Customer

Primjer:
- Employee ne vidi: pretplatu, administraciju poslovnog subjekta
- Customer ne vidi: upravljanje zaposlenima, upravljanje uslugama

**Važno:** Korisnički interfejs ne predstavlja sigurnosni mehanizam. Sve role provjere moraju postojati i na backend-u. Frontend samo skriva ili prikazuje funkcionalnosti radi boljeg korisničkog iskustva.

---

## 10. Internacionalizacija (i18n)

Frontend mora podržavati više jezika.

Početni jezici: Bosanski, Engleski
Planirani jezici: Hrvatski, Srpski, Njemački

Nije dozvoljeno hardkodiranje tekstova. Primjer: ne koristiti `"Sačuvaj"`, koristiti `common.save`

### 10.1 Tenant Switching UI

Korisnik može biti član više poslovnih subjekata. Frontend mora omogućiti: prikaz liste dostupnih tenant-a, izbor aktivnog tenant-a, promjenu tenant-a bez logout-a, automatsko osvježavanje podataka nakon promjene tenant-a.

---

## 11. Responsive Design

Aplikacija mora podržavati: Desktop, Tablet, Mobile. Sve stranice moraju biti responzivne. Frontend se razvija po principu Mobile First dizajna.

---

## 12. Marketplace Ready UI

Frontend arhitektura mora podržavati buduće marketplace funkcionalnosti.

Predviđene stranice: `/search`, `/business/{slug}`, `/categories`, `/map`, `/nearby`, `/business/{slug}/pricing`, `/business/{slug}/gallery`

Marketplace nije dio MVP verzije.

### 12.1 Geolocation Support

Frontend mora podržavati: pristup lokaciji korisnika, prikaz poslovnih subjekata u blizini, filtriranje po udaljenosti, prikaz lokacije na mapi.

Ove funkcionalnosti nisu dio MVP-a, ali arhitektura mora biti spremna za njihovu implementaciju.

---

## 13. Error Handling

Sve API greške moraju biti prikazane korisniku.

Primjeri: "Pogrešan email ili lozinka.", "Termin više nije dostupan.", "Nemate dozvolu za ovu akciju."

Nije dozvoljeno prikazivanje tehničkih grešaka korisnicima. Sistem mora koristiti centralizovani Error Handler.

---

## 14. Loading States

Sve stranice moraju imati: loading indikatore, empty state, error state.

Primjer: "Loading...", "Nema podataka.", "Došlo je do greške."

### 14.1 Empty States

Svaki modul mora imati prilagođene Empty State prikaze.

Primjeri: "Nema rezervacija.", "Nema zaposlenih.", "Nema usluga.", "Nema rezultata pretrage."

Empty State mora korisniku ponuditi narednu akciju.

---

## 15. Budući razvoj

Planirane nadogradnje: Android aplikacija, iOS aplikacija, Push notifikacije, Offline režim rada, Marketplace, Loyalty program, Online plaćanje, Partner program, Affiliate sistem, AI funkcionalnosti.

---

## 16. Zaključak

Frontend mora ostati: jednostavan, modularan, skalabilan, višejezičan, prilagođen budućim mobilnim aplikacijama, marketplace ready, multi-tenant ready, mobile first.

Svi novi moduli moraju pratiti ovu arhitekturu. Frontend mora biti usklađen sa Dokumentima 01, 02, 03, 04 i 06.

---

*Kraj dokumenta.*

