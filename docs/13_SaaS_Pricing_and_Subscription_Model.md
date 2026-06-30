# SmartBooking Platform — SaaS Pricing & Subscription Model

**Dokument:** 13 — SaaS Pricing & Subscription Model
**Verzija:** 1.0
**Status:** Final
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše model monetizacije SmartBooking platforme. Dokument određuje: pretplatne pakete, ograničenja paketa, trial period, nadogradnje paketa, buduće izvore prihoda, marketplace monetizaciju.

---

## 2. Poslovni model

SmartBooking koristi SaaS (Software as a Service) model. Korisnici plaćaju mjesečnu ili godišnju pretplatu za korištenje platforme.

Pretplata se naplaćuje po poslovnom subjektu (tenant-u). Jedan korisnik može imati više poslovnih subjekata. Svaki poslovni subjekt ima zasebnu pretplatu.

---

## 3. Cilj monetizacije

**Primarni cilj:** stabilan mjesečni prihod, predvidiv cashflow, jednostavan model naplate

**Sekundarni cilj:** marketplace prihodi, affiliate prihodi, premium funkcionalnosti

---

## 4. Trial Period

Svi novi poslovni subjekti dobijaju **14 dana besplatnog korištenja**.

Trial uključuje: sve funkcionalnosti Start paketa, bez potrebe za karticom.

Po isteku trial perioda: korisnik bira paket, ili račun postaje read-only.

---

## 5. Free Plan — UKINUT (odluka 28.06.2026.)

**ODLUKA:** Trajni besplatni plan je UKINUT. Razlog: identifikovano (28.06.2026.) da 78-80% salona u BiH ima samo jednog zaposlenog — trajni Free Plan sa limitom "1 zaposleni" bi pokrivao ogromnu većinu potencijalnog tržišta TRAJNO besplatno, bez finansijskog razloga da ikad prelaze na plaćeni paket. Vlasnik je eksplicitno odlučio: cilj je da SVAKI salon na kraju plaća nešto, makar simbolično.

**Zamjena:** Svi korisnici (nakon beta faze, vidi Dokument 17 i Release Checklist sekciju 5.2b za beta-specifične besplatne uslove) dobijaju 14-dnevni trial period (sekcija 4, ostaje nepromijenjeno), nakon čega MORAJU birati plaćeni paket ili nalog prelazi u read-only režim (sekcija 12, postojeća logika).

---

## 6. Struktura paketa — FINALNA ODLUKA (28.06.2026.)

**Nova struktura, zamjenjuje staru Starter/Business/Enterprise podjelu.** Razlog promjene: 78-80% salona u BiH ima samo jednog zaposlenog — potrebna je granularnija podjela koja hvata taj segment kao plaćajuće korisnike, umjesto da ih gura u (ukinuti) besplatni plan.

**Vlasnikova procjena: ~99% pretplata će biti Solo i Start paketi — tu treba usmjeriti najviše pažnje (marketing, onboarding, podrška), ne na Pro/Business koji će biti rijetki.**

**VAŽNA NAPOMENA — odluka 28.06.2026.:** Business paket se NEĆE posebno razvijati u ovoj ili sljedećoj fazi — pošto je "po dogovoru" cijena, Business korisnici (15+ zaposlenih, rijetki po procjeni vlasnika) dobijaju prilagođen pristup pojedinačno, ne kroz unaprijed definisan, fiksan set funkcionalnosti. Fokus razvoja ide na Solo/Start/Pro.

**TEHNIČKA NAPOMENA — odluka 28.06.2026.:** Razdvajanje funkcionalnosti ispod je POSLOVNA/MARKETINŠKA odluka (šta cjenovnik obećava). Trenutni kod NE PROVJERAVA kojem paketu tenant pripada — sve postojeće funkcionalnosti trenutno rade identično za sve, bez razlike u planu. Implementacija stvarnih provjera ("plan enforcement" — backend provjerava `tenant.subscription_plan` prije dozvoljavanja određene akcije) je POSEBNA, KASNIJA stavka, van obima ove sesije. Razdvajanje ispod služi kao plan za TU buduću implementaciju, i kao osnova za marketing/cjenovnik već sada.

### 6.1 Solo Plan — 14.90 KM/mjesečno

**Namjena:** Salon/obrt sa jednim zaposlenim (vlasnik radi sam) — najveći segment tržišta (78-80%).

**Limit:** 1 zaposleni, 1 lokacija.

**Uključuje (sve što je već izgrađeno u MVP-u, osnovni nivo):**
- Upravljanje zaposlenima, uslugama, klijentima (CRUD)
- Kalendar rezervacija (vizuelni, dnevni prikaz)
- Radno vrijeme
- Kreiranje, otkazivanje, završavanje rezervacija
- Osnovni dashboard (brojevi: zaposleni/usluge/klijenti/rezervacije)
- Neograničen broj rezervacija mjesečno

