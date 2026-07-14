/**
 * landingConfig.ts — centralna konfiguracija landing stranice
 *
 * Svi parametri su izvučeni iz projektne dokumentacije (docs/) i postojećeg koda
 * kako bi se landing stranica, SEO, cjenovnik, linkovi i API integracija
 * održavali na jednom mjestu bez duplog hardkodiranja.
 *
 * Izvori:
 * - docs/00_Product_Vision.md
 * - docs/07_Frontend_Architecture.md
 * - docs/09_UI_UX_Guidelines.md
 * - docs/13_SaaS_Pricing_and_Subscription_Model.md
 * - docs/22_Funkcionalnosti_Za_Korisnike.md
 * - docs/23_SEO_Strategija.md
 * - docs/24_Brand_Identity_Design_System.md
 * - docs/27_Strategija_Drustvenih_Mreza.md
 * - app/core/config.py (frontend_url)
 * - app/api/routes/public.py (javni API)
 * - frontend/src/services/api.ts (baseURL)
 * - frontend/src/App.tsx (rute)
 */

// ---------------------------------------------------------------------------
// BREND — Dokument 24 (Brand Identity) + Dokument 00 (Product Vision)
// ---------------------------------------------------------------------------
export const BRAND = {
  /** Radni naziv projekta u repozitoriju */
  platformName: "SmartBooking Platform",
  /** Predloženo finalno ime brenda (Dok. 24, odluka 28.06.2026.) */
  productName: "Sattlio",
  /** Kratki slogan na hero sekciji — ton iz Dok. 24 sekcija 3 */
  tagline: "Sve je jednostavno. Samo otvorite aplikaciju i rezervišete termin.",
  /** Podnaslov — misija iz Dok. 00 */
  subtitle:
    "SaaS platforma za upravljanje rezervacijama termina i poslovanjem uslužnih djelatnosti.",
  /** Brand vrijednosti koje landing treba prenijeti (Dok. 24, sekcija 2) */
  values: ["Profesionalan", "Moderan", "Jednostavan", "Pouzdan", "Brz", "Siguran"] as const,
} as const;

// ---------------------------------------------------------------------------
// BOJE — Dokument 24 (primarna paleta Opcija 1) + Dokument 09
// Tailwind klase mapiraju na postojeći frontend (Login.tsx, Layout.tsx)
// ---------------------------------------------------------------------------
export const COLORS = {
  /** Primarna — dugmad, linkovi, aktivni elementi (#2563EB, Blue 600) */
  primary: "#2563EB",
  primaryClass: "bg-blue-600",
  primaryHoverClass: "hover:bg-blue-700",
  primaryTextClass: "text-blue-600",
  /** Sekundarna — sidebar, tamne kartice (#1E293B, Slate 800) */
  secondary: "#1E293B",
  secondaryClass: "bg-slate-800",
  /** Success (#22C55E u Dok. 24, #16A34A u Dok. 09 — koristimo Tailwind green-500) */
  success: "#22C55E",
  /** Warning */
  warning: "#F59E0B",
  /** Danger */
  danger: "#EF4444",
  /** Pozadina stranice (#F8FAFC) */
  background: "#F8FAFC",
  backgroundClass: "bg-slate-50",
  /** Kartice (#FFFFFF) */
  card: "#FFFFFF",
  cardClass: "bg-white",
  /** Granice (#E2E8F0) */
  border: "#E2E8F0",
  borderClass: "border-slate-200",
} as const;

// ---------------------------------------------------------------------------
// TIPOGRAFIJA — Dokument 24, sekcija 5
// ---------------------------------------------------------------------------
export const TYPOGRAPHY = {
  fontFamily: "Inter, Arial, sans-serif",
  /** Naslovi hero: 32px Bold */
  heroTitleClass: "text-3xl md:text-4xl font-bold",
  /** Sekcije: 24px SemiBold */
  sectionTitleClass: "text-2xl font-semibold",
  /** Tekst: 16px Regular */
  bodyClass: "text-base",
  /** Sitni tekst: 14px */
  smallClass: "text-sm",
} as const;

