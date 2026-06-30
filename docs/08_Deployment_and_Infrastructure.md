# SmartBooking Platform — Deployment & Infrastructure (CI/CD)

**Dokument:** 08 — Deployment & Infrastructure (CI/CD)
**Verzija:** 1.0
**Status:** Final
**Datum:** 19.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše način deployanja, hostinga, CI/CD procesa i infrastrukture SmartBooking platforme. Cilj: stabilno produkcijsko okruženje, automatizovan deployment, skalabilna arhitektura, minimalan downtime, sigurno upravljanje podacima, jednostavno održavanje sistema.

> **Napomena (vidi Dokument 14):** Većina ovog dokumenta (Docker, CI/CD, monitoring) odgovara Fazi D u realnom razvojnom planu — uvodi se kad sistem ima prve stvarne korisnike, ne od prvog dana razvoja.

---

## 2. Okruženja

Sistem ima 3 okruženja.

### 2.1 Development
lokalni Docker setup, lokalni PostgreSQL, lokalni Redis, FastAPI hot reload, React development server

### 2.2 Staging
testna verzija produkcije, koristi se za testiranje novih feature-a, isti setup kao production, test email servisi, test deploy proces

### 2.3 Production
live sistem, realni korisnici, striktna kontrola deploya, monitoring, backup sistem, SSL zaštita

---

## 3. Infrastruktura

**MVP faza:** 1 VPS server (DigitalOcean ili Hetzner), Docker Compose, Nginx reverse proxy, PostgreSQL, Redis, Let's Encrypt SSL

**Kasnija faza:** odvojeni DB server, load balancer, više API instanci, Redis cluster, CDN za frontend, object storage za slike i dokumente

---

## 4. Docker arhitektura

Sistem se pokreće preko Docker Compose.

Servisi: backend (FastAPI), frontend (React build), database (PostgreSQL), redis, celery_worker, celery_beat

### 4.1 Background Processing

Sistem koristi Celery + Redis za: email verifikaciju, slanje email notifikacija, generisanje izvještaja, buduće podsjetnike za rezervacije.

Background procesi moraju biti odvojeni od API servera.

```yaml
services:
  backend:
    build: ./backend
  frontend:
    build: ./frontend
  db:
    image: postgres:15
  redis:
    image: redis:7
  celery_worker:
    build: ./backend
  celery_beat:
    build: ./backend
```

---

## 5. Nginx konfiguracija

Nginx služi kao reverse proxy.

Routing: `/` → frontend, `/api` → backend

Pravila: HTTPS obavezno, HTTP → HTTPS redirect, gzip compression, caching static assets, osnovna zaštita od napada.

---

## 6. CI/CD Pipeline

GitHub Actions — sistem automatski: 1) build backend, 2) build frontend, 3) run tests, 4) build docker image, 5) push image, 6) deploy na server

```
Git Push → GitHub Actions → Build → Test → Docker Build → Deploy → Restart Services
```

---

## 7. Git Workflow

Koriste se grane: main, develop, feature/*

Pravila: develop za aktivni razvoj, main za produkciju, feature grane za pojedinačne funkcionalnosti.

---

## 8. Deployment strategija

**Blue-Green deployment (kasnije):** nova verzija se diže paralelno, testira se, prebacuje se traffic

**MVP deployment:** direktan deploy na server, restart Docker container-a

---

## 9. Database deployment

Pravila: migracije kroz Alembic, nikad ručne izmjene u produkciji, backup prije svake migracije, rollback plan obavezan.

**Backup strategija:** dnevni backup baze, čuvanje 7–30 dana, automatski restore test.

---

## 10. Environment variables

Svi osjetljivi podaci idu u: `.env` (development), secrets manager (production)

Primjeri: `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET`, `REDIS_URL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`

---

## 11. Monitoring

Sistem mora imati: server monitoring (CPU, RAM, disk), API monitoring, error tracking, uptime monitoring, database monitoring, Redis monitoring, Celery monitoring.

**Alati (kasnije):** Prometheus, Grafana, Sentry

---

## 12. Logging

Svi logovi: auth events, API requests, errors, database operations, background jobs, deployment događaji.

Log format:
```json
{ "timestamp": "", "level": "", "service": "", "message": "" }
```

---

## 13. Security (Infrastructure Level)

HTTPS obavezno, firewall (samo potrebni portovi otvoreni), DB nije javno dostupan, SSH key authentication, automatske sigurnosne nadogradnje servera, zaštita od brute-force napada.

### 13.1 Data Protection

Sistem mora osigurati: šifrovanu HTTPS komunikaciju, zaštitu korisničkih podataka, sigurnu pohranu lozinki, redovne sigurnosne nadogradnje.

Svi osjetljivi podaci moraju biti zaštićeni u skladu sa važećim propisima o zaštiti podataka.

---

## 14. Backup & Recovery

**Backup plan:** dnevni DB backup, sedmični puni snapshot servera, offsite storage (S3 ili slično)

**Recovery plan:** restore DB, redeploy containers, verify integrity, provjera funkcionalnosti aplikacije

---

## 15. Domain & SSL

custom domain, SSL certifikat (Let's Encrypt), automatska obnova certifikata, HTTPS redirect

---

## 16. Deployment Flow (Manual MVP)

1. git pull na serveru
2. docker compose build
3. docker compose up -d
4. pokretanje migracija
5. restart nginx
6. provjera logova

---

## 17. Deployment Flow (CI/CD)

1. developer push-a kod
2. GitHub Actions builda image
3. pokreću se testovi
4. image se deploya
5. migracije se izvršavaju
6. servisi se restartuju
7. health check validacija

---

## 18. Rollback Strategija

Ako deployment ne uspije: rollback na prethodni Docker image, restore DB backup (po potrebi), restart sistema, provjera integriteta podataka.

---

## 19. Downtime Policy

Cilj: manje od 5 minuta downtime-a po deployu (MVP), nula downtime-a u budućnosti (Blue-Green deployment)

---

## 20. Zaključak

Ovaj dokument definiše kompletan životni ciklus SmartBooking platforme u produkciji. Bez ovog sloja sistem nije SaaS proizvod.

Sa ovim slojem: sistem postaje deployable, skalabilan, održiv, siguran, spreman za korisnike, spreman za buduće širenje na više država i tržišta.

---

*Kraj dokumenta.*
