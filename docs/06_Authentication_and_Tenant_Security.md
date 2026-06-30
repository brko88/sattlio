# SmartBooking Platform — Authentication & Tenant Security (Production Level)

**Dokument:** 06 — Authentication & Tenant Security (Production Level)
**Verzija:** 1.0
**Status:** Final
**Datum:** 18.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše produkcijski sistem autentifikacije, autorizacije i izolacije podataka (multi-tenant security). Cilj je osigurati da: svaki korisnik vidi samo svoje podatke, svaka operacija ima validnu autorizaciju, sistem je siguran za SaaS produkciju, nema mogućnosti cross-tenant pristupa.

> **Napomena (implementacijska odluka):** U stvarnoj implementaciji (vidi Dokument 05, sekcija 7 i kod u `app/core/security.py`), odlučeno je da JWT payload sadrži **samo** `user_id`, NE `role` ni `active_tenant_id` kao što ovaj dokument predlaže u sekciji 3.1. Razlog: ako se token cacheuje sa starom rolom, promjena ovlaštenja usred sesije (npr. owner suspenduje employee-a) ne bi imala efekta dok token ne istekne. Role i tenant se čitaju iz baze pri svakom zahtjevu.

---

## 2. Osnovni sigurnosni principi

Sistem mora poštovati:
- Zero Trust model
- Role-Based Access Control (RBAC)
- Tenant Isolation (obavezno)
- Stateless Authentication (JWT)
- Least Privilege Access

---

## 3. Autentifikacija (Authentication)

### 3.1 JWT struktura (originalni prijedlog)

```json
{
  "user_id": 123,
  "active_tenant_id": 10,
  "role": "owner",
  "exp": 1710000000
}
```

*(Vidi napomenu na vrhu dokumenta — implementirana verzija sadrži samo `user_id`.)*

### 3.2 Token pravila
- Access token: 15–60 minuta
- Refresh token: 7–30 dana
- Token se šalje kroz Authorization header: `Authorization: Bearer <token>`

### 3.3 Password sigurnost
- bcrypt hashing
- minimalno 8 karaktera
- nikad plain text storage

### 3.4 Tenant Switching

Jedan korisnik može pripadati više tenant-a. Sistem mora omogućiti promjenu aktivnog tenant-a.

Prilikom promjene tenant-a: provjerava se UserTenantRole veza, generiše se novi JWT token, active_tenant_id se mijenja.

Korisnik može pristupati samo tenant-ima kojima pripada.

---

## 4. Login flow

1. korisnik šalje email + password
2. backend validira kredencijale
3. generiše JWT (access + refresh)
4. vraća token klijentu
5. klijent čuva token lokalno

---

## 5. Refresh token flow

- refresh token se čuva u bazi (hashed)
- može se revoke-ati
- koristi se za generisanje novog access tokena
- refresh token rotacija je obavezna

---

## 6. Middleware – Authentication

Svaki request (osim auth ruta) mora proći: validaciju JWT tokena, provjeru isteka tokena, ekstrakciju user_id, ekstrakciju active_tenant_id, ekstrakciju role.

Ako token nije validan: `HTTP 401 Unauthorized`

---

## 7. Tenant Isolation (KRITIČNO)

### 7.1 Osnovno pravilo

Svaki database query mora sadržavati:
```sql
WHERE tenant_id = current_context.active_tenant_id
```

### 7.2 Implementacija pravila

Tenant ID dolazi isključivo iz JWT tokena (u implementaciji: iz tenant_id parametra request-a, validiranog protiv UserTenantRole tabele — vidi napomenu na vrhu).

**ZABRANJENO:**
- ❌ tenant_id iz request body-ja
- ❌ tenant_id iz query parametara
- ❌ tenant_id iz URL parametara

### 7.3 Middleware injection

Request context mora sadržavati: current_user, current_tenant_id, current_role

### 7.4 Zabranjeni scenariji

Sistem mora blokirati: pokušaj pristupa tuđem tenant_id, ručno mijenjanje tenant_id u requestu, cross-tenant join upite, direktan pristup podacima drugog poslovnog subjekta.

---

## 8. Role-Based Access Control (RBAC)

### 8.1 Role hijerarhija

```
superadmin > owner > employee > customer
```

### 8.2 Pravila pristupa

**SUPERADMIN:** upravljanje cijelom platformom, pregled svih tenant-a, pregled svih korisnika

**OWNER:** upravljanje vlastitim tenant-om, upravljanje zaposlenima, upravljanje uslugama, pregled svih rezervacija tenant-a

