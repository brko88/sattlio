# SmartBooking — Automatizovani Test Suite

## Napomena o "PenTest" terminologiji

Tokom razgovora, korisnik je tražio "PenTest skriptu". Claude je objasnio razliku između:

- **Pytest test suite** (ovo što je napravljeno) — testira da TVOJ kod ispravno radi i ispravno ODBIJA neovlaštene zahtjeve (tenant izolacija, auth, validacija). Ovo je standardna, sigurna inženjerska praksa.
- **Penetration testing alat** — aktivno pokušava da PROBIJE sigurnost (SQL injection payloadi, brute-force skripte, fuzzing). Claude ne piše generičke eksploitacione alate, jer su tehnički identični alatima za napad na bilo koji sistem, ne samo sopstveni.

Ovaj test suite pokriva sigurnosnu suštinu (tenant izolacija, auth provjere, da li ORM ispravno escape-uje input) na legitiman način — provjerava da postojeća zaštita radi, ne pravi nove napade.

---

## Šta je pokriveno (prema Dokumentu 11 — Testing Strategy)

- `test_auth.py` — registracija, login, duplikat email, pogrešna lozinka, JWT validacija
- `test_tenants.py` — kreiranje tenant-a, slug generisanje, lista "moji tenant-i"
- `test_tenant_isolation.py` — **KRITIČNO** (Dokument 11, sekcija 8) — Tenant A ne vidi podatke Tenant B
- `test_employees.py`, `test_services.py`, `test_customers.py` — CRUD i validacija ovlaštenja (owner-only akcije)
- `test_appointments.py` — overlap provjera, working hours provjera, status tranzicije, **race condition test**
- `test_working_hours.py` — dodavanje, ažuriranje (sprečavanje duplikata), brisanje

## Pokretanje

```powershell
cd "D:\SmartBooking Platform"
venv\Scripts\activate
pip install pytest httpx pytest-html
pytest --html=test_report.html --self-contained-html -v
```

Rezultat: `test_report.html` — otvoriti u browseru za čitljiv izvještaj sa svim testovima, PASSED/FAILED statusom.

Za samo log u terminalu (bez HTML):
```powershell
pytest -v > test_log.txt
```

## Važna napomena o test bazi

Testovi **NE** treba da se pokreću protiv tvoje glavne `smartbooking` PostgreSQL baze — to bi pomiješalo test podatke sa stvarnim podacima (Dokument 11, sekcija 16: "Test podaci ne smiju koristiti produkcijske podatke").

`conftest.py` koristi **odvojenu, privremenu SQLite bazu** koja se kreira prije testova i briše nakon — tvoja stvarna baza ostaje netaknuta.

## Email — NIJE potreban WiFi, NIJE potreban SMTP_USER/SMTP_PASSWORD u .env za testove

Test suite **simulira (mock-uje)** slanje email-a — `conftest.py` ima `disable_real_email_sending` fixture koja zamjenjuje `send_email()`/`send_verification_email()` funkcije sa "lažnim" verzijama koje ne radi ništa, samo se pretvaraju da su poslale.

Razlog: testovi prave ~10+ novih korisnika kroz registraciju, što bi značilo isto toliko pokušaja stvarnog slanja email-a — sporo, zavisi od mreže (isti SMTP/mobilna mreža problem sa kojim smo se ranije susreli), i nepotrebno bi "spamovalo" inbox pri svakom pokretanju testova.

**Zaključak: pokreni testove sa bilo koje mreže, mobilne ili WiFi — nema veze, email se ne šalje stvarno tokom testiranja.** `.env` fajl i tvoj pravi SMTP_PASSWORD se ne dotiču ovim testovima.