**NE uključuje:** email notifikacije, eksport podataka, izvještaje, naprednu pretragu, više lokacija.

### 6.2 Start Plan — 29.90 KM/mjesečno

**Namjena:** Mali saloni sa nekoliko zaposlenih.

**Limit:** 2-4 zaposlenih, 1 lokacija.

**Uključuje sve iz Solo, PLUS:**
- Email notifikacije (kad budu implementirane — vidi Release Checklist)

### 6.3 Pro Plan — 59.90 KM/mjesečno

**Namjena:** Srednji poslovni subjekti.

**Limit:** 5-15 zaposlenih, do 3 lokacije.

**Uključuje sve iz Start, PLUS:**
- Napredni dashboard
- Izvještaji i eksport podataka (Excel izvještaj — vidi Dokument 18, sekcija 2.3)
- Napredna pretraga
- Više lokacija (do 3)

### 6.4 Business Plan — Po dogovoru

**Namjena:** Veliki sistemi i lanci poslovnica.

**Limit:** 15+ zaposlenih, neograničen broj lokacija.

**Pristup:** Prilagođen pojedinačno (custom integracije, dedicated podrška, SLA ugovor) — NE razvija se kao unaprijed definisan, fiksan paket u ovoj/sljedećoj fazi (odluka 28.06.2026.).

---

## 7. Godišnja pretplata

Korisnici mogu odabrati: mjesečno plaćanje, godišnje plaćanje.

Godišnje plaćanje ostvaruje **20% popusta**.

Primjer (Solo): 14.90 KM × 12 = 178.80 KM mjesečno → 143 KM godišnje (20% popusta)
Primjer (Start): 29.90 KM × 12 = 358.80 KM mjesečno → 287 KM godišnje (20% popusta)

---

## 8. Pravila nadogradnje

Dozvoljeno: Solo → Start → Pro → Business (Free Plan ukinut, vidi sekciju 5 — korisnici ulaze direktno kroz 14-dnevni trial, pa biraju plaćeni paket)

Promjena paketa aktivira se odmah. Razlika u cijeni obračunava se proporcionalno.

---

## 9. Pravila smanjenja paketa

Downgrade je dozvoljen. Ako korisnik prelazi na manji paket, sistem mora provjeriti: broj zaposlenih, broj lokacija, aktivne funkcionalnosti.

Ako prelazi limite: downgrade nije dozvoljen dok se ne uskladi korištenje.

---

## 10. Suspendovanje pretplate

Ako pretplata istekne: rezervacije ostaju sačuvane, podaci ostaju sačuvani, kreiranje novih rezervacija se blokira, tenant prelazi u read-only režim.

Podaci se ne brišu.

---

## 11. Marketplace Monetizacija (V4+)

Marketplace nije dio MVP-a. Nakon implementacije marketplace-a mogući prihodi: premium pozicije u pretrazi, sponzorisani profili, marketplace provizije, oglašavanje.

---

## 12. Affiliate Program (V5+)

Partneri mogu preporučivati SmartBooking. Provizija: procenat od prve pretplate ili procenat tokom određenog perioda. Detalji će biti definisani posebnim dokumentom.

---

## 13. Partner Program

Predviđeni partneri: IT firme, marketinške agencije, web studiji, freelanceri.

Partner može dovoditi nove klijente na platformu.

---

## 14. Dodatni izvori prihoda

Planirani izvori prihoda: SMS krediti, premium izvještaji, AI funkcionalnosti, marketplace promocije, dodatni storage, API pristup, white-label licence.

---

## 15. KPI monetizacije

**Godina 1:** 100 aktivnih poslovnih subjekata, 20 plaćenih pretplata, validacija modela

**Godina 2:** 500 poslovnih subjekata, 200 plaćenih pretplata, pozitivan cashflow

**Godina 3:** regionalno širenje, marketplace prihodi

---

## 16. Buduće promjene cijena

Cijene paketa mogu se mijenjati.

**Pravilo:** Postojeći korisnici zadržavaju staru cijenu najmanje 12 mjeseci nakon promjene.

---

## 17. Poslovni cilj

Krajnji cilj nije samo prodaja softvera. Cilj je izgraditi: SaaS platformu, marketplace, ekosistem poslovnih subjekata i krajnjih korisnika na jedinstvenoj SmartBooking platformi.

---

## 18. Zaključak

Ovaj dokument definiše model monetizacije SmartBooking platforme. Svi budući sistemi za naplatu, pretplate, marketplace i affiliate funkcionalnosti moraju biti usklađeni sa ovim dokumentom.

---

*Kraj dokumenta.*
