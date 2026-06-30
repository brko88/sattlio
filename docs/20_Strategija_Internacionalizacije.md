# SmartBooking Platform — Strategija Internacionalizacije

**Dokument:** 20 — Pratni dokument uz Blueprint 1.0
**Verzija:** 1.0
**Datum:** 26.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument zapisuje plan širenja na strana tržišta, donesen tokom razvojne sesije, i konkretne tehničke/pravne preduslove koji moraju biti riješeni PRIJE tog koraka — ne nakon.

---

## 2. Strategija širenja (odluka vlasnika, 26.06.2026.)

**Faza 1 — BiH tržište, 6-12 mjeseci.** Pustiti platformu na bosanskom tržištu, aktivno tražiti mušterije, vidjeti stvaran obrazac korištenja (ne samo početni entuzijazam).

**Faza 2 — Odluka na osnovu rezultata:**
- Ako BiH tržište reaguje dobro → nastaviti rast na tom tržištu (Hrvatska kao prirodno sljedeći korak, slična kultura/jezik)
- Ako BiH tržište NE reaguje dobro → pivot na strana tržišta, konkretno **Njemačka** i slične zemlje (Austrija, Švicarska) gdje je kultura zakazivanja termina ("Termin kultur") duboko ukorijenjena — različito od balkanske kulture gdje je telefonski poziv/dolazak bez termina često prihvatljiv

**Razlog za njemačko tržište:** Booking softver rješava stvaran, osjećan problem u kulturi gdje je formalno zakazivanje termina norma, ne izuzetak.

---

## 3. KRITIČNI preduslovi prije pokušaja stranog tržišta (NE nakon)

### 3.1 i18n / Prevod — BLOKIRAJUĆI preduslov

**Trenutno stanje (potvrđeno 26.06.2026.):** Frontend tekst je hardkodiran direktno u JSX-u (npr. `"Zaposleni"`, `"Usluge"`) — NE koristi translation key sistem koji Dokument 02 (sekcija 13.1) i Dokument 07 (sekcija 10) predviđaju.

**Zašto je hitno:** Njemački korisnik neće koristiti aplikaciju sa bosanskim tekstom na dugmićima. Ovo nije "nice to have" za strano tržište — to je blokirajući preduslov.

**Preporučen pristup:** NE čekati da BiH faza "ne uspije" da se počne raditi na i18n. Umjesto toga, dok se BiH tržište testira (Faza 1, sekcija 2), paralelno i postepeno graditi translation key infrastrukturu kao tehnički dug koji se rješava usput. Tad je dodavanje njemačkog jezika posao od nekoliko dana (popunjavanje translation fajla), ne mjeseci (prepravka svakog JSX fajla).

### 3.2 Valuta — tehnički trivijalno, ali pažljivo sa poslovnom odlukom

**Tehnički:** `Tenant` model već ima `currency` polje (default "BAM") — promjena je laka.

**VAŽNO UPOZORENJE (identifikovano 26.06.2026.):** Vlasnik je razmatrao "29.90 KM → 29.90 EUR" kao direktnu zamjenu cijene. Po fiksnom kursu BAM/EUR (1.95583:1), **29.90 KM ≈ 15.30 EUR** — predložena cijena od 29.90 EUR je gotovo DUPLO veća realna vrijednost, ne ekvivalent. Ovo MORA biti namjerna poslovna odluka (njemačko tržište ima veću platežnu moć, opravdava veću cijenu), ne slučajna zabuna pri konverziji. Odluku treba eksplicitno donijeti i zapisati prije lansiranja na EUR tržištu.

### 3.3 Pravna usklađenost — GDPR i njemački e-commerce zakoni

**Razlika od BiH:** Njemačka/EU imaju STROŽIJE zakonske zahtjeve za SaaS/e-commerce ugovore i zaštitu podataka (GDPR) nego BiH, sa stvarnim novčanim kaznama za neusklađenost.

**Veza sa Dokumentom 19 (Release Checklist, sekcija 5.2a):** Terms of Service, Privacy Policy, Refund Policy MORAJU biti pravno pregledani — za njemačko tržište, ovo nije opciono "kasnije ćemo vidjeti", već zakonska obaveza. Preporučuje se konsultacija sa advokatom specijalizovanim za GDPR/EU e-commerce PRIJE lansiranja na njemačkom tržištu, ne nakon.

### 3.4 Payment gateway za EUR transakcije — DOBRA VIJEST

Merchant of Record platforme (Lemon Squeezy, Paddle, FastSpring — istraženo u Dokumentu 19) rade globalno, uključujući Njemačku, i prirodno rade sa EUR. Ovo je scenario gdje MoR platforme imaju prednost nad regionalnim opcijama (CorvusPay/Monri WSPay, koje su BiH/Balkan fokusirane) — lakše je naplaćivati globalno kroz MoR nego kroz regionalni payment gateway.

---

## 4. Šta JE već dobro postavljeno za internacionalizaciju (potvrđeno tokom sesije)

- **Multi-tenant arhitektura** (`UserTenantRole`, `tenant_id` na svakoj tabeli) — širenje na novo tržište znači nove redove u postojećim tabelama, ne arhitektonsku promjenu
- **Booking engine logika** (overlap provjera, status tranzicije, race condition zaštita) — jezički neutralna, prenosi se na bilo koje tržište bez izmjene
- **Baza ima `currency` i `timezone` polja** po tenant-u — infrastruktura postoji, samo nije iskorištena u frontend prikazu

---

## 5. Redoslijed akcija (sumarno)

1. **Sada → 6-12 mjeseci:** BiH tržište, aktivna potraga za mušterijama, praćenje stvarnog korištenja
2. **Paralelno, postepeno:** Graditi i18n translation key infrastrukturu (ne čekati odluku o pivotu)
3. **Prije bilo kakvog EUR/njemačkog lansiranja:** Riješiti i18n kompletno, donijeti eksplicitnu odluku o EUR cijeni (ne automatska konverzija), pravna konsultacija za GDPR/Terms/Privacy, podesiti MoR payment platformu
4. **Odluka o pivotu:** Na osnovu stvarnih rezultata BiH faze, ne unaprijed fiksiranog datuma

---

## 6. Zaključak

Tehnički temelji platforme (baza, multi-tenant model, booking logika) su dobro postavljeni za internacionalizaciju. Glavni preostali rad je u frontend sloju (i18n) i poslovno/pravnom sloju (cijena, GDPR usklađenost, payment gateway), i taj rad treba početi PRIJE odluke o stranom tržištu, ne nakon — kako se ne bi izgubilo vrijeme na hitnu prepravku u trenutku kad odluka već bude donesena.

---

*Kraj dokumenta.*
