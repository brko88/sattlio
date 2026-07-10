/**
 * Centralna lista svih INTERNIH ruta aplikacije (prvi segment putanje).
 *
 * Koristi se u App.tsx (PublicOrApp) da razlikuje interne rute od javnih
 * salon slug-ova (npr. /frizerski-konj).
 *
 * VAŽNO: Svaki put kad dodaš novu top-level rutu u bilo koji layout
 * (OwnerLayout, EmployeeLayout, CustomerLayout, AdminLayout), dodaj njen
 * prvi segment OVDJE. Inače će je /:slug ruta presresti i prikazati
 * "Salon nije pronađen" (bug se već desio sa /dashboard i /profile).
 */
export const RESERVED_PATHS = new Set<string>([
    // Owner / Employee
    "dashboard",
    "calendar",
    "appointments",
    "customers",
    "services",
    "employees",
    "working-hours",
    "settings",
    // Onboarding / tenant
    "create-tenant",
    "onboarding",
    // Customer
    "my-appointments",
    "book",
    "profile",
    // Admin
    "admin",
  ]);
  
  /** Vraća true ako je prvi segment putanje interna ruta (ne salon slug). */
  export function isReservedPath(pathname: string): boolean {
    const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
    return RESERVED_PATHS.has(firstSegment);
  }