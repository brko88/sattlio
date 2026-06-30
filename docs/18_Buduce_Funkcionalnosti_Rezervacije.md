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

### 2.7 Kontrola "ko može rezervisati" po zaposlenom — MVP-KRITIČNO (FINALNO RAZUMIJEVANJE, potvrđeno 26.06.2026.)

**Tačan mehanizam (potvrđeno direktno sa vlasnikom, treći i konačan pokušaj razjašnjenja):**

Owner bira, **po zaposlenom**, jedan od dva moda:

- **Mod A — "Privatno" (`allow_self_booking = False`, default):** SAMO owner/employee ("brico") može upisati termin u kalendar. Klijent nema nikakav pristup kreiranju rezervacije, bez obzira da li ima nalog na platformi.

- **Mod B — "Javno" (`allow_self_booking = True`):** I owner/employee I klijent (koji ima nalog na platformi) mogu upisati termin. Ovo NIJE zamjena jedne opcije drugom — obje opcije su dostupne ISTOVREMENO. Brico i dalje može ručno unijeti rezervaciju (npr. nakon telefonskog poziva), ALI klijent sada DODATNO ima mogućnost da sam, kroz svoj nalog, rezerviše termin direktno, bez posredovanja brice.

**Ključna pojednostavljujuća implikacija (bitno za implementaciju):** Pošto klijent već ima nalog na platformi (login sistem već postoji — `customer` rola već postoji u `UserTenantRole` modelu, Dokument 03), NE treba novi "javni URL bez logovanja" sistem. Treba samo:

1. Polje `allow_self_booking` na `Employee` modelu
2. Employee edit UI sa ovim toggle dugmetom (zavisi od Employee edit funkcionalnosti koja još ne postoji)
3. Izmjena u `POST /api/v1/appointments` ruti (ili `require_member` logici) — trenutno SAMO `owner`/`employee` role mogu kreirati appointment za bilo kog `employee_id`; treba dodati: ako je trenutni korisnik `customer` rola (ne owner/employee) ZA TAJ tenant, dozvoliti kreiranje SAMO ako je ciljani `employee_id` postavljen na `allow_self_booking = True`, I customer_id u zahtjevu odgovara NJEGOVOM sopstvenom customer profilu (ne može rezervisati “za nekog drugog” u ovom modu)
4. Frontend: customer rola treba svoj, jednostavniji UI prikaz (vidi samo svoje termine + mogućnost kreiranja novog kod dostupnih zaposlenih), razlikuje se od owner/employee Dashboard-a koji već postoji

**Šta OVO NE zahtijeva (ispravka u odnosu na prethodni, pogrešan zapis):** NE treba novi "javni booking kanal bez logovanja", NE treba posebna "javna URL stranica salona" kao preduslov — postojeći auth/login sistem (koji već radi) je dovoljan, samo se proširuje ovlaštenje `customer` role na `appointments` rutu, uslovljeno `allow_self_booking` poljem.

**Status: PRIORITETNO za implementaciju u Fazi D, prije launch-a. Manji obim posla nego prvobitno (pogrešno) procijenjeno — uglavnom proširenje postojeće autorizacione logike, ne novi sistem. Vidi Dokument 14, redoslijed za sljedeću sesiju (ažurirano).**

---

### 2.8 Vizuelno razlikovanje klijenata po historiji posjeta u kalendaru (IDEJA — 26.06.2026., NIJE ODLUČENO)

**Ideja vlasnika:** U kalendaru vizuelno razlikovati klijente prema broju prijašnjih posjeta (npr. prvi put, 10+, 50+ posjeta) — slično VIP konceptu iz sekcije 2.5, samo izraženo direktno u kalendar prikazu.

**Izvodljivost:** Tehnički jednostavno — `COUNT()` upit na `appointments` tabeli (filtrirano po `customer_id`, `status = completed`), bez potrebe za novom tabelom.

**Otvoreno pitanje obima (NIJE riješeno, vlasnik je odlučio sačekati):** Kako prikazati ovu informaciju BEZ da se sudari sa postojećim sistemom boja po STATUSU rezervacije (created/confirmed/completed/cancelled), i BEZ da troši prostor u već tijesnoj kalendar kućici (vidi sekciju "Pretrpan raspored" u Dokumentu 14, v1.1a — minimalna 40px visina, skraćena imena, prostor je već ograničen).

**Dva razmatrana pristupa (oba ostaju otvorena za odluku):**
1. **Modal pristup** — kalendar prikaz se NE dira, informacija ("Broj prijašnjih posjeta: 12" ili "VIP klijent") se dodaje kao dodatna linija u POSTOJEĆI detail modal (otvara se klikom na termin) — bez rizika da pogorša gustinu/čitljivost kalendara
2. **Ivica/border stil** — umjesto pune boje kućice (koja bi se sudarila sa statusnom bojom), koristiti stil/boju IVICE kućice (npr. zlatna deblja ivica za VIP, isprekidana za prvi put) — ne troši prostor za tekst, samo mijenja postojeći vizuelni element

**Status: zapisano kao ideja, odluka o pristupu odgođena za kasnije.**

