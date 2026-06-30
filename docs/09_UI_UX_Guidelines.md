# SmartBooking Platform — UI/UX Guidelines

**Dokument:** 09 — UI/UX Guidelines
**Verzija:** 1.0
**Status:** Final
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše vizuelni identitet, korisničko iskustvo i pravila dizajna SmartBooking platforme. Cilj je osigurati: konzistentan izgled svih modula, brzo izvršavanje svakodnevnih zadataka, jednostavno korištenje za netehničke korisnike, podršku za više jezika, podršku za buduće mobilne aplikacije, spremnost za marketplace funkcionalnosti.

---

## 2. Dizajnerski principi

SmartBooking mora biti: jednostavan, brz, pregledan, profesionalan, moderan, prilagođen radu tokom cijelog dana, prilagođen mobilnim uređajima, fokusiran na produktivnost.

---

## 3. Dizajn filozofija

**Inspiracija:** Booksy, Stripe Dashboard, Linear, Notion

**Osnovni cilj:** Korisnik mora moći kreirati termin za manje od 15 sekundi.

**Sekundarni cilj:** Najčešće korištene funkcije moraju biti dostupne u maksimalno dva klika.

---

## 4. Boje

| Namjena | Boja |
|---|---|
| Primarna (dugmad, linkovi, fokus) | `#2563EB` |
| Success | `#16A34A` |
| Warning | `#F59E0B` |
| Danger | `#DC2626` |
| Neutral | `#F8FAFC`, `#E2E8F0`, `#64748B`, `#0F172A` |

---

## 5. Tipografija

Primarni font: **Inter**
Fallback: Arial, sans-serif

Pravila: maksimalno 3 nivoa naslova, čitljivost ima prednost nad stilizacijom, izbjegavati previše različitih veličina fonta.

---

## 6. Layout

**Desktop:** Sidebar 260px, Topbar 64px, Content fluid width

**Tablet:** Kolapsibilni sidebar, prilagodljivi grid sistem

**Mobile:** Hamburger menu, Bottom actions, Full width sadržaj, Sticky akcije za najvažnije funkcije

---

## 7. Dugmad

| Tip | Koristi se za |
|---|---|
| Primary | Save, Create, Confirm, Book Appointment |
| Secondary | Edit, View, Details |
| Danger | Delete, Cancel, Remove |

**Pravilo:** Na jednoj stranici smije postojati samo jedno dominantno Primary dugme.

---

## 8. Forme

Svaka forma mora imati: label, placeholder, validation message, required indicator, success feedback.

---

## 9. Tabele

Podržavaju: sortiranje, pretragu, paginaciju, filtere.

Obavezne kolone: ID, Naziv, Status, Akcije

---

## 10. Dashboard

Dashboard mora prikazivati najvažnije informacije odmah nakon prijave.

**Owner Dashboard:** broj rezervacija danas, broj rezervacija ove sedmice, broj klijenata, prihod, aktivne zaposlenike, predstojeće termine

**Employee Dashboard:** današnji raspored, sljedeći termin, broj termina danas, vlastite statistike

**Customer Dashboard:** naredne rezervacije, historija rezervacija, omiljeni poslovni subjekti, brza rezervacija

---

## 11. Kalendar

Podržani prikazi: Day, Week, Month

Svaki termin mora imati: boju, ime klijenta, uslugu, vrijeme, zaposlenog, lokaciju (ako postoji više lokacija)

Kalendar mora podržavati: drag & drop pomjeranje termina, brzo kreiranje termina, filtriranje po zaposlenom, filtriranje po lokaciji, filtriranje po usluzi.

---

## 12. Status boje rezervacija

| Status | Boja |
|---|---|
| Confirmed | Green |
| Cancelled | Red |
| Pending | Orange |
| Completed | Blue |
| No Show | Gray |

---

## 13. Ikonice

Biblioteka: Lucide React

Pravila: koristiti jednostavne ikonice, izbjegavati dekorativne ikonice, ikonice moraju imati tooltip.

---

## 14. Responsive pravila

| Uređaj | Širina |
|---|---|
| Desktop | 1200px+ |
| Tablet | 768px – 1199px |
| Mobile | 320px – 767px |

**Mobile First pravilo:** Sve nove funkcionalnosti moraju biti dizajnirane prvo za mobilni prikaz, a zatim za desktop.

---

## 15. Dark Mode

Nije dio MVP-a. Planirano za verziju 2.

Arhitektura CSS-a mora omogućiti jednostavno dodavanje Dark Mode funkcionalnosti bez velikih izmjena postojećeg UI-a.

---

## 16. Accessibility

Minimalni zahtjevi: kontrast WCAG AA, keyboard navigation, fokus indikatori, podrška za screen reader, jasno označena validaciona stanja.

---

## 17. Loading stanja

Koristiti: skeleton loading, spinner samo za kratke akcije.

Pravila: korisnik uvijek mora imati vizuelni feedback, izbjegavati prazne ekrane tokom učitavanja.

---

## 18. Error stanja

Prikazivati: jasan razlog greške, prijedlog rješenja, kontakt podrške (kasnije).

Nije dozvoljeno: prikazivanje stack trace grešaka, prikazivanje tehničkih detalja korisnicima.

---

## 19. Toast notifikacije

Koristiti za: uspješno snimanje, uspješnu rezervaciju, greške sistema, uspješno brisanje, uspješnu prijavu.

---

## 20. Marketplace Ready UI

Frontend mora biti spreman za buduće marketplace funkcionalnosti.

Planirane stranice: `/search`, `/business/{slug}`, `/categories`, `/map`

Marketplace profil poslovnog subjekta mora podržavati: logo, galeriju, opis, lokacije, radno vrijeme, usluge, cjenovnik, ocjene korisnika.

---

## 21. Multi-Location UI

Ako poslovni subjekt ima više lokacija, korisnik mora moći: odabrati lokaciju prije rezervacije, filtrirati termine po lokaciji, pregledati raspored po lokaciji.

---

## 22. Internacionalizacija (i18n)

UI mora podržavati: Bosanski, Engleski
Planirani jezici: Hrvatski, Srpski, Njemački

Nije dozvoljeno hardkodiranje tekstova. Primjer: ne koristiti `"Sačuvaj"`, koristiti `common.save`

---

## 23. Zaključak

UI mora favorizovati brzinu rada nad vizuelnim efektima.

Prioritet je: produktivnost korisnika, jednostavnost korištenja, responzivnost, višejezičnost, marketplace spremnost, skalabilnost dizajna.

Svi novi moduli moraju pratiti ova pravila kako bi SmartBooking zadržao konzistentan korisnički doživljaj.

---

*Kraj dokumenta.*