// ---------------------------------------------------------------------------
// RESPONSIVE — Dokument 24 sekcija 13 (Desktop ≥1280, Tablet 768–1279, Mobile ≤767)
// ---------------------------------------------------------------------------
export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1279,
  desktopMin: 1280,
} as const;

// ---------------------------------------------------------------------------
// ANIMACIJE — Dokument 24, sekcija 15 (150–250 ms)
// ---------------------------------------------------------------------------
export const ANIMATION = {
  durationMs: 200,
  transitionClass: "transition-colors duration-200",
} as const;

// ---------------------------------------------------------------------------
// API — app/core/config.py, frontend/src/services/api.ts, public.py
// ---------------------------------------------------------------------------
export const API = {
  /** Backend base URL — usklađeno sa frontend/src/services/api.ts */
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
  /** Frontend URL iz app/core/config.py (frontend_url) — za email linkove i CTA */
  frontendURL: import.meta.env.VITE_FRONTEND_URL ?? "http://localhost:5173",
  /** Prefiks REST API-ja (Dok. 07, sekcija 7) */
  apiPrefix: "/api/v1",
  /** Javni endpointi bez autentifikacije — app/api/routes/public.py */
  publicEndpoints: {
    listEmployees: "GET /api/v1/public/employees",
    getEmployee: "GET /api/v1/public/employees/{employee_id}",
    employeeServices: "GET /api/v1/public/employees/{employee_id}/services",
    availableSlots:
      "GET /api/v1/public/employees/{employee_id}/slots?date_str=YYYY-MM-DD&service_id={id}",
    selfBookAppointment: "POST /api/v1/public/appointments",
  },
  /** Auth endpointi — frontend/src/pages/Login.tsx, Register.tsx */
  authEndpoints: {
    login: "POST /api/v1/auth/login",
    register: "POST /api/v1/auth/register",
    forgotPassword: "POST /api/v1/auth/forgot-password",
    resetPassword: "POST /api/v1/auth/reset-password",
    verifyEmail: "POST /api/v1/auth/verify-email",
  },
} as const;

// ---------------------------------------------------------------------------
// RUTE — frontend/src/App.tsx (trenutne) + docs/07 (buduće marketplace)
// ---------------------------------------------------------------------------
export const ROUTES = {
  /** Javna landing stranica (ova stranica) */
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  /** Javna self-booking ruta — BookAppointment.tsx */
  bookAppointment: "/book/:employeeId",
  /** Zaštićene rute unutar Layout.tsx */
  dashboard: "/dashboard",
  calendar: "/calendar",
  employees: "/employees",
  services: "/services",
  customers: "/customers",
  appointments: "/appointments",
  workingHours: "/working-hours",
  createTenant: "/create-tenant",
  admin: "/admin",
  /** Buduće marketplace rute — Dok. 07 sekcija 12, Dok. 09 sekcija 20 (još nisu implementirane) */
  future: {
    search: "/search",
    businessProfile: "/business/{slug}",
    categories: "/categories",
    map: "/map",
    nearby: "/nearby",
    businessPricing: "/business/{slug}/pricing",
    businessGallery: "/business/{slug}/gallery",
    profile: "/profile",
    tenantSwitch: "/tenant-switch",
    selectBusiness: "/select-business",
    businesses: "/businesses",
  },
} as const;

/** Anchor ID-jevi unutar landing stranice — za navigaciju iz headera */
export const LANDING_SECTIONS = {
  features: "features",
  pricing: "pricing",
  industries: "industries",
  roadmap: "roadmap",
  integration: "integration",
  contact: "contact",
} as const;