---

### 2.9 Integracija sa eksternim kalendarima (Google/Samsung) — IDEJA (28.06.2026.)

**Pitanje vlasnika:** Da li je izvodivo da se naš kalendar integriše sa ličnim kalendarom korisnika (Google Calendar, Samsung Calendar), da se podaci "preliju" u oba pravca?

**Odgovor — izvodivo, dva nivoa, isti princip kao ranija diskusija o bend-booking ideji (vidi "Buduca_Ideja_Bend_Booking_App.md"):**

1. **Jeftino, brzo — `.ics` fajl prilog (PREPORUČENO ZA BLISKU BUDUĆNOST).** Kad se rezervacija kreira/potvrdi, generiše se standardni `.ics` (iCalendar) fajl koji korisnik jednim klikom dodaje u svoj Google/Samsung/Apple kalendar. NE treba OAuth, NE treba API integraciju sa Google-om. Prirodno se uklapa kad implementiramo email potvrde rezervacija (već ranije spominjano kao planirana funkcionalnost).

2. **Skuplje, dublje — prava dvosmjerna sinhronizacija (DALEKA BUDUĆNOST, V9).** OAuth povezivanje sa Google Calendar API, automatsko ažuriranje u oba smjera (otkažeš kod nas → briše se i iz Google kalendara). Veći tehnički posao (autentifikacija, API pozivi, webhook-ovi). Već postoji u Dokumentu 12, V9 ("Integracije — Google Calendar, Outlook Calendar, Apple Calendar") kao daleka faza — ostaje tamo.

**Status: `.ics` prilog vrijedan kao blizak, jeftin dobitak (vezati uz implementaciju email potvrda rezervacije). Puna OAuth sinhronizacija ostaje V9 daleka faza.**

### 2.10 Lični pregled termina korisnika kroz sve salone — MVP-REALNO, PRIORITETNO (ažurirano 28.06.2026.)

**Pitanje vlasnika:** Da li je planirano da korisnik (klijent) ima svoj pregled SVIH termina kroz različite salone (npr. "danas: šišanje u 10h kod Salona Maja, servis auta u 13h kod Auto-servisa Pero")?

**ODLUKA (28.06.2026.): Za MVP — JEDNOSTAVNA, HRONOLOŠKA LISTA, NE kalendar.** Vlasnik je odlučio da za početak ne treba vizuelni kalendar prikaz (rešetka, kolone, pozicioniranje) — samo lista termina sortirana po vremenu, slično postojećoj Appointments tabeli koju owner/employee već koristi. Ovo je MNOGO manji posao od pune "lični kalendar" verzije, i može ići kao samostalan, prioritetan MVP zadatak — NE mora čekati kompletan self-booking sistem (sekcija 2.7).

**Provjereno stanje koda (28.06.2026.) — ovo NE POSTOJI:** Trenutna `GET /api/v1/appointments` ruta zahtijeva `tenant_id` parametar i vraća isključivo appointment-e tog jednog tenant-a (vidi `app/api/routes/appointments.py`, funkcija `get_appointments`, filtrira striktno po `Appointment.tenant_id == tenant_id`). Korisnik trenutno mora ručno prebacivati tenant (kroz tenant switcher) da vidi termine u SVAKOM salonu posebno — nema zajedničkog pregleda.

**Napomena:** Dokument 04 (API Specifikacija), sekcija 11.4 SPOMINJE rutu `GET /api/v1/appointments/my` kao planiranu — nikad implementirana u kodu kroz sesije do 28.06.2026.

**Tehnička skica za MVP verziju (lista, ne kalendar):**

1. **Implementirati `GET /api/v1/appointments/my` rutu** — vraća SVE appointment-e gdje je trenutni korisnik vezan kao customer, BEZ OBZIRA na tenant_id, sortirano hronološki (`order_by(Appointment.start_time)`) — suštinski isti pattern kao postojeća `get_appointments` funkcija, samo bez `tenant_id` filtera.

2. **KLJUČNA TEHNIČKA NIJANSA (otkrivena 28.06.2026., MORA se riješiti prije implementacije):** `Appointment.customer_id` pokazuje na `Customer` zapis (Dokument 03), NE direktno na `User` nalog. `Customer` model TRENUTNO NEMA `user_id` polje — samo `created_by_user_id` (ko je customer-a DODAO, ne čiji je). Da bi "Marko" (User) vidio SVOJE termine kroz različite tenant-e, sistem mora znati koji `Customer` zapisi (kroz različite tenant-e) odgovaraju NJEMU.
   - **Rješenje:** Dodati `user_id` (nullable) polje na `Customer` model. Popunjava se kad klijent SAM registruje sebe kao customer (self-booking, sekcija 2.7) — za customer zapise koje je owner ručno dodao (trenutni model), ovo polje ostaje prazno dok se ne uvede mehanizam povezivanja (npr. match po email/telefon, ili klijent sam "potvrdi" da je on taj customer).
   - Ovo je MALA migracija (jedna nullable kolona), ne veliki redizajn.