**EMPLOYEE:** pregled vlastitog rasporeda, pregled vlastitih rezervacija, označavanje rezervacije kao završene

**CUSTOMER:** pregled vlastitih rezervacija, kreiranje rezervacija, otkazivanje vlastitih rezervacija

### 8.3 Permission decorator

Svaki endpoint mora imati: required_role provjeru, tenant validation, ownership validation

### 8.4 Ownership Validation

Pored role provjere, sistem mora provjeravati vlasništvo nad resursom.

Primjeri: customer može vidjeti samo svoje rezervacije, employee može vidjeti samo svoj raspored, owner može upravljati samo svojim tenant-om.

Role sama po sebi nije dovoljna za autorizaciju.

---

## 9. Authorization middleware

Sistem mora imati centralni autorizacioni layer.

```python
def require_role(role: str):
    pass

def get_current_user():
    pass
```

Autorizacija mora biti centralizovana i ne smije biti implementirana pojedinačno na svakom endpointu.

---

## 10. Tenant Context System

### 10.1 Request Lifecycle

```
Request
→ JWT validation
→ extract user
→ extract active_tenant_id
→ attach to request context
→ pass to services
→ execute business logic
```

### 10.2 Context Object

```python
class RequestContext:
    user_id: int
    tenant_id: int
    role: str
```

Request context predstavlja jedini izvor tenant informacija tokom izvršavanja zahtjeva.

---

## 11. Database Security Rules

### 11.1 Obavezno filter pravilo

Sve repository funkcije moraju automatski dodavati:
```sql
WHERE tenant_id = :tenant_id
```

### 11.2 Zabranjeno

- direktni SQL bez tenant filtera
- bypass repository layer-a
- hardkodirani query-ji
- pristup bazi direktno iz API layer-a

---

## 12. API Security Rules

- svi endpointi osim /auth zahtijevaju JWT
- tenant_id nikada nije input parametar
- role provjera prije izvršavanja akcije
- ownership provjera prije pristupa resursu

### 12.1 Email Verification Rules

Određene akcije nisu dozvoljene dok korisnik ne potvrdi email adresu.

Primjeri: kreiranje tenant-a, slanje pozivnica zaposlenima, marketplace funkcionalnosti, objava javnog poslovnog profila.

Sistem mora provjeravati email_verified status korisnika.

---

## 13. Session Handling

Sistem koristi stateless pristup. Nema server-side session storage. JWT predstavlja primarni izvor identiteta. Refresh token koristi se za obnovu sesije.

---

## 14. Logging i Audit Security

Svi osjetljivi događaji moraju biti evidentirani.

Primjeri: login attempts, failed logins, role changes, tenant data access, appointment changes, employee invitation actions.

### 14.1 Audit Events

Audit log mora sadržavati najmanje: login, logout, email verification, tenant switch, role change, employee invitation, appointment create, appointment update, appointment cancel, appointment complete.

---

## 15. Rate Limiting (Security Layer)

Sistem mora implementirati: 100 requests/min po korisniku, 10 login pokušaja/min, blokiranje IP adrese kod sumnjivog ponašanja, dodatne limite za auth endpoint-e.

---

## 16. Threat Model

Sistem mora biti zaštićen od: cross-tenant data leakage, brute force login napada, token theft, unauthorized API access, SQL injection napada, privilege escalation napada, CSRF napada gdje je primjenjivo.

### 16.1 Security Headers

API mora koristiti standardne sigurnosne HTTP headere: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Content-Security-Policy (gdje je primjenjivo)

---

## 17. Security Rules Summary

**OBAVEZNO:**
✔ tenant_id iz JWT-a (implementacija: validiran protiv UserTenantRole)
✔ RBAC na svakom endpointu
✔ ownership validation
✔ ORM filteri
✔ HTTPS
✔ hashed passwords
✔ token expiry
✔ email verification
✔ audit log
✔ refresh token rotacija

**ZABRANJENO:**
❌ tenant_id iz requesta (bez validacije)
❌ direktni DB access
❌ bypass auth middleware
❌ shared user context
❌ hardkodirani tenant filteri
❌ cross-tenant pristup

---

## 18. Zaključak

Ovaj dokument definiše sigurnosni temelj SmartBooking platforme. Bez implementacije ovih pravila sistem nije spreman za produkciju.

Svi budući moduli moraju biti kompatibilni sa ovim security modelom: multi-tenant izolacija, RBAC model, ownership validacija, audit logging, sigurnosni standardi definisani ovim dokumentom.

---

*Kraj dokumenta.*
