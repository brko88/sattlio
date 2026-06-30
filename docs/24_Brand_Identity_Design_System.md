# Dokument 24 — Brand Identity & Design System

**SmartBooking Platform (radni naziv) / Sattlio (predloženo finalno ime)**
**Verzija:** 1.0
**Datum:** 28.06.2026.

---

## NAPOMENA — odluke donesene 28.06.2026.

- **Ime:** "Sattlio" je predloženo kao finalno ime (vlasnik je još odlučivao u trenutku pisanja ovog dokumenta). Kad se ime finalno potvrdi, ažurirati sve referencu na "SmartBooking" kroz ovaj i ostale dokumente.
- **Paleta:** Od tri predložene opcije (Moj favorit / Premium / Moderna), vlasnik je odabrao **Opciju 1** — primarna `#2563EB` (Blue 600), sekundarna `#1E293B` (Slate 800). Ovo je odlična vijest tehnički: ove vrijednosti su IDENTIČNE postojećem Tailwind sistemu koji se već koristi u frontend kodu — promjena boje je minimalna/nepotrebna, već usklađeno.
- **VAŽNO RAZJAŠNJENJE — Logo "tamna i svijetla verzija" (sekcija 14) NIJE dark mode toggle.** Vlasnik je eksplicitno potvrdio da se NE traži funkcionalan dark/light mode toggle za korisnika (korisnik bira temu) — sekcija 14 govori o LOGO FAJLU koji postoji u dvije verzije (za upotrebu na tamnoj vs. svijetloj pozadini, npr. svijetla verzija loga na tamnom sidebar-u), ne o promjenjivoj temi cijele aplikacije. Ovo ostaje van obima za sada.
- **Veza sa responsive sesijom (Dokument 14, v1.1a):** Sekcija 13 ovog dokumenta (Desktop ≥1280px, Tablet 768-1279px, Mobile ≤767px, "sidebar prelazi u hamburger meni") treba biti EKSPLICITAN standard kojem se responsive sesija pridržava — ne izmišljati nove breakpoint-e, koristiti ove.
- **Veza sa kalendarom:** Sekcija 12 definiše boje statusa (Scheduled=Blue, Confirmed=Green, Completed=Gray, Cancelled=Red, No Show=Orange) — provjeriti i uskladiti sa postojećim `STATUS_COLORS` u `Calendar.tsx` kad se naredni put radi na kalendaru.

---

# 1. Svrha dokumenta

Ovaj dokument definiše vizuelni identitet SmartBooking platforme.

Cilj je da:

* web aplikacija
* Android aplikacija
* iOS aplikacija
* marketing materijali
* landing stranica
* društvene mreže

koriste isti vizuelni stil.

---

# 2. Brand vrijednosti

SmartBooking treba da ostavi utisak:

* Profesionalan
* Moderan
* Jednostavan
* Pouzdan
* Brz
* Siguran

Korisnik treba da ima osjećaj:

> "Sve je jednostavno. Samo otvorim aplikaciju i rezervišem termin."

---

# 3. Ton komunikacije

Komunikacija treba biti:

* prijateljska
* jednostavna
* profesionalna
* bez tehničkog žargona

Primjeri:

✔ Rezervacija uspješno kreirana.

✔ Termin je otkazan.

✔ Dobrodošli nazad.

Ne koristiti:

❌ Exception

❌ Internal Error

❌ Stack Trace

---

# 4. Primarne boje

Primary

```
Blue 600

#2563EB
```

Koristi se za:

* dugmad
* linkove
* aktivne elemente
* ikonice

---

Secondary

```
Slate 800

#1E293B
```

Koristi se za:

* sidebar
* zaglavlja
* tamne kartice

---

Success

```
#22C55E
```

---

Warning

```
#F59E0B
```

---

Danger

```
#EF4444
```

---

Background

```
#F8FAFC
```

---

Cards

```
#FFFFFF
```

---

Borders

```
#E2E8F0
```

---

# 5. Tipografija

Font:

```
Inter
```

Fallback:

```
sans-serif
```

---

Naslovi

```
32 px

Bold
```

---

Sekcije

```
24 px

SemiBold
```

---

Tekst

```
16 px

Regular
```

---

Sitni tekst

```
14 px
```

---

# 6. Ikonice

Koristiti:

Heroicons

ili

Lucide Icons

Ne miješati više biblioteka.

---

# 7. Dugmad

Primary

* Blue 600
* White text

---

Secondary

* White
* Slate border

---

Danger

* Red

---

Disabled

* Gray

---

# 8. Kartice

Za sve kartice koristiti:

* Border Radius 12 px
* Shadow sm
* White background

---

# 9. Forme

Sva polja imaju:

* isti radius
* isti padding
* isti fokus

Focus:

Blue 600 outline

---

# 10. Sidebar

Tamni:

Slate 800

Aktivna stavka:

Blue 600

---

# 11. Dashboard

Kartice:

* Broj rezervacija
* Broj zaposlenih
* Broj usluga
* Broj klijenata

Sve kartice iste visine.

---

# 12. Kalendar

Statusi:

Scheduled

Blue

Confirmed

Green

Completed

Gray

Cancelled

Red

No Show

Orange

---

# 13. Responsive Design

Desktop

≥1280 px

---

Tablet

768–1279 px

---

Mobile

≤767 px

Sidebar prelazi u hamburger meni.

---

# 14. Logo

Minimalistički.

Bez sjena.

Bez 3D efekata.

SVG format.

Tamna i svijetla verzija.

Favicon 32x32.

---

# 15. Animacije

Koristiti umjereno.

Trajanje:

150–250 ms

Ne koristiti duge animacije.

---

# 16. Pristupačnost (Accessibility)

Minimalni kontrast:

WCAG AA

Sve forme dostupne tastaturom.

Visible focus state.

---

# 17. Buduće mobilne aplikacije

Android i iOS koriste isti:

* font
* boje
* ikonice
* raspored

Kako bi korisnik odmah prepoznao SmartBooking.

---

# 18. Marketing identitet

Koristiti iste boje na:

* Facebook
* Instagram
* LinkedIn
* Landing stranici
* Email šablonima

---

# 19. Pravila za budući razvoj

Nova stranica se ne implementira dok:

* koristi definisane boje
* koristi definisane komponente
* koristi definisanu tipografiju
* koristi isti spacing sistem

Time se osigurava konzistentan izgled cijele platforme.

---

# 20. Status dokumenta

Status:

**AKTIVAN**

Primjenjuje se na:

* Web aplikaciju
* Android aplikaciju
* iOS aplikaciju
* Administratorski panel
* Marketing materijale
* Dokumentaciju sa screenshotovima
