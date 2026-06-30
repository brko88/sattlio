# SmartBooking Platform — Product Requirements Specification (PRS)

**Dokument:** 01 — Product Requirements Specification (PRS)
**Verzija:** 1.0
**Status:** FINAL
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše funkcionalne i nefunkcionalne zahtjeve SmartBooking platforme.

Svi razvojni timovi moraju koristiti ovaj dokument kao referencu prilikom implementacije sistema.

---

## 2. Opseg projekta (MVP)

Minimalna funkcionalna verzija (MVP) obuhvata sljedeće module:
- Registracija korisnika
- Prijava korisnika
- Upravljanje poslovnim profilom
- Upravljanje zaposlenima
- Upravljanje uslugama
- Upravljanje radnim vremenom
- Upravljanje rezervacijama
- Upravljanje klijentima
- Kalendar rezervacija
- Korisnički profil

Sve ostale funkcionalnosti planirane su za naredne verzije sistema.

---

## 3. Korisničke uloge

> **NAPOMENA:** SmartBooking koristi Single Account model. Jedan korisnik koristi jedan nalog za cijelu platformu. Jedan korisnik može imati više uloga u različitim poslovnim subjektima.

Primjer:
- Owner u jednom salonu
- Employee u drugom salonu
- Customer u trećem poslovnom subjektu

Role se dodjeljuju po poslovnom subjektu (tenant-u), a ne globalno na nivou korisnika.

### 3.1 Super Administrator

Odgovoran za upravljanje kompletnom platformom.

Ovlaštenja:
- pregled svih poslovnih subjekata
- upravljanje korisnicima
- upravljanje pretplatama
- pregled statistike
- blokiranje naloga
- upravljanje sistemskim postavkama

### 3.2 Vlasnik poslovnog subjekta

Predstavlja vlasnika ili odgovorno lice poslovnog subjekta.

Ovlaštenja:
- uređivanje poslovnog profila
- dodavanje zaposlenih
- uređivanje zaposlenih
- dodavanje usluga
- upravljanje radnim vremenom
- upravljanje rezervacijama
- pregled statistike
- upravljanje pretplatom

### 3.3 Zaposleni

Zaposleni može koristiti samo funkcije koje mu odobri vlasnik.

Moguća ovlaštenja:
- pregled vlastitog rasporeda
- pregled rezervacija
- potvrda dolaska klijenta
- završavanje rezervacije
- uređivanje vlastitog profila

### 3.4 Klijent

Klijent može rezervisati termin za sebe ili za drugu osobu.

Primjeri:
- roditelj za dijete
- sin za roditelja
- supružnik za supružnika

Sistem mora razlikovati:
- korisnika koji kreira rezervaciju
- osobu koja koristi uslugu

Krajnji korisnik platforme. Može:
- pregledati slobodne termine
- rezervisati termin
- pregledati vlastite rezervacije
- otkazati rezervaciju u skladu sa pravilima poslovnog subjekta
- uređivati vlastiti profil

---

## 4. Poslovni subjekt

Svaki poslovni subjekt mora sadržavati najmanje sljedeće informacije:
- naziv
- opis
- adresa
- grad
- država
- kontakt telefon
- email
- web stranica (opcionalno)
- logo (opcionalno)
- radno vrijeme
- vremenska zona
- valuta

Svaki poslovni subjekt može imati jednu ili više poslovnica. MVP podržava jednu poslovnicu. Arhitektura sistema mora podržavati više poslovnica bez izmjene baze podataka.

Marketplace profil poslovnog subjekta mora podržavati:
- galeriju fotografija
- cjenovnik usluga
- javni profil
- geolokaciju

---

## 5. Usluge

Svaki poslovni subjekt može definisati neograničen broj usluga.

Svaka usluga mora sadržavati:
- naziv
- opis
- trajanje
- cijenu
- boju prikaza u kalendaru
- status (aktivna/neaktivna)

---

## 6. Zaposleni

Svaki zaposleni mora sadržavati:
- ime
- prezime
- email
- broj telefona
- fotografiju (opcionalno)
- radno vrijeme
- status zaposlenja

Jedan zaposleni može obavljati više različitih usluga.

---

## 7. Klijenti

Svaki klijent mora sadržavati:
- ime
- prezime
- telefon
- email
- napomenu
- datum registracije

