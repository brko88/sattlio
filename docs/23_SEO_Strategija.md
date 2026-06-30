# SmartBooking (Sattlio) — SEO Strategija

**Dokument:** 23 — Pratni dokument uz Blueprint 1.0
**Verzija:** 1.0
**Datum:** 28.06.2026.

---

## 1. Svrha dokumenta

Zapisuje plan za SEO (Search Engine Optimization) vidljivost platforme, sa naglaskom da SEO **stvarno** postaje vrijedan tek kad postoje **javne** stranice za indeksiranje (Marketplace faza, Dokument 12 V4) — ne prije.

**Ključan zaključak:** Dok je platforma isključivo "iza login-a" (trenutno stanje, juni 2026), SEO nema mnogo smisla primjenjivati, jer nema šta javno da se indeksira. Najveći SEO rad dolazi prirodno povezan sa Marketplace fazom.

---

## 2. Tehnička osnova — MORA postojati prije lansiranja javnih stranica

### 2.1 Meta tagovi po stranici (title, description)

Trenutni React SPA frontend vjerovatno ima jedan generički `<title>` u `index.html`, ne dinamičan po stranici. Svaka javna stranica (npr. profil salona) treba svoj title/description, relevantan toj konkretnoj stranici (npr. "Salon Maja — Frizerski salon Banja Luka | Sattlio").

### 2.2 Server-side rendering ili pre-rendering za JAVNE stranice

**Bitna tehnička nijansa:** React SPA standardno renderuje sadržaj u browseru (JavaScript), ne na serveru. Google bot može, ali ne mora savršeno "vidjeti" sadržaj koji se renderuje samo client-side. Za javne stranice (profil salona) koje TREBAJU biti indeksirane, vrijedi razmotriti:
- Next.js (React framework sa server-side rendering) za te specifične, javne rute
- ILI statički generisane stranice (pre-rendered HTML) za profile salona
- NE treba SSR za cijelu app — Dashboard/Kalendar/CRUD stranice su iza login-a, SEO im ne treba

### 2.3 `robots.txt` i `sitemap.xml`

Standardni fajlovi koji govore Google-u šta indeksirati. `robots.txt` treba blokirati Dashboard/Login/sve "iza login-a" rute. `sitemap.xml` treba listati SVE javne profile salona (generisan dinamički, ažurira se kad se novi salon registruje).

---

## 3. Sadržajna strana — gdje SEO STVARNO dolazi

### 3.1 Javni profil salona = SEO "zlatni rudnik" (vezano za Dokument 12, V4 Marketplace)

Kad Marketplace bude implementiran, svaki salon dobija svoju javnu stranicu (npr. `sattlio.com/salon-maja`). Ovo su stranice koje Google indeksira — ne glavna landing stranica platforme. Što više salona se registruje, više "indeksiranih stranica" postoji — organski rastući SEO efekat. Svaki novi salon dodaje SEO vrijednost cijeloj platformi, ne samo sebi.

**Implikacija za prioritet:** SEO strategija prirodno postaje relevantna ISTOVREMENO sa Marketplace fazom (V4), ne prije. Vidi Dokument 14 za pozicioniranje u redoslijedu.

### 3.2 Blog/sadržaj na glavnom sajtu

Članci ("Kako organizovati raspored u frizerskom salonu", "5 razloga zašto vam treba booking sistem") privlače organski saobraćaj kroz pretrage koje rade vlasnici salona ("kako da..." pretrage), prije nego što znaju da Sattlio postoji. Ovo je nezavisno od Marketplace faze — može se početi ranije, ali zahtijeva redovnu produkciju sadržaja (vrijeme/resurs koji treba planirati).

### 3.3 Lokalni SEO (BiH specifično)

- Google Business Profile (besplatan, registruje se direktno kod Google-a) za platformu
- Poticanje salona da u SVOM Google Business Profile-u spomenu "rezervacije kroz Sattlio" — lokalna pretraga ("frizer Banja Luka") vodi korisnike ka salonima koji koriste platformu, indirektan ali stvaran SEO efekat

---

## 4. Zaključak i redoslijed

SEO infrastruktura (meta tagovi, SSR/pre-rendering, sitemap) treba biti spremna ISTOVREMENO sa implementacijom Marketplace/javnih profila salona (Dokument 12, V4) — ne prije, jer prije toga nema javnog sadržaja za indeksiranje. Blog/sadržajna strategija (3.2) i lokalni SEO (3.3) mogu početi ranije, nezavisno, ali zahtijevaju kontinuiran rad (ne jednokratan tehnički zadatak kao 2.1-2.3).

---

*Kraj dokumenta.*
