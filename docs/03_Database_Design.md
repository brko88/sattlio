# SmartBooking Platform — Database Design (ERD + Schema)

**Dokument:** 03 — Database Design (ERD + Schema)
**Verzija:** 1.0
**Status:** Draft
**Datum:** 18.06.2026.

---

## 1. Svrha dokumenta

Ovaj dokument definiše kompletnu strukturu baze podataka SmartBooking platforme. Obuhvata: entitete, relacije, primarne i strane ključeve, indeksiranje, multi-tenant model, pravila integriteta podataka.

---

## 2. Osnovni princip baze

Sistem koristi single database multi-tenant model. Svaka tabela koja sadrži poslovne podatke mora imati `tenant_id`. Ovo omogućava logičku izolaciju podataka između poslovnih subjekata.

---

## 3. Glavni entiteti sistema

- users
- user_tenant_roles
- tenants (business)
- locations
- employees
- customers
- services
- appointments
- working_hours
- employee_services
- audit_logs

---

## 4. ERD (logički prikaz)

```
User
 │
 └── UserTenantRole
       │
       └── Tenant
             ├── Location
             ├── Employee
             ├── Customer
             ├── Service
             ├── Appointment
             └── WorkingHours

Employee
 └── EmployeeServices (M:N)
```

---

## 5. Tabele

### 5.1 users

Tabela korisničkih naloga sistema.

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| email | unique |
| password_hash | |
| email_verified | |
| preferred_language | |
| is_active | |
| created_at | |
| updated_at | |

**Indeksi:** email (unique)

#### 5.1.1 user_tenant_roles

Veza između korisnika, tenant-a i uloge.

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| user_id | FK |
| tenant_id | FK |
| role | owner \| employee \| customer \| superadmin |
| created_at | |
| updated_at | |

Pravila: Jedan korisnik može imati više zapisa.

Primjer:
```
User A → Owner u Tenant A
User A → Employee u Tenant B
User A → Customer u Tenant C
```

**Indeksi:** user_id, tenant_id, role, (user_id + tenant_id) UNIQUE

### 5.2 tenants (business)

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| name | |
| slug | |
| business_category | |
| description | |
| address | |
| city | |
| country | |
| phone | |
| email | |
| logo_url | |
| timezone | |
| currency | |
| created_at | |
| updated_at | |

**Indeksi:** name, city

#### 5.2.1 locations

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| tenant_id | FK |
| name | |
| address | |
| city | |
| country | |
| phone | |
| latitude | |
| longitude | |
| is_active | |
| created_at | |
| updated_at | |

Jedan tenant može imati više lokacija. MVP koristi jednu lokaciju. Arhitektura podržava više lokacija.

**Indeksi:** tenant_id, city

### 5.3 employees

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| tenant_id | FK |
| user_id | FK nullable |
| first_name | |
| last_name | |
| phone | |
| email | |
| is_active | |
| created_at | |
| updated_at | |

**Relacije:** employee belongs to tenant; optional link to users

### 5.4 customers

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| tenant_id | FK |
| first_name | |
| last_name | |
| phone | |
| email | |
| notes | |
| created_at | |
| updated_at | |
| created_by_user_id | FK nullable |

**Napomena:** Klijent može biti registrovani korisnik platforme, ili osoba za koju je rezervaciju kreirao drugi korisnik.

**Indeksi:** phone, email, tenant_id

### 5.5 services

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| tenant_id | FK |
| name | |
| description | |
| duration_minutes | |
| price | |
| color | |
| is_active | |
| created_at | |
| updated_at | |

### 5.6 employee_services (M:N)

Veza između zaposlenih i usluga.

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| tenant_id | FK |
| employee_id | FK |
| service_id | FK |

### 5.7 working_hours

Radno vrijeme po zaposlenom.

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| tenant_id | FK |
| employee_id | FK |
| day_of_week | 0–6 |
| start_time | |
| end_time | |
| is_working_day | |

### 5.8 appointments

Glavna tabela sistema.

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| tenant_id | FK |
| location_id | FK |
| customer_id | FK |
| employee_id | FK |
| service_id | FK |
| created_by_user_id | FK |
| start_time | |
| end_time | |
| status | created \| confirmed \| cancelled \| completed \| no_show |
| notes | |
| created_at | |
| updated_at | |

**Indeksi:** tenant_id + start_time, employee_id + start_time, customer_id, status

**Pravila integriteta:**
- ne smije postojati overlap za isti employee
- start_time < end_time
- service duration mora odgovarati end_time - start_time

### 5.9 audit_logs

| Kolona | Tip / Napomena |
|---|---|
| id | PK |
| tenant_id | |
| user_id | |
| action | |
| entity_type | |
| entity_id | |
| timestamp | |
| metadata | JSON |

**Indeksi:** tenant_id, user_id, entity_type, timestamp

---

## 6. Relacije (detaljno)

**Tenant → sve** — jedan tenant ima više: employees, customers, services, appointments, working_hours, locations

**Employee → Services (M:N)** — jedan employee može imati više services; jedan service može imati više employees

**Employee → WorkingHours** — jedan employee ima više working_hours (po danima)

**Customer → Appointments** — jedan customer ima više appointments

**Employee → Appointments** — jedan employee ima više appointments

**User → UserTenantRoles** — jedan user može imati više user_tenant_roles zapisa

**Tenant → UserTenantRoles** — jedan tenant može imati više user_tenant_roles zapisa

---

## 7. Multi-tenant pravila

Svi upiti moraju sadržavati:
```sql
WHERE tenant_id = current_tenant
```

Nije dozvoljen cross-tenant pristup.

---

## 8. Indeksna strategija

Obavezni indeksi:
- tenant_id (svuda)
- (tenant_id + start_time)
- (tenant_id + employee_id)
- (tenant_id + customer_id)

---

## 9. Performanse

Sistem mora biti optimizovan za: velike kalendarske upite, filtriranje po datumu, prikaz dnevnog rasporeda.

---

## 10. Pravila brisanja (CASCADE policy)

- tenant deletion → briše sve podatke
- employee deletion → ne briše appointments (samo soft delete)
- customer deletion → zadržava historiju appointments
- service deletion → ne briše historiju

---

## 11. Soft delete strategija

Tabele koje podržavaju soft delete: employees, customers, services.

Polja: `is_deleted`, `deleted_at`

---

## 12. Skalabilnost baze

Baza mora podržavati: read replicas (kasnije), partitioning po tenant_id (veliki sistemi), caching sloj (Redis).

---

## 13. Migracije

Sve promjene baze moraju ići kroz Alembic migrations. Nije dozvoljena direktna izmjena produkcijske baze.

---

## 14. Zaključak

Ovaj model baze predstavlja stabilnu osnovu za: MVP verziju, mobilne aplikacije, marketplace, AI funkcionalnosti, skaliranje na više zemalja.

Promjene u ovom modelu su moguće, ali moraju biti dokumentovane kroz Project Blueprint sistem.

---

*Kraj dokumenta.*
