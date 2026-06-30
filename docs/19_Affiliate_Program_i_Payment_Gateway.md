# SmartBooking Platform — Affiliate Program & Payment Gateway Plan

**Dokument:** 19 — Pratni dokument uz Blueprint 1.0
**Verzija:** 1.0
**Datum:** 26.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument zapisuje dvije odluke donesene tokom razvojne sesije: uvođenje affiliate/referral programa kao primarne akvizicijske strategije, i potrebu za payment gateway integracijom za naplatu pretplate karticom. Obje su planirane za uvođenje u MVP, ne kao daleka V2 stavka.

**Razlog uvođenja affiliate sistema:** Vlasnik platforme je u fazi razvoja, ne prodaje — nema vremena da fizički obilazi salone. Affiliate partneri (osobe koje već poznaju industriju/salone) mogu postići brže rezultate kroz postojeće kontakte.

**Razlog uvođenja payment gateway-a:** Ručno prikupljanje uplata (gotovina, fizički obilazak) ne skalira i nepotrebno troši vrijeme vlasnika koje je vrjednije utrošeno na razvoj proizvoda.

---

## 2. Affiliate / Referral Program

### 2.1 Osnovni mehanizam

Partner dovodi novi salon na platformu putem referral linka. Kad dovedeni salon plati pretplatu, partner dobija nagradu.

### 2.2 Otvoreno pitanje — struktura nagrade (VAŽNA ODLUKA PRIJE IMPLEMENTACIJE)

**Originalni prijedlog:** Partner dobija 100% iznosa prve mjesečne uplate (npr. cijeli iznos od 39.90 KM).

**Rizik ovog pristupa:** Platforma ne ostvaruje nikakav prihod od korisnika u prvom mjesecu, isključivo trošak. Ako korisnik otkaže nakon prvog mjeseca, platforma je platila affiliate-u bez ikakvog povrata.

**Preporučena alternativa za razmatranje:** Trajni postotak (npr. 30-50%) od svake uplate, ne samo prve. Ovo:
- Daje partneru trajan interes da korisnik OSTANE pretplaćen, ne samo da bude "ubačen" jednom
- Obezbjeđuje platformi prihod od prvog mjeseca
- Usklađeno je sa Dokumentom 13, sekcija 14, koji već predviđa "procenat tokom određenog perioda" kao opciju

**Hibridna opcija (kompromis):** 100% prve uplate važi kao agresivna, vremenski ograničena promocija (npr. "za prvih 20 dovedenih salona"), nakon čega se prelazi na trajni manji postotak za nove partnere.

**ODLUKA NIJE FINALNA — vlasnik treba odlučiti konkretan model prije implementacije koda.**

### 2.3 Nivoi partnerstva

| Nivo | Broj dovedenih salona |
|---|---|
| Srebro | 1–5 |
| Gold | 6–50 |
| Platinum | 50+ |

**Otvoreno pitanje:** Da li nivo donosi veću nagradu (veći %/iznos) ili samo status/titulu — treba odlučiti prije implementacije.

### 2.4 Tehnička implementacija (skica za kasnije)

Nove tabele potrebne:
- `affiliate_partners` (`user_id` ili poseban identitet, `referral_code`, `tier`, `created_at`)
- `referrals` (`partner_id`, `referred_tenant_id`, `status`, `reward_amount`, `paid_at`)

Ne zahtijeva izmjenu postojeće arhitekture — uklapa se kao novi modul, slično loyalty sistemu razmatranom ranije u sesijama (Dokument 15, sekcija 7).

---

## 3. Payment Gateway — naplata pretplate karticom

### 3.1 Ključni nalaz — Stripe NIJE dostupan za Bosnu i Hercegovinu (direktno)

Provjereno pretragom: Stripe trenutno podržava 46 zemalja, i Bosna i Hercegovina nije među njima kao zemlja gdje se firma može registrovati za primanje uplata. Zaobilazno rješenje (formiranje američke LLC kompanije + EIN broj) je nepraktično i preskupo za ovu fazu.

### 3.2 NOVI PRAVAC — Merchant of Record (MoR) platforme: PREPORUČENO RJEŠENJE

Nakon dodatnog istraživanja (26.06.2026), identifikovan je bolji pristup od direktnih payment gateway provajdera (CorvusPay/WSPay), koji traže registrovanu firmu i/ili imaju aktivacijske troškove (~380 KM/EUR kod Monri WSPay).