3. **Frontend — nova, jednostavna stranica "Moji termini"** — kopija postojećeg tabelarnog prikaza iz Appointments.tsx (lista, sortirana po vremenu), BEZ forme za kreiranje, BEZ `tenant_id` parametra. Prikazuje naziv salona uz svaki termin (da se znа "gdje" je taj termin).

**Šta OVO NE uključuje (ostaje za kasnije, ako se odluči):**
- Vizuelni kalendar prikaz (rešetka/kolone) — može doći kasnije kao poliranje, lista je dovoljna za MVP
- Lični podsjetnici nevezani za salone (nova `personal_reminders` tabela) — ostaje zapisano kao mogućnost za kasnije, NIJE dio MVP liste verzije

**Veza sa Dokumentom 18, sekcija 2.7 (self-booking):** Lista postaje POSEBNO korisna kad self-booking sistem bude implementiran, ali NE zavisi od njega — može se implementirati nezavisno, čak i prije, jer korisnik već MOŽE imati termine kroz različite tenant-e (owner ih je dodao ručno) bez self-booking sistema.

**Status: MVP-PRIORITETNO. Manji obim posla nego prvobitno procijenjeno (nije potreban kalendar, samo lista + jedna nova kolona u bazi). Vidi Dokument 14 za pozicioniranje u redoslijedu.**

---

### 2.11 Usluge bez fiksne cijene ("Cijena na upit") — LAKO, MOŽE ODMAH (28.06.2026.)

**Ideja vlasnika:** Neki saloni možda žele prikazati uslugu BEZ fiksne cijene (npr. kompleksne usluge gdje cijena zavisi od dužine kose, stanja zuba, itd.) — cijena bi bila opcionalna, ne obavezna.

**VAŽNA NAPOMENA — ovo MIJENJA postojeće poslovno pravilo:** Dokument 10, BR-071 trenutno kaže "Usluga mora imati cijenu" — `Service.price` polje je `nullable=False` u kodu. Ova ideja zahtijeva EKSPLICITNU promjenu tog pravila, ne samo dodavanje nove funkcionalnosti.

**Tehnička skica (trivijalno jednostavno):**
1. Promijeniti `Service.price` na `nullable=True` (mala Alembic migracija)
2. Frontend: ako je `price` null, prikazati "Cijena na upit" umjesto broja
3. Ažurirati Dokument 10, BR-071 da odrazi novo pravilo ("cijena je opcionalna")

**Status: LAKO izvodivo, moglo bi ići i prije ostalih V2 stavki ako se odluči. Zahtijeva eksplicitnu odluku o promjeni BR-071.**

### 2.12 "Predloži sljedeći slobodan termin" (alternativni self-booking flow) — SREDNJE SLOŽENO (28.06.2026.)

**Ideja vlasnika:** Korisnik izabere salon i uslugu (npr. "šišanje"), sistem PREDLAŽE prvi slobodan termin ("Sutra, 14:00"). Korisnik klikne "Ne odgovara" → sistem predlaže SLJEDEĆI slobodan termin. Kad korisnik nađe termin koji mu odgovara, klikne "Potvrdi" i termin se rezerviše.

**Zašto je ovo LAKŠE nego što izgleda:** Ne treba pun vizuelni kalendar UI za ovaj flow — korisnik NE bira sam iz prikaza, sistem MU PREDLAŽE jedan slot odjednom. Ovo je "obrnuta" verzija postojeće overlap logike (umjesto "provjeri je li OVAJ termin slobodan", pitamo "KOJI je sljedeći slobodan termin").

**Tehnička skica:**
1. Novi endpoint, npr. `GET /api/v1/employees/{id}/next-available-slot?service_id=X&after=<datetime>` — prolazi kroz working_hours + postojeće appointments tog zaposlenog, vraća prvi slobodan slot poštujući trajanje usluge
2. Frontend: dva dugmeta — "Ne odgovara" (poziva isti endpoint sa `after` = trenutno prikazan slot, dobija sljedeći) i "Potvrdi" (kreira appointment na trenutno prikazanom slotu, koristeći postojeću `POST /api/v1/appointments` rutu)

**Veza sa Dokumentom 18, sekcija 2.7 (self-booking):** Ovo bi bio ALTERNATIVNI, jednostavniji način biranja vremena u self-booking sistemu — umjesto da klijent sam gleda kalendar/listu termina i bira, sistem mu predlaže jedan po jedan. Mogu postojati OBA načina (klijent bira sam ILI koristi "predloži sljedeći") kao opcije.

**Status: Srednje složeno, dobar dodatak self-booking sistemu, ne prevelik posao. Razmotriti kao dio implementacije sekcije 2.7.**

### 2.13 Unos cjenovnika fotografisanjem (OCR) — KOMPLEKSNO, V2/V3 (28.06.2026.)

**Ideja vlasnika:** Owner fotografiše fizički, papirni cjenovnik salona, sistem automatski prepoznaje usluge i cijene i unosi ih u bazu.