// ---------------------------------------------------------------------------
// PRETPLATA — Dokument 13 (SaaS Pricing), odluka 28.06.2026.
// ---------------------------------------------------------------------------
export const SUBSCRIPTION = {
  /** Trial period u danima — sekcija 4 Dok. 13 */
  trialDays: 14,
  /** Godišnji popust — sekcija 7 Dok. 13 */
  annualDiscountPercent: 20,
  /** Free plan ukinut — sekcija 5 Dok. 13 */
  freePlanRemoved: true,
} as const;

/** Cjenovni paketi — Dok. 13 sekcija 6 (finalna odluka) */
export type PricingPlanId = "solo" | "start" | "pro" | "business";

export interface PricingPlan {
  id: PricingPlanId;
  name: string;
  priceMonthlyKM: number | null;
  priceLabel: string;
  employeeLimit: string;
  locationLimit: string;
  description: string;
  features: readonly string[];
  excluded?: readonly string[];
  highlighted?: boolean;
  ctaLabel: string;
}

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: "solo",
    name: "Solo",
    priceMonthlyKM: 14.9,
    priceLabel: "14,90 KM/mj",
    employeeLimit: "1 zaposleni",
    locationLimit: "1 lokacija",
    description: "Salon/obrt sa jednim zaposlenim — najveći segment tržišta (78–80%).",
    features: [
      "Upravljanje zaposlenima, uslugama, klijentima",
      "Vizuelni kalendar rezervacija",
      "Radno vrijeme po zaposlenom",
      "Osnovni dashboard",
      "Neograničen broj rezervacija mjesečno",
    ],
    excluded: ["Email notifikacije", "Eksport podataka", "Više lokacija"],
    highlighted: true,
    ctaLabel: "Započni probni period",
  },
  {
    id: "start",
    name: "Start",
    priceMonthlyKM: 29.9,
    priceLabel: "29,90 KM/mj",
    employeeLimit: "2–4 zaposlena",
    locationLimit: "1 lokacija",
    description: "Mali saloni sa nekoliko zaposlenih.",
    features: ["Sve iz Solo paketa", "Email notifikacije (uskoro)"],
    ctaLabel: "Započni probni period",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthlyKM: 59.9,
    priceLabel: "59,90 KM/mj",
    employeeLimit: "5–15 zaposlenih",
    locationLimit: "do 3 lokacije",
    description: "Srednji poslovni subjekti.",
    features: [
      "Sve iz Start paketa",
      "Napredni dashboard",
      "Izvještaji i eksport podataka",
      "Napredna pretraga",
      "Više lokacija (do 3)",
    ],
    ctaLabel: "Započni probni period",
  },
  {
    id: "business",
    name: "Business",
    priceMonthlyKM: null,
    priceLabel: "Po dogovoru",
    employeeLimit: "15+ zaposlenih",
    locationLimit: "Neograničeno lokacija",
    description: "Veliki sistemi i lanci — prilagođen pristup pojedinačno.",
    features: ["Custom integracije", "Dedicated podrška", "SLA ugovor"],
    ctaLabel: "Kontaktirajte nas",
  },
] as const;

/** Izračun godišnje cijene sa popustom — Dok. 13 sekcija 7 */
export function annualPriceKM(monthlyPrice: number): number {
  const fullYear = monthlyPrice * 12;
  return Math.round(fullYear * (1 - SUBSCRIPTION.annualDiscountPercent / 100));
}

// ---------------------------------------------------------------------------
// FUNKCIONALNOSTI — Dokument 22 (šta radi danas + roadmap)
// ---------------------------------------------------------------------------
export const FEATURES_TODAY = [
  { title: "Upravljanje zaposlenima", description: "Dodajte, uredite i deaktivirajte tim." },
  { title: "Cjenovnik usluga", description: "Definišite trajanje, cijenu i status usluga." },
  { title: "Baza klijenata", description: "Pretraga i historija svih klijenata." },
  { title: "Radno vrijeme", description: "Individualno radno vrijeme po zaposlenom." },
  { title: "Vizuelni kalendar", description: "Pregled i upravljanje terminima na jednom mjestu." },
  { title: "Automatska provjera preklapanja", description: "Sistem sprečava duple rezervacije." },
  { title: "Statusi termina", description: "Zakazan, potvrđen, završen, otkazan — boje po statusu." },
  { title: "Više salona / lokacija", description: "Upravljanje više poslovnih subjekata sa jednog naloga." },
  { title: "Responsive pristup", description: "Rad sa računara i telefona kroz browser." },
  { title: "Provjera legitimnosti", description: "Svaki salon prolazi provjeru prije aktivacije." },
] as const;