Historija rezervacija mora ostati trajno sačuvana.

Klijent može biti:
- registrovani korisnik platforme
- osoba za koju je rezervaciju napravio drugi korisnik

---

## 8. Rezervacije

Rezervacija mora sadržavati:
- poslovni subjekt
- zaposlenog
- klijenta
- uslugu
- datum
- vrijeme početka
- vrijeme završetka
- status
- napomenu

Mogući statusi:
- Kreirana
- Potvrđena
- Otkazana
- Završena
- Nedolazak

---

## 9. Pravila rezervacije

Sistem mora automatski provjeravati:
- preklapanje termina
- radno vrijeme zaposlenog
- radno vrijeme poslovnog subjekta
- trajanje usluge
- dostupnost zaposlenog

Nije dozvoljeno kreirati rezervaciju koja krši navedena pravila.

---

## 10. Kalendar

Sistem mora omogućiti prikaz:
- dnevnog rasporeda
- sedmičnog rasporeda
- mjesečnog rasporeda

Rezervacije moraju biti prikazane različitim bojama prema usluzi ili statusu.

---

## 11. Pretraga

Sistem mora omogućiti pretragu po:
- imenu klijenta
- broju telefona
- email adresi
- nazivu usluge
- zaposlenom
- datumu rezervacije
- gradu
- kategoriji
- lokaciji korisnika
- udaljenosti
- cijeni
- ocjeni
- dostupnosti

---

## 12. Notifikacije

**MVP:**
- potvrda registracije putem emaila
- email verifikacija korisnika
- potvrda rezervacije putem emaila

**Buduće verzije:**
- SMS verifikacija
- SMS podsjetnici
- Push notifikacije

---

## 13. Korisnički profil

Svaki korisnik može:
- promijeniti ime
- promijeniti email
- promijeniti lozinku
- promijeniti profilnu fotografiju

---

## 14. Sigurnost

Sistem mora koristiti:
- autentifikaciju korisnika
- autorizaciju prema ulozi
- šifrovane lozinke
- HTTPS komunikaciju
- zaštitu od neovlaštenog pristupa
- rate limiting
- audit log
- brute force zaštitu

---

## 15. Performanse

Sistem mora omogućiti:
- brzo učitavanje stranica
- stabilan rad sa velikim brojem rezervacija
- mogućnost horizontalnog skaliranja

---

## 16. Nefunkcionalni zahtjevi

Platforma mora biti:
- responzivna
- dostupna 24/7
- jednostavna za korištenje
- proširiva
- modularna
- sigurna
- lako održiva
- više jezika (i18n)
- više valuta
- podrška za više poslovnica

---

## 17. Funkcionalnosti koje nisu dio MVP-a

Sljedeće funkcionalnosti planirane su za naredne verzije:
- online plaćanje
- AI asistent
- marketplace
- više poslovnica
- loyalty program
- poklon kartice
- kuponi
- fiskalni računi
- SMS podsjetnici
- Push notifikacije
- video konsultacije
- API za treće strane
- Partner program
- affiliate sistem
- trust score
- no-show sistem
- javni roadmap
- feature voting
- integracija sa Google Calendar
- integracija sa Outlook Calendar
- integracija sa Apple Calendar

---

## 18. Strategija širenja platforme

**Godina 1 — Beauty & Wellness**
frizerski saloni, barber saloni, kozmetički saloni, masažni studiji

**Godina 2 — Services**
automehaničari, vulkanizeri, servisi računara, servisi mobilnih telefona

**Godina 3 — Health**
stomatolozi, fizioterapeuti, privatne ordinacije

**Godina 4 — Marketplace**
objedinjavanje svih kategorija, pretraga po lokaciji, javni profili poslovnih subjekata

---

## 19. Kriterijumi prihvatanja MVP-a

MVP se smatra završenim kada korisnik može:

1. Registrovati nalog
2. Kreirati poslovni profil
3. Dodati zaposlenog
4. Dodati uslugu
5. Definisati radno vrijeme
6. Dodati klijenta
7. Kreirati rezervaciju
8. Pregledati kalendar
9. Urediti ili otkazati rezervaciju
10. Odjaviti se iz sistema

---

*Kraj dokumenta.*