**Zašto je ovo NAJSLOŽENIJA od sve tri ideje u ovoj sesiji:** Zahtijeva OCR (Optical Character Recognition) tehnologiju — eksterni servis (Google Cloud Vision API, AWS Textract, ili open-source Tesseract) koji "čita" tekst sa slike. Dodatna kompleksnost:
- OCR vraća NEPROSTRUKTURIRAN tekst — treba dodatna logika (parsing) da se iz teksta izvuče naziv usluge + cijena, što je teško zbog različitih formata papirnih cjenovnika, rukopisa, mogućih OCR grešaka
- Owner MORA pregledati i potvrditi prepoznate stavke prije konačnog unosa (OCR nikad nije 100% pouzdan)
- Eksterni OCR servisi naplaćuju po pozivu — mala dodatna operativna cijena

**Status: KOMPLEKSNO, definitivno V2/V3 faza, ne MVP. Zapisano kao "wow" feature za kasnije, kad osnovni sistem bude stabilan.**

---

### 2.14 Cjenovnik po zaposlenom (različite cijene za istog zaposlenog) — IDEJA (28.06.2026.)

**Pitanje vlasnika:** Da li dva radnika u istom salonu mogu imati različite cijene za istu uslugu (npr. iskusniji frizer naplaćuje više za "Šišanje" od početnika)?

**Provjereno stanje koda (28.06.2026.) — TRENUTNO NE POSTOJI:** `Service.price` je vezan direktno na `tenant_id` (salon) — ISTA cijena za uslugu, bez obzira koji zaposleni je radi. `Employee` i `Service` modeli su trenutno nezavisni, vezani samo kroz `tenant_id`, NEMA eksplicitne veze "ovaj zaposleni radi ovu uslugu po ovoj cijeni".

**Bitna napomena:** Dokument 03 (Database Design), sekcija 5.6 VEĆ DOKUMENTUJE `employee_services` tabelu (M:N veza između zaposlenih i usluga) — ali ova tabela NIKAD nije implementirana u kodu kroz sesije do 28.06.2026. Ovo je primjer dokumentovane, ali neimplementirane funkcionalnosti iz originalnog Blueprint-a.

**Tehnička skica:**
1. Implementirati `employee_services` tabelu: `id`, `tenant_id`, `employee_id`, `service_id`, **`custom_price`** (nullable Float — ako je `null`, koristi se default `Service.price`; ako je postavljen, override-uje default cijenu za TOG zaposlenog)
2. Kad se appointment kreira, backend provjerava: postoji li `employee_services` zapis sa `custom_price` za tu kombinaciju zaposleni+usluga — ako da, koristi tu cijenu (za izvještaje/fakturisanje), ako ne, koristi default `Service.price`

**UX dopuna (zahtjev vlasnika, 28.06.2026.) — checkbox za "isti cjenovnik za sve":** Pri kreiranju usluge (ili pri dodavanju novog zaposlenog), ponuditi checkbox/toggle "Koristi isti cjenovnik za sve zaposlene" (DEFAULT: uključeno). Razlog: bez ovoga, owner sa više zaposlenih mora RUČNO unositi istu cijenu za svaku uslugu po SVAKOM zaposlenom — nepotrebno repetitivno za najčešći slučaj (isti cjenovnik za sve). Kad je checkbox uključen, sve usluge koriste `Service.price` default, BEZ potrebe za `employee_services` zapisima. Kad owner ISKLJUČI checkbox (za specifičnog zaposlenog ili uslugu), tek tada se otvara opcija unosa custom cijene, koja se čuva u `employee_services.custom_price`.

**Status: zapisano kao ideja. Zahtijeva implementaciju već dokumentovane (ali neimplementirane) `employee_services` tabele + custom_price polje + checkbox UX rješenje za jednostavan default slučaj.**

---

### 2.15 Notifikacija pri otkazivanju termina (email + WhatsApp/Viber + push) — IDEJA (28.06.2026.)

**Pitanje vlasnika:** Da li postoji notifikacija zaposlenom kad se termin otkaže?

**Provjereno stanje koda (28.06.2026.) — TRENUTNO NE POSTOJI:** `cancel_appointment` ruta (`app/api/routes/appointments.py`) samo mijenja `status` na `"cancelled"` i radi `db.commit()` — NEMA poziva na `send_email()`, NEMA bilo kakve obavijesti zaposlenom ili klijentu. Zaposleni bi za otkazivanje saznao samo ako sam otvori kalendar i primijeti promjenu statusa.

**Zašto je ovo bitno:** Bez notifikacije, zaposleni ne zna da mu je termin oslobođen ranije nego što bi inače primijetio — propušta šansu da popuni taj slot drugim klijentom. Posebno važno kad self-booking sistem (sekcija 2.7) bude implementiran, jer klijent može otkazati termin bez direktnog razgovora sa salonom.

**TRI RAZLIČITA NIVOA notifikacije (vlasnik je eksplicitno tražio da se razdvoje, 28.06.2026.):**

