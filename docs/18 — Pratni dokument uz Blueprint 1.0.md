# SmartBooking Platform — Buduće Funkcionalnosti (V2 ideje za rezervacije)

**Dokument:** 18 — Pratni dokument uz Blueprint 1.0
**Verzija:** 1.0
**Datum:** 25.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument zapisuje šest funkcionalnosti vezanih za rezervacije i poslovanje salona, predloženih tokom razvojne sesije. Nijedna nije dio trenutne Faze A/B/C (vidi Dokument 14/15) — sve su buduće nadogradnje. Dokument procjenjuje tehničku težinu svake, da se zna prioritet kad dođe vrijeme za V2 fazu.

**Zajednička dobra vijest:** Nijedna od ovih šest funkcionalnosti ne zahtijeva izmjenu fundamentalne arhitekture (tenant_id izolacija, UserTenantRole model) — sve se uklapaju u postojeću bazu (Dokument 03) bez bolne migracije.

---

## 2. Pregled funkcionalnosti, od najlakše do najteže

### 2.1 Blokirani termin — najlakše

**Šta je:** Zaposleni rezerviše sebi slot (npr. da obavi privatnu stvar) bez klijenta, da se taj period ne može rezervisati.

**Implementacija:** Appointment bez klijenta — dodati `is_blocked` polje na `Appointment` model, gdje `customer_id` postaje opcionalan kad je `is_blocked=True`. Postojeća overlap logika (već napisana u Fazi A) automatski poštuje ovo, jer blokiran termin i dalje zauzima period u bazi.

**Procjena:** Niska težina — recikliramo postojeću tabelu skoro u potpunosti.

### 2.2 Termin za pauzu (fiksna dnevna pauza, npr. doručak)

**Šta je:** Fiksno vrijeme u danu kad se ne može rezervisati (npr. 09:00-09:30), razlikuje se od blokiranog termina po tome što se ponavlja svaki dan, ne jednom.

**Veza sa postojećim dokumentima:** Dokument 10, BR-013 već predviđa slično (godišnji odmori, neradni dani) kao V2 funkcionalnost — pauza je isti koncept na dnevnom nivou.

**Implementacija:** Nova tabela `breaks` (ili proširenje `working_hours`) sa `employee_id`, `day_of_week`, `start_time`, `end_time`. `check_working_hours` funkcija (već postoji u kodu) dobija dodatnu provjeru preklapanja sa pauzom — isti pattern kao postojeća overlap logika.

**Procjena:** Niska težina — par sati posla.

### 2.3 Excel izvještaj na kraju mjeseca (mailom, premium feature)

**Šta je:** Mjesečni izvještaj (broj termina, zarada) automatski stiže mailom vlasniku salona, samo za premium pretplatnike.

**Veza sa postojećim dokumentima:** Dokument 13 (sekcija 7, Business Plan) i Dokument 12 (V1) već navode "eksport podataka" kao premium feature.

**Implementacija:** `openpyxl` biblioteka za generisanje Excel fajla iz postojećih podataka (`appointments` sa `status=completed`, `service.price`). Slanje na raspored (1. u mjesecu) zahtijeva scheduled task — ovo je trenutak gdje Celery/Redis (odloženi u Dokumentu 14) postaju opravdani.

**Procjena:** Niska do srednja težina — par dana posla, najveći dio je postavka scheduled task sistema.

### 2.4 Procenat za gazdu (radnik na procenat)

**Šta je:** Zaposleni koji radi po procentu mora platiti vlasniku npr. 30% od svake naplaćene usluge. Vezano za isti Excel izvještaj (2.3).

**Implementacija:** Novo polje `commission_percentage` na `Employee` modelu (ili posebna tabela ako se procenat razlikuje po usluzi). Sam izračun je trivijalna matematika ugrađena u izvještaj. Glavna novost: owner treba UI da podesi procenat po zaposlenom.

**Procjena:** Srednja težina — tehnički lako, ali zahtijeva novo UI polje i odluku da li procenat može varirati po usluzi ili je fiksan po zaposlenom.

### 2.5 VIP termin / VIP član

**Šta je:** Klijent koji potroši određen iznos (npr. 500 KM) postaje VIP, sa nekim povlasticama (još neodređeno).

**Veza sa postojećim dokumentima:** Konceptualno rod-brat sa loyalty/bonus poen sistemom (vidi Dokument 15, sekcija 7, V5 napomena).

**Implementacija:** `is_vip` boolean na `Customer` modelu, ili `customer_tiers` tabela koja prati ukupnu potrošnju (SUM na completed appointments) i automatski promoviše u VIP nakon praga.

**Procjena:** Tehnički laka, ali **poslovno nedefinisana** — glavno pitanje nije kod, već šta VIP status konkretno donosi (prioritet na waitlisti — vidi 2.6, popust, posebna boja u kalendaru, ekskluzivni termini). Ovo treba odlučiti prije implementacije.

### 2.6 Termin na čekanju (waitlist) — najteže, ali potencijalno najvrednije

**Šta je:** Klijent se prijavljuje na "čekanje" za termin koji mu odgovara ali je zauzet; ako neko otkaže, dobija notifikaciju da je slot slobodan.

**Implementacija:**
- Nova tabela `waitlist_entries` (`customer_id`, `employee_id`, `service_id`, `preferred_date_range`, `status`)
- Logika koja "osluškuje" otkazivanja (`cancel_appointment` ruta) i provjerava da li postoji waitlist zapis za taj slot
- **Notifikacija u realnom vremenu** — email (već imamo) je dovoljan za početak, ali "stigne mu notifikacija" prirodno vodi prema push notifikaciji/SMS, što zahtijeva infrastrukturu iz Dokumenta 12 (V8/V9 — mobilne app, SMS servisi) koju još nemamo
- Pravilo prioriteta kad više osoba čeka isti slot (FIFO, ili VIP prioritet — prirodna veza sa 2.5)

**Procjena:** Srednja do visoka težina — jedina od šest koja zahtijeva novi "sistem događaja" (event-driven logika), ne samo dodavanje polja/tabele. Najambiciozniji, ali i najvrjedniji feature od svih šest.

**Otvoreno pitanje:** Da li se ovo dodatno naplaćuje (premium feature) — nije odlučeno.

---

## 3. Preporučeni redoslijed implementacije (kad dođe V2 faza)

1. Blokirani termin
2. Termin za pauzu
3. Excel izvještaj
4. Procenat za gazdu
5. VIP član (nakon što se poslovno definišu beneficije)
6. Termin na čekanju

---

## 4. Zaključak

Sve funkcionalnosti su kompatibilne sa postojećom arhitekturom i ne zahtijevaju redizajn baze. Najveći dio posla kod tačaka 2.1-2.4 je dodavanje polja i provjera po već postojećem obrascu iz Faze A booking engine-a. Tačka 2.6 (waitlist) je jedina koja uvodi novi tip logike i zaslužuje pažljivije planiranje kad joj dođe vrijeme.

---

*Kraj dokumenta.*
