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

**POTVRĐENO 29.06.2026. — DIREKTAN ODGOVOR OD PADDLE (Femi, Paddle support):**
- BiH je podržana zemlja, potvrđeno direktno
- Registracija kao "Individual" (sole trader) — NE treba registrovana firma, bira se "Individual" business type pri sign-up-u
- Verifikacioni proces: Domain Review (provjera web sajta) + Identity Verification (Onfido — lična karta + video selfie) + Final review od strane Paddle tima — **NIJE trenutno, zahtijeva FUNKCIONALAN, JAVNO DOSTUPAN web sajt PRIJE prijave**
- Podržava recurring mjesečne pretplate sa automatskom naplatom
- Podržava free trial period (buyer unosi karticu, ne naplaćuje se do kraja trial-a) — direktno se uklapa sa postojećim 14-dnevnim trial periodom (sekcija 4)
- Webhook/notifications sistem za sinhronizaciju statusa pretplate — koristiti za `subscriptions` tabelu (sekcija 3.4 tehničke skice)
- Naknada: 5% + $0.50 po transakciji, BEZ dodatnih mjesečnih/godišnjih troškova
- Podržani payment metodi: Google/Apple Pay, kartice, UPI, MB WAY, Naver Pay
- Postoji Sandbox environment za testiranje prije produkcije
- **VAŽNO: Paddle NEMA ugrađenu podršku za affiliate/partner programe** — afiliate praćenje (Dokument 19, sekcija 2) mora biti CUSTOM implementacija, vlasnik sam gradi tu logiku iznad Paddle integracije, ne dolazi gotova

**Implikacija za redoslijed:** Pošto verifikacija zahtijeva javno dostupan sajt, Paddle prijava ide TEK nakon deployment-a na pravi server/domen (Faza D, Dokument 14), ne prije.

**Payout mehanizam (potvrđeno iz Paddle Help Center, 29.06.2026.):**
- Sredstva se akumuliraju kao balans na Paddle nalogu, ne mogu se povući na zahtjev
- Minimalni prag za isplatu: $100 (podesivo do $100,000)
- Mjesečni raspored: isplata kreirana 1. u mjesecu, poslata do 15., stiže do 3 radna dana nakon toga
- Metode: Bank/Wire Transfer (preporučeno za BiH), PayPal, Payoneer
- Valuta: birate pri podešavanju (preporuka: EUR, zbog fiksne veze BAM/EUR)
- Paddle ne dodaje dodatne naknade na isplatu (5%+$0.50 provizija je već oduzeta) — ALI banka može naplatiti svoju naknadu za međunarodni SWIFT transfer (~$15)
- Mjesečno se dobija "Statement", "Reverse Invoice" (Paddle izdaje fakturu vlasniku, obrnuto od standardnog), i "Remittance Advice" — dokumenti korisni za poresku evidenciju u BiH

**ODLUKA — payout metoda: Paddle + Payoneer (donesena 29.06.2026.)**

Vlasnik je odlučio da koristi Payoneer kao payout metodu od Paddle-a, umjesto klasičnog bankovnog/SWIFT transfera — razlog: ne treba devizni račun u lokalnoj banci, Payoneer daje multi-currency račun i karticu direktno, popularna i provjerena opcija među freelancerima/IT radnicima u regionu, brže i jeftinije od klasičnog SWIFT transfera.

**VAŽNO UPOZORENJE (eksplicitno naglašeno tokom razgovora, 29.06.2026.) — Payoneer NE zamjenjuje poresku obavezu.** Payoneer rješava ISKLJUČIVO tehničku/bankarsku stranu (kako primiti pare iz inostranstva bez deviznog računa) — NE rješava i NE izbjegava BiH/RS poresku obavezu na dohodak, koja postoji bez obzira na to kako se pare fizički prime. Sredstva na Payoneer računu NISU "nevidljiva" poreskim organima — BiH se postepeno uključuje u međunarodne sisteme razmjene podataka (CRS, OECD), što znači da takvi računi postaju sve manje "nevidljivi" tokom vremena. Konsultacija sa knjigovođom (sekcija 3.3 ispod, Dokument 25) OSTAJE OBAVEZNA, nezavisno od odabrane payout metode.

### 3.3 KRITIČNA STAVKA — Poreske obaveze u BiH, OBAVEZNA konsultacija sa knjigovođom (29.06.2026.)

**Vlasnik je postavio pitanje:** Da li se u jednom trenutku plaća porez na dobit i porez na dohodak kao fizičko lice?

**Opšti okvir (NIJE pravni savjet, samo orijentacija za razgovor sa stručnom osobom):**
- **Porez na dobit** (corporate/profit tax) — odnosi se na PRAVNA lica (firme). Ako se ostane na "Individual" statusu kod Paddle-a (fizičko lice, bez registrovane firme), ovaj porez se VJEROVATNO NE odnosi direktno.
- **Porez na dohodak** (income tax, fizičko lice) — odnosi se na prihod koji vlasnik prima od Paddle-a (nakon njihove provizije). Opšti izvori za region pominju stopu od 10% za kategoriju "samostalno zanimanje" kod fizičkih lica, ALI TAČNA stopa, kategorija, i postupak (mjesečno vs. godišnje) ZAVISI od RS-specifičnih pravila.
- **VAŽNA NIJANSA — redovnost prihoda:** Pošto je riječ o MJESEČNOJ pretplati (redovan, kontinuiran prihod), ne jednokratnom honoraru, postoji realna mogućnost da Poreska uprava RS zahtijeva registraciju PREDUZETNIČKE djelatnosti (npr. kao dopunsko zanimanje), ne tretman kao povremeni freelance rad. Ovo MORA se provjeriti sa stručnom osobom, ne pretpostaviti.
- **PDV** — prag registracije je 100.000 KM godišnje (vjerovatno se ne odnosi odmah na trenutni, mali obim — Solo/Start paketi, 20-30 salona u beta fazi). Priroda transakcije kroz MoR (Paddle, strana kompanija) kao posrednika prema BiH kupcima takođe zahtijeva precizno pravno tumačenje.

**OBAVEZNA AKCIJA PRIJE PRVE STVARNE UPLATE:** Konsultacija sa knjigovođom/poreskim savjetnikom u Banja Luci (RS), konkretno o:
1. Status: fizičko lice vs. registracija preduzetničke djelatnosti, s obzirom na REDOVNOST prihoda (mjesečna pretplata)
2. Porez na dohodak — tačna stopa, kategorija, postupak prijave (mjesečno/kvartalno/godišnje)
3. PDV — prag i tretman za MoR (Paddle) transakcije specifično

**Status: Pitanje postavljeno i Paddle-u (njihova strana VAT obrade) — odgovor se čeka. BiH lična poreska obaveza OSTAJE odvojeno pitanje koje zahtijeva lokalnog stručnjaka, ne može se riješiti generičkim istraživanjem.**

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