1. **Email notifikacija (BLIZAK, izvodljivo SAD)** — koristi postojeći Gmail SMTP sistem (već implementiran za email verifikaciju). Kad se appointment otkaže, poslati email zaposlenom (i/ili klijentu, ako owner otkaže umjesto njega) sa informacijom o otkazanom terminu. Ne zahtijeva ništa novo osim pozivanja postojeće `send_email()` funkcije iz `cancel_appointment` rute. Direktno se uklapa sa "Email notifikacije" stavkom koja je već dio Start paketa (Dokument 13, sekcija 6.2), ali trenutno postoji samo kao NAZIV u cjenovniku, ne kao stvarna implementacija — ovo bi bio jedan od konkretnih slučajeva koji tu stavku stvarno ispunjava.

2. **WhatsApp/Viber poruka (SREDNJE BLIZAK — tehnički lako, administrativno sporije) — pitanje vlasnika 28.06.2026.** Tehnički MNOGO lakše od push notifikacije — ne treba native app, ne treba Firebase. Mehanizam je IDENTIČAN email-u: poziv eksternom API-ju (WhatsApp Business API ili Viber Business Messages, često kroz posrednika kao Twilio) sa telefonskim brojem i tekstom poruke, umjesto SMTP poziva za email. Kod bi bio jednostavan dodatak (par sati posla), suštinski paralelan postojećoj `send_email()` funkciji.
   - **VAŽNA NAPOMENA — administrativni preduslov, slično payment gateway iskustvu:** Registracija WhatsApp Business naloga zahtijeva verifikaciju firme (slično JIB problemu i CorvusPay/Monri iskustvu) — može trajati dane/sedmice, i obično zahtijeva registrovan biznis, ne fizičko lice. Ovo treba provjeriti direktno (slično kako se kontaktiralo MoR provajdere) prije nego se računa kao "brz" dodatak.
   - **Status: tehnički lako, administrativno NEPROVJERENO — treba istražiti uslove registracije kad dođe vrijeme, slično payment gateway istraživanju (Dokument 19).**

3. **Push notifikacija ("iskoči notifikacija iz app-a") — ISPRAVKA 28.06.2026.: RADI KROZ PWA, NE čeka native app.** Ranije (sekcija 2.15, prvobitna verzija) zapisano da push "čeka native Android/iOS aplikaciju" — ovo je bilo PREVIŠE KONZERVATIVNO, provjereno i ispravljeno 28.06.2026. PWA Push notifikacije RADE: na Android-u puna, zrela podrška (radi direktno iz browsera, bez instalacije); na iOS-u radi od verzije 16.4+ (mart 2023), ALI korisnik MORA prvo instalirati PWA na Home Screen kroz Safari "Add to Home Screen" — push ne radi iz otvorenog Safari taba. Pošto PWA "Add to Home Screen" je VEĆ planirano (Dokument 14, v1.1b), push notifikacija se PRIRODNO uklapa kao dodatak na isti service worker rad u TOJ ISTOJ sesiji — ne treba čekati native app (V3 fazu).
   - **Tehnički zahtjevi (realno pola dana do jedan dan rada):** VAPID ključevi (sigurnosni ključevi, generišu se jednom), nova tabela za "push subscription" podatke (slično `notification_settings` iz sekcije 2.16), backend slanje preko Web Push API-ja (sličan pattern kao postojeća `send_email()` funkcija), iOS-specifična provjera (je li PWA instalirana na Home Screen prije traženja dozvole)
   - **Napomena za buduće EU tržište (relevantno ako se ide na njemačko tržište, Dokument 20):** Apple je 2024 (iOS 17.4) privremeno uklonio punu PWA podršku u EU zbog Digital Markets Act regulative, kasnije povratio nakon kritika — vrijedno provjeriti TRENUTNI status te politike u trenutku kad/ako se ide na EU tržište, jer se Apple-ova pozicija mijenjala više puta.

**Status: Email nivo — spremno za implementaciju bilo kad. WhatsApp/Viber nivo — tehnički lako, ali treba provjeriti administrativne uslove registracije prije implementacije. Push nivo — RADI kroz PWA (ispravljeno 28.06.2026.), implementirati ZAJEDNO sa PWA sesijom (Dokument 14, v1.1b), ne čekati native app.**

---

### 2.16 Modularni sistem notifikacija sa doplatom po kanalu — ODLIČNA IDEJA (28.06.2026.)

**Ideja vlasnika:** Sistem obavještenja treba biti modularan — salon u podešavanjima bira koje kanale želi (checkbox lista):
- ☑ Email
- ☑ Push
- ☑ SMS (doplaćuje)
- ☑ WhatsApp (doplaćuje)
- ☑ Viber (doplaćuje, ako bude dostupan)

**Zašto je ovo posebno dobra ideja — tri prednosti istovremeno:**

1. **Arhitektonski čisto** — umjesto da se svaka ruta koja šalje notifikaciju (cancel_appointment, buduća waitlist notifikacija iz sekcije 2.6, itd.) zna "kako" slati email/SMS/WhatsApp, postoji JEDNA centralna funkcija koja provjeri koji su kanali uključeni za taj tenant i pozove odgovarajuće. Kad se kasnije dodaje novi kanal (npr. Viber, kad postane dostupan), dodaje se SAMO nova funkcija u taj centralni sistem — ne treba prepravljati svaku rutu koja šalje notifikacije.