**Šta je Merchant of Record:** Kod standardnog payment processora (Stripe, CorvusPay), TI si zakonski "prodavac" — odgovoran za porez, chargeback-ove, subscription logiku u svakoj jurisdikciji. Kod MoR platforme, **ONI** postaju zakonski prodavac — kupac kupuje od MoR platforme, ne direktno od tebe. Oni naplaćuju, obračunavaju/plaćaju porez, preuzimaju chargeback rizik, i isplaćuju tebi neto iznos nakon naknade.

**Potvrđeno (direktno iz zvanične dokumentacije, 26.06.2026):** **Lemon Squeezy podržava Bosnu i Hercegovinu** na listi zemalja za bankovne isplate (bank payouts) — bez potrebe za registrovanom firmom na način koji domaći payment gateway-i traže.

**Opcije i poređenje:**

| Platforma | Naknada | Napomene |
|---|---|---|
| **Lemon Squeezy** | 5% + $0.50 (+1.5% za internacionalne uplate) | Brz setup (manje od sata), ali od akvizicije Stripe-om (2024) ima operativne incidente (npr. maj 2026 — greškom masovno otkazani subscription-i kod jednog korisnika) i nesigurnu budućnost brenda |
| **Paddle** | 5% + $0.50, all-in (nema dodatnih naknada za internacionalne kartice/subscription-e) | Od 2012, "enterprise-grade", dulji track record, bez poznatih sličnih incidenata; treba provjeriti BiH na njihovoj listi direktno |
| **CorvusPay** | Niža naknada (tipičan payment processor) | Zahtijeva registrovanu firmu u BiH/Hrvatskoj/Srbiji/EU |
| **Monri WSPay** | Niža naknada | Zahtijeva aktivacijsku naknadu ~380 KM/EUR u roku 5 dana od aktivacije |

**Preporuka:** Krenuti sa **Lemon Squeezy ili Paddle** kao primarno rješenje — rješava problem odsustva registrovane firme, omogućava brz start. CorvusPay/WSPay ostaju kao buduća opcija ako MoR naknada (5%+) postane preskupa na većem obimu transakcija (npr. nakon 50+ plaćajućih salona, kad uštede od niže naknade prevagnu nad administrativnim teretom firme).

**Sljedeći konkretan korak:** Registrovati probni Lemon Squeezy nalog i provjeriti kompletan onboarding proces uživo (identitetska verifikacija, povezivanje bosanskog bankovnog računa) — dokumentacija potvrđuje podršku, ali stvarna registracija će potvrditi praktične detalje.

### 3.3 Stara opcija — direktni payment gateway (CorvusPay/Monri WSPay)

Ostaje zapisano kao alternativa, vidi tabelu u sekciji 3.2 za poređenje.

### 3.3 Sljedeći konkretan korak (akcija za vlasnika, ne za Claude)

Direktan kontakt sa CorvusPay i/ili Monri WSPay radi provjere:
- Cijena integracije (jednokratna i mjesečna naknada)
- Vrijeme potrebno za odobravanje ugovora
- Tehnička dokumentacija za integraciju (API, webhook-ovi za potvrdu uplate)
- Da li podržavaju rekurentno plaćanje (automatska mjesečna naplata pretplate) ili samo jednokratne transakcije

### 3.4 Tehnička implementacija (skica za kasnije, nakon odabira providera)

- Nova tabela `subscriptions` (`tenant_id`, `plan`, `status`, `current_period_end`, `payment_provider_reference`)
- Webhook endpoint koji prima potvrdu uplate od providera i ažurira status pretplate
- Integracija sa postojećim Dokumentom 13 (SaaS Pricing) — trial period, planovi, downgrade/upgrade logika

---

## 4. Veza sa postojećom dokumentacijom

- Affiliate program nadograđuje Dokument 00 (sekcija "Affiliate Vision") i Dokument 12 (V5 — Marketing alati)
- Payment gateway nadograđuje Dokument 12 (V2 — Monetizacija) i Dokument 13 (SaaS Pricing & Subscription Model)
- Oba su pomjerena ranije u prioritetu nego što su originalni dokumenti predviđali (V2/V5 su daleke faze) — vlasnik je odlučio da su ovo MVP-kritične funkcije, ne daleka budućnost, zbog operativne nužnosti (nedostatak vremena za ručnu prodaju i naplatu)

---

## 5. Zaključak

Obje funkcionalnosti su validne i tehnički izvodljive bez redizajna postojeće arhitekture. Affiliate program zahtijeva prije svega **poslovnu odluku** o strukturi nagrade (sekcija 2.2) prije pisanja koda. Payment gateway zahtijeva **direktan kontakt sa providerom** (CorvusPay ili WSPay) prije tehničke integracije, pošto Stripe nije opcija za bosansko tržište.

---

*Kraj dokumenta.*