export const FEATURES_ROADMAP = [
  "Mobilna aplikacija (Android / iOS)",
  "Javni profil salona (Marketplace)",
  "Online plaćanje pretplate",
  "SMS i WhatsApp obavještenja",
  "Integracija sa Google/Apple kalendarom",
  "Lista čekanja i VIP klijenti",
  "Affiliate / program preporuke",
] as const;

// ---------------------------------------------------------------------------
// INDUSTRIJE — Dokument 00 (Long-Term Vision + Growth Strategy)
// ---------------------------------------------------------------------------
export const TARGET_INDUSTRIES = {
  year1: ["Frizerski saloni", "Barber saloni", "Kozmetički saloni", "Masažni studiji"],
  year2: ["Automehaničari", "Vulkanizeri", "Servisi računara", "Servisi mobilnih telefona"],
  year3: ["Stomatolozi", "Fizioterapeuti", "Privatne ordinacije"],
} as const;

// ---------------------------------------------------------------------------
// SEO — Dokument 23 (meta tagovi za javne stranice)
// ---------------------------------------------------------------------------
export const SEO = {
  title: "Sattlio — Rezervacije termina za salone i uslužne djelatnosti",
  description:
    "Jednostavna SaaS platforma za upravljanje rezervacijama, zaposlenima, klijentima i kalendarom. 14 dana besplatnog probnog perioda.",
  keywords:
    "rezervacije, booking, salon, frizer, kalendar, SaaS, BiH, Sattlio, SmartBooking, upravljanje terminima",
  ogType: "website",
  locale: "bs_BA",
  /** robots.txt preporuka — Dok. 23: javna landing indeksirati, dashboard blokirati */
  robotsPublic: "index, follow",
} as const;

// ---------------------------------------------------------------------------
// DRUŠTVENE MREŽE — Dokument 27 (Faza 0 — rezervacija korisničkih imena)
// ---------------------------------------------------------------------------
export const SOCIAL_LINKS = {
  facebook: "https://facebook.com/sattlio",
  instagram: "https://instagram.com/sattlio",
  linkedin: "https://linkedin.com/company/sattlio",
  youtube: "https://youtube.com/@sattlio",
} as const;

// ---------------------------------------------------------------------------
// KONTAKT I PODRŠKA — Dokument 22
// ---------------------------------------------------------------------------
export const CONTACT = {
  supportEmail: "podrska@sattlio.com",
  generalEmail: "info@sattlio.com",
  supportChannels: ["Email"] as const,
} as const;

// ---------------------------------------------------------------------------
// KALENDAR STATUS BOJE — Dokument 24 sekcija 12 (za vizuelni prikaz na landingu)
// ---------------------------------------------------------------------------
export const APPOINTMENT_STATUS_COLORS = [
  { status: "Scheduled", color: "#2563EB", label: "Zakazan" },
  { status: "Confirmed", color: "#22C55E", label: "Potvrđen" },
  { status: "Completed", color: "#64748B", label: "Završen" },
  { status: "Cancelled", color: "#EF4444", label: "Otkazan" },
  { status: "No Show", color: "#F59E0B", label: "Nije došao" },
] as const;

// ---------------------------------------------------------------------------
// i18n — Dokument 07 sekcija 10, Dokument 09 sekcija 22 (planirani jezici)
// ---------------------------------------------------------------------------
export const I18N = {
  defaultLocale: "bs",
  supportedLocales: ["bs", "en"] as const,
  plannedLocales: ["hr", "sr", "de"] as const,
} as const;