2. **Poslovno pametno — pretvara trošak u prihod.** SMS/WhatsApp/Viber pozivi eksternim servisima KOŠTAJU (po poruci ili pretplata) — umjesto da to bude čist trošak za platformu, postaje DOPLATNI add-on za korisnika, prirodno se uklapa uz postojeće Solo/Start/Pro pakete (Dokument 13).

3. **Fleksibilno za buduće kanale** — kad se dođe do faze gdje Viber/WhatsApp administrativni uslovi budu provjereni i riješeni (sekcija 2.15), samo se "uključi" novi checkbox, infrastruktura je već spremna.

**Tehnička skica:**

1. Nova tabela `notification_settings`: `tenant_id`, `email_enabled` (bool), `sms_enabled` (bool), `whatsapp_enabled` (bool), `viber_enabled` (bool), `push_enabled` (bool)
2. Centralna funkcija `send_notification(tenant_id, recipient, event_type, context)` — pročita `notification_settings` za tenant, pozove odgovarajuće pod-funkcije za svaki uključeni kanal (`send_email_notification()`, `send_sms_notification()`, itd.), paralelno/nezavisno
3. UI: checkbox lista u podešavanjima salona (Tenant settings stranica — vidi i Release Checklist, stavka o Tenant edit ruti koja generalno nedostaje)
4. Svaki kanal koji "doplaćuje" prikazuje vizuelnu oznaku u UI-ju (npr. "💰 SMS (doplaćuje)")

**OTVORENO PITANJE — model naplate za "doplaćuje" kanale (NIJE odlučeno, vlasnik treba razmotriti):**
- **Opcija A — Fiksna mjesečna doplata** (npr. "+10 KM ako uključiš SMS", bez obzira na broj poslanih poruka) — JEDNOSTAVNIJE za implementaciju, samo dodatna stavka na mjesečnoj fakturi
- **Opcija B — Naplata po poruci** (npr. "0.10 KM po SMS-u") — PRAVEDNIJE za korisnike koji rijetko šalju, ali zahtijeva brojanje poslanih poruka i mjesečni obračun (kompleksnije)

**Status: Arhitektura/koncept ODLIČAN i vrijedan implementacije kad se kanali (SMS, WhatsApp, Viber) budu uvodili. Model naplate (Opcija A vs B) ostaje otvoreno pitanje za vlasnikovu odluku, van obima ove sesije.**

---

### 2.17 Prikaz "radnog vremena platforme" (najraniji početak, najkasniji kraj) u Admin panelu — IDEJA (29.06.2026.)

**Ideja vlasnika:** Na nekom mjestu (Admin panel) vidjeti najraniji početak rada i najkasniji kraj rada, agregirano kroz SVE salone na platformi. Razlog: bitno za planiranje održavanja/ažuriranja sistema — vlasnik želi znati koji je najsigurniji vremenski prozor (kad najmanje salona aktivno radi) da minimizira prekid usluge.

**Tehnička skica (lako, koristi postojeće podatke):**
- `working_hours` tabela već ima `start_time`/`end_time` po zaposlenom, po danu — ne treba nova tabela
- Admin panel dodatak: agregacioni upit `MIN(start_time)` i `MAX(end_time)` kroz SVE working_hours zapise na platformi (eventualno filtrirano po danu sedmice, ako vlasnik želi preciznije planiranje, npr. "kad je najsigurnije za nedjelju vs. za radni dan")
- Prikaz: mala statistika/kartica u Admin panelu, npr. "Platforma aktivna: 07:00 - 21:00" — vlasnik vidi da je npr. 22:00-06:00 sigurna zona za održavanje

**Status: Mali, brz dodatak postojećoj Admin panel stranici — može ići uz buduće poliranje Admin panela.**

### 2.18 Grupna najava (broadcast) o nadolazećem ažuriranju — IDEJA (29.06.2026.), sa throttling zaštitom

**Ideja vlasnika:** Mogućnost da vlasnik (kroz Admin panel) pošalje grupno obavještenje svim korisnicima (npr. "Sistem će biti nedostupan sutra od 22h do 23h zbog ažuriranja") — najavljeno UNAPRIJED (npr. dan ranije), ne u trenutku ažuriranja.

**VAŽNA DOPUNA vlasnika — zaštita od spam liste:** Slanje email-a SVIM korisnicima ISTOVREMENO je rizično za email reputaciju — provajderi (Gmail i drugi) prepoznaju nagli "talas" email-ova sa istog naloga kao potencijalno spam/bot ponašanje, što može privremeno ograničiti nalog ili poslati buduće email-ove direktno u spam folder primalaca.

