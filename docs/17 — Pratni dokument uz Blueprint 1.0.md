# SmartBooking Platform — Akvizicija Prvih Korisnika & Analitika

**Dokument:** 17 — Pratni dokument uz Blueprint 1.0
**Verzija:** 1.0
**Datum:** 25.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument zapisuje odluke o tome kako doći do prvih korisnika (Dokument 00, "Success Definition" — 10 aktivnih poslovnih subjekata) i kada/kako uvesti analitiku. Ne mijenja arhitekturu ni kod — samo bilježi poslovne odluke za kasniju fazu (negdje oko kraja Faze C / početka Faze D, vidi Dokument 15).

---

## 2. Akvizicija prvih korisnika

### 2.1 Zašto cold email nije prvi izbor

- Mali saloni u regiji rijetko imaju poslovni email koji redovno provjeravaju (često lični Gmail, ili nema email javno naveden)
- B2B cold email za male biznise ima nisku stopu odgovora — konkurencija od marketing agencija/POS sistema koji rade isto
- Booking sistem se teško "objašnjava" u mailu — treba se vidjeti da bi se shvatila vrijednost

### 2.2 Preporučeni kanali (bez fizičkog "hodanja od vrata do vrata")

1. **Facebook/Instagram direktne poruke** — saloni su tamo aktivniji nego na emailu
2. **Poznanici/preporuke** — početi sa jednim poznatim salonom (prijatelj, porodica, lični frizer), besplatno, u zamjenu za feedback i dozvolu korištenja kao referencu
3. **Facebook grupe lokalnih biznisa/frizera** — regionalne grupe gdje se može predstaviti alat
4. **Email kao drugi korak** — nakon 1-2 zadovoljna korisnika, sa "case study" materijalom, ne kao prvi potez

### 2.3 Model za prve korisnike — besplatno bez vremenskog ograničenja

Odluka: za prvih ~5-10 salona (cilj iz Dokumenta 00), umjesto standardnog 14-dnevnog trial-a (Dokument 13, sekcija 4), ponuditi **potpuno besplatan, neograničen pristup** dok se proizvod validira.

**Razlog:** U fazi validacije, prioritet nije prihod već provjera da li se alat stvarno svakodnevno koristi i otkrivanje needs/bagova koji nisu predviđeni. Naplata u ovoj fazi rizikuje gubitak potencijalnih prvih korisnika zbog 50-100 KM, kad je vrijednost dobijenog feedbacka veća od tog iznosa.

**Nakon validacije:** Standardni plaćeni model (Dokument 13) se primjenjuje na nove korisnike. Prvih nekoliko early adopter salona mogu ostati besplatni doživotno kao gest zahvalnosti — ovo je i dobar marketing potez (izvor usmene preporuke).

---

## 3. Analitika

### 3.1 Web analitika (posjete sajtu)

**Alat:** Google Analytics, ili privatnija/GDPR-friendly alternativa (Plausible, Umami)

**Implementacija:** Mali script tag u `index.html` frontend-a — nekoliko minuta posla, ne zahtijeva izmjenu backend-a

**Kada uvesti:** Kad sajt postane javno dostupan (oko kraja Faze C / početka Faze D, prema Dokumentu 15) — nema smisla ranije, dok nema posjeta za mjerenje.

### 3.2 Poslovna/interna statistika (super admin dashboard)

Ovo je **već planirano** u postojećim dokumentima:
- Dokument 01, sekcija 3.1 — Super Administrator treba "pregled statistike sistema"
- Dokument 12, V7 — "Napredna analitika" kao posebna faza (KPI dashboard, prihod po zaposlenom/lokaciji, analiza otkazivanja, itd.)

**Implementacija:** Ne treba novi alat — gradi se iz postojećih podataka u bazi (broj redova u `tenants`, `appointments`, `users`, itd.), kroz nove API rute i UI ekran.

**Kada uvesti:** Kasnije, kad postoje realni podaci da se prikažu (prazan dashboard sa nulama nema svrhu sad).

---

## 4. Zaključak

Akvizicija prvih korisnika ide kroz lične/društvene kanale (Facebook, poznanstva), ne cold email ili fizički obilazak. Prvi saloni dobijaju besplatan pristup bez vremenskog ograničenja dok se proizvod validira; standardni plaćeni model (Dokument 13) počinje da se primjenjuje na nove korisnike nakon te faze. Web analitika (Google Analytics/Plausible) se dodaje kad sajt postane javan; interna poslovna statistika gradi se kasnije, prema Dokumentu 12 (V7).

---

*Kraj dokumenta.*