**Tehnička skica:**
1. Nova Admin panel akcija: forma sa naslovom/porukom najave
2. Nova backend ruta, npr. `POST /api/v1/admin/broadcast` — prikuplja sve `owner` email adrese (join `users` → `user_tenant_roles` filtrirano po `role = owner`, distinct po `user_id` da se ista osoba ne dupla ako ima više salona)
3. **Throttling zaštita (KLJUČNO, dogovoreno 29.06.2026.):** Slanje SA PAUZOM između svakog email-a (npr. `time.sleep(2)` — 2 sekunde između svakog), ne svi odjednom. Za trenutni obim (20-30 salona), ovo znači ukupno slanje traje ~1 minutu, potpuno prihvatljivo, NE treba složeniji sistem (queue, Celery, batch processing) za ovaj obim.
4. **Timing (vlasnikova ideja, "dan ranije"):** Vlasnik ručno pokreće slanje najave dan unaprijed (npr. najavljuje ažuriranje za sutra, šalje email danas) — ovo NIJE automatsko planiranje (scheduled task), samo vlasnik klikne "Pošalji" kad odluči, dovoljno rano da korisnici imaju vremena da reaguju ako im termin/posao bude pogođen.

**Kad obim poraste (buduća napomena):** Za stotine/hiljade korisnika, razmotriti profesionalniji email servis (SendGrid, Mailgun, Amazon SES) namijenjen za masovno slanje, sa boljom infrastrukturom/reputacijom od običnog Gmail SMTP naloga — ali to je za daleko kasnije, ne sad.

**Status: Zapisano kao ideja sa konkretnom tehničkom zaštitom (throttling). Nije prioritet za trenutni mali obim (20-30 salona), gdje je direktan, lični kontakt i dalje praktičniji — vrijedi implementirati kad obim poraste do tačke gdje lični kontakt postane nepraktičan.**

---

### 2.19 Reliability Score — skriveni mehanizam zaštite od no-show klijenata i botova — VISOK PRIORITET ZA V2 (29.06.2026.)

**Ideja vlasnika:** Zaštititi salone od klijenata koji rezervišu mnogo termina i ne pojavljuju se (no-show), uključujući botove ili zlonamjerne korisnike. Mehanizam treba biti SKRIVEN (klijent ne vidi svoj "score" direktno), sa stepenovanim posljedicama: pad "rejtinga" → obavezna potvrda od owner-a/zaposlenog za buduće rezervacije → potpuni ban sa platforme za najgore slučajeve.

**VAŽNOST:** Ovo je direktno povezano sa originalnim Blueprint-om — Dokument 01 (Product Requirements Specification) VEĆ NAVODI "trust score" i "no-show sistem" kao buduće stavke (samo kao nazivi, bez ikakve razrade) — ova sekcija je PRVA puta kad se taj koncept konkretno razrađuje. Vlasnik je odlučio da ovo treba biti među PRVIM stvarima implementiranim kad V2 faza krene.

**Veza sa postojećim konceptima:** Ovo je konceptualno "obrnuta strana" VIP klijent ideje (sekcija 2.5/2.8 ovog dokumenta) — VIP = visok score, potencijalne privilegije; Reliability Score = nizak score, ograničenja. Mogu deliti istu infrastrukturu (jedno polje, dvije primjene).

**Tehnička skica — polje i logika:**

```python
# Customer model, novo polje
reliability_score = Column(Integer, nullable=True, default=None)  # NULL = nema istorije još
```

**Logika promjene (poziva se kad appointment status postane "completed" ili "no_show"):**
```python
NO_SHOW_PENALTY = 15
COMPLETED_BONUS = 2
NEUTRAL_STARTING_SCORE = 75

def update_reliability_score(customer, new_status):
    if customer.reliability_score is None:
        customer.reliability_score = NEUTRAL_STARTING_SCORE

    if new_status == "no_show":
        customer.reliability_score = max(0, customer.reliability_score - NO_SHOW_PENALTY)
    elif new_status == "completed":
        customer.reliability_score = min(100, customer.reliability_score + COMPLETED_BONUS)
```

**ODLUKA o početnoj vrijednosti (razjašnjeno tokom razgovora, 29.06.2026.) — VAŽNA NIJANSA:** Vlasnik je prvobitno pretpostavio da svi novi korisnici kreću na 100, ALI je nakon razmatranja prihvaćen ispravniji pristup:
- Novi klijent (0 prošlih termina) ima `reliability_score = NULL` ("nema istorije") — NE 100. Tretira se kao "normalan" za PRVI termin (rezervacija prolazi standardno, prema Mod A/B pravilu koje je owner odabrao za tog zaposlenog — sekcija 2.7).
- Score se POČINJE GRADITI tek nakon PRVOG termina (completed ili no_show), i počinje od NEUTRALNE vrijednosti (75), NE maksimalne (100).
- **Razlog:** Davanje 100 svim novim korisnicima bi bilo "lažno povjerenje" bez zaslužene istorije, i bilo bi NEPRAVEDNO prema dugogodišnjim, dokazano pouzdanim klijentima koji bi inače "izgledali isto" kao potpuno nov nalog (oba na 100, plafonirano). Score koji STVARNO odražava istoriju je pravedniji i otporniji na zloupotrebu (botovi/novi nalozi ne dobijaju besplatno povjerenje).

**Pravila primjene (stepenovano, prema score rasponu):**
- **Score ≥ 70 (ili NULL — nova istorija):** normalno, samostalno rezervisanje radi standardno (ako je self-booking, sekcija 2.7, uključen za tog zaposlenog)
- **Score 40-69:** rezervacija se KREIRA, ali status automatski postaje NOVI status `"pending_confirmation"` (ne odmah `"created"`) — owner/employee MORA ručno potvrditi prije nego termin postane stvaran
- **Score < 40:** self-booking se BLOKIRA POTPUNO za tog klijenta — mora kontaktirati direktno (telefon), owner odlučuje ručno da li prihvata rezervaciju

**KRITIČAN PREDUSLOV — "Nije se pojavio" (no-show) dugme TRENUTNO NE POSTOJI:**

Razjašnjeno tokom razgovora (29.06.2026.) — ko određuje da li se klijent pojavio: ISKLJUČIVO owner/zaposleni, kroz RUČNU akciju (klik dugmeta), NIKAD automatski. Provjereno stanje koda: status `no_show` POSTOJI kao mogući enum u bazi (vidi Dokument 03, Dokument 10), ALI trenutno NE postoji ruta/dugme koje ga AKTIVNO postavlja — postoje samo "Završi" (complete) i "Otkaži" (cancel) akcije.

**Šta treba dodati (preduslov za Reliability Score da uopšte radi):**
1. Nova backend ruta: `POST /api/v1/appointments/{id}/mark-no-show` — slična postojećoj `complete`/`cancel` logici, postavlja `status = "no_show"`, poziva `update_reliability_score(customer, "no_show")`
2. Nova frontend akcija: treće dugme "Nije se pojavio" na Appointments listi i Calendar detail modalu (trenutno postoje samo "Završi" i "Otkaži")
3. **Vremenska validacija (bitno):** Dugme "Nije se pojavio" treba biti prikazano/aktivno SAMO nakon što je `end_time` termina već prošao (slično postojećem uslovnom prikazivanju dugmadi prema statusu) — sprečava da owner/employee zlonamjerno ili greškom označi no-show PRIJE nego klijent stigne

**Zašto MORA biti skriven mehanizam (princip, ne samo detalj):** Ako klijent vidi tačan broj/score, mogao bi "igrati sistem" (npr. namjerno održavati granicu testiranjem ponašanja). Klijent treba samo OSJETITI posljedicu (npr. "zašto sad mora potvrda, ranije nije morala") bez da zna tačan mehanizam koji je do toga doveo.

**Status: VISOK PRIORITET za V2 fazu — vlasnik je eksplicitno tražio da bude među prvim V2 stavkama implementiranim. Zahtijeva: (1) no-show dugme/ruta kao preduslov, (2) novo polje na Customer modelu, (3) novi `pending_confirmation` status u postojećem appointment status enum-u, (4) logiku za self-booking blokadu kod niskog score-a (vezano za self-booking sistem, sekcija 2.7).**

---

## 3. Preporučeni redoslijed implementacije (kad dođe V2 faza)

1. Blokirani termin
2. **Reliability Score + "Nije se pojavio" dugme (sekcija 2.19) — VISOK PRIORITET, vlasnik je eksplicitno tražio da bude među prvim V2 stavkama implementiranim.** Zahtijeva no-show dugme/rutu kao preduslov.
3. Termin za pauzu
4. Excel izvještaj
5. Procenat za gazdu
6. VIP član (nakon što se poslovno definišu beneficije) — konceptualno povezano sa stavkom 2 (obrnuta strana istog mehanizma)
7. Termin na čekanju
8. Kontrola "ko može rezervisati" po zaposlenom (vezano za Marketplace fazu, V4)
9. `.ics` fajl prilog za eksterne kalendare (vezati uz email potvrde rezervacije)
10. Lični pregled termina kroz salone (lista, vidi sekciju 2.10 — MVP-prioritetno, manji posao)
11. Usluge bez fiksne cijene (lako, može i ranije ako se odluči — ne zavisi od ostalih stavki)
12. "Predloži sljedeći slobodan termin" (dodatak self-booking sistemu, stavka 8)
13. OCR unos cjenovnika fotografisanjem (kompleksno, najdalji prioritet od svih nabrojanih)
14. Cjenovnik po zaposlenom (employee_services tabela + custom_price + checkbox UX za default slučaj)
15. Notifikacija pri otkazivanju (email nivo odmah izvodivo; push nivo čeka native Android/iOS app, V3 faza)
16. Modularni sistem notifikacija (notification_settings tabela + centralna send_notification funkcija) — implementirati uz stavku 15, arhitektura olakšava dodavanje SMS/WhatsApp/Viber kanala kasnije
17. Prikaz "radnog vremena platforme" u Admin panelu (lako, koristi postojeće podatke, ide uz buduće Admin panel poliranje)
18. Grupna najava (broadcast) sa throttling zaštitom — nije prioritet za trenutni mali obim, implementirati kad obim poraste

---

## 4. Zaključak

Sve funkcionalnosti su kompatibilne sa postojećom arhitekturom i ne zahtijevaju redizajn baze. Najveći dio posla kod tačaka 2.1-2.4 je dodavanje polja i provjera po već postojećem obrascu iz Faze A booking engine-a. Tačka 2.6 (waitlist) je jedina koja uvodi novi tip logike i zaslužuje pažljivije planiranje kad joj dođe vrijeme.

---

*Kraj dokumenta.*
