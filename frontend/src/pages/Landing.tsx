/**
 * Landing.tsx — javna marketing landing stranica platforme Sattlio
 *
 * Koristi centralni landingConfig.ts za sve parametre (boje, cijene, rute, API).
 * Svi značajni elementi imaju komentare na bosanskom/hrvatskom/srpskom.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ANIMATION,
  APPOINTMENT_STATUS_COLORS,
  BRAND,
  COLORS,
  CONTACT,
  FEATURES_ROADMAP,
  FEATURES_TODAY,
  LANDING_SECTIONS,
  PRICING_PLANS,
  ROUTES,
  SEO,
  SOCIAL_LINKS,
  SUBSCRIPTION,
  TARGET_INDUSTRIES,
  TYPOGRAPHY,
  annualPriceKM,
} from "../config/landingConfig";

// ---------------------------------------------------------------------------
// Landing — glavna komponenta stranice
// ---------------------------------------------------------------------------
function Landing() {
  // Postavlja dinamički <title> i meta description — Dok. 23 (SEO po stranici)
  useEffect(() => {
    document.title = SEO.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", SEO.description);
    }
  }, []);

  return (
    // Korijenski kontejner — puna visina ekrana, pozadina iz COLORS (Dok. 24)
    <div className={`min-h-screen ${COLORS.backgroundClass} ${TYPOGRAPHY.fontFamily}`}>
      {/* Fiksni header sa navigacijom i CTA dugmadima */}
      <LandingHeader />

      {/* Glavni sadržaj stranice — sekcije jedna ispod druge */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <IndustriesSection />
        <RoadmapSection />
        {/*<IntegrationSection />*/}
        <ContactSection />
      </main>

      {/* Podnožje sa društvenim mrežama i pravnim linkovima */}
      <LandingFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// LandingHeader — gornja navigaciona traka
// ---------------------------------------------------------------------------
function LandingHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navLinks = [
    { href: `#${LANDING_SECTIONS.features}`, label: "Funkcionalnosti" },
    { href: `#${LANDING_SECTIONS.pricing}`, label: "Cijene" },
    { href: `#${LANDING_SECTIONS.industries}`, label: "Industrije" },
    { href: `#${LANDING_SECTIONS.integration}`, label: "Integracija" },
  ];

  return (
    // Sticky header — ostaje vidljiv pri scroll-u (Dok. 09, mobile sticky akcije)
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo / naziv brenda — Link na početnu (ROUTES.home) */}
        <Link to={ROUTES.home} className="flex items-center gap-2">
          {/* SVG ikona kalendara — minimalistički logo stil (Dok. 24 sekcija 14) */}
          <span
            className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold"
            aria-hidden="true"
          >
            S
          </span>
          <span className="font-bold text-slate-900 text-lg">{BRAND.productName}</span>
        </Link>

        {/* Desktop navigacija — anchor linkovi ka sekcijama na istoj stranici */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={`${ANIMATION.transitionClass} hover:text-blue-600`}>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Akcije u headeru — prijava i registracija + mobilni hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sekundarno dugme — vodi na postojeću Login stranicu */}
          <Link
            to={ROUTES.login}
            className={`px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 border ${COLORS.borderClass} rounded-lg ${ANIMATION.transitionClass} hover:bg-slate-50`}
          >
            Prijavi se
          </Link>
          {/* Primarno dugme — glavni CTA ka registraciji (Dok. 09: jedno dominantno primary po stranici u hero/headeru) */}
          <Link
            to={ROUTES.register}
            className={`px-3 sm:px-4 py-2 text-sm font-medium text-white ${COLORS.primaryClass} rounded-lg ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
          >
            Registruj se
          </Link>
          {/* Hamburger dugme — samo na mobilnom, otvara padajući meni sa anchor linkovima */}
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Otvori meni"
            aria-expanded={mobileNavOpen}
            className="md:hidden p-2 -mr-2 text-slate-700"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileNavOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobilni padajući meni — anchor linkovi ka sekcijama */}
      {mobileNavOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1 text-sm text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileNavOpen(false)}
              className={`px-2 py-2.5 rounded-md ${ANIMATION.transitionClass} hover:bg-slate-50 hover:text-blue-600`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// HeroSection — prva sekcija, glavna poruka i CTA
// ---------------------------------------------------------------------------
function HeroSection() {
  return (
    // Hero — tamna pozadina (secondary boja, Dok. 24) za kontrast sa ostatkom stranice
    <section className={`${COLORS.secondaryClass} text-white`}>
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* Lijeva kolona — tekstualni sadržaj */}
        <div>
          {/* Badge sa trial periodom — SUBSCRIPTION.trialDays iz Dok. 13 */}
          <p className="inline-block px-3 py-1 mb-4 text-sm bg-blue-600/30 text-blue-200 rounded-full border border-blue-500/40">
            {SUBSCRIPTION.trialDays} dana besplatnog probnog perioda
          </p>

          {/* Glavni naslov — BRAND.productName + value proposition */}
          <h1 className={`${TYPOGRAPHY.heroTitleClass} text-white mb-4 leading-tight`}>
            {BRAND.productName} — rezervacije bez komplikacija
          </h1>

          {/* Tagline iz brand dokumenta */}
          <p className="text-lg text-slate-300 mb-3">{BRAND.tagline}</p>

          {/* Podnaslov — misija platforme */}
          <p className="text-slate-400 mb-8">{BRAND.subtitle}</p>

          {/* Brand vrijednosti kao badge-ovi */}
          <div className="flex flex-wrap gap-2 mb-8">
            {BRAND.values.map((value) => (
              <span
                key={value}
                className="px-3 py-1 text-xs bg-slate-700 text-slate-200 rounded-full border border-slate-600"
              >
                {value}
              </span>
            ))}
          </div>

          {/* CTA dugmad — primarna registracija + sekundarna prijava */}
          <div className="flex flex-wrap gap-4">
            <Link
              to={ROUTES.register}
              className={`px-6 py-3 ${COLORS.primaryClass} text-white font-medium rounded-xl ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
            >
              Započni besplatno — {SUBSCRIPTION.trialDays} dana
            </Link>
            <Link
              to={ROUTES.login}
              className={`px-6 py-3 bg-transparent border border-slate-500 text-white font-medium rounded-xl ${ANIMATION.transitionClass} hover:bg-slate-700`}
            >
              Već imam nalog
            </Link>
          </div>
        </div>

        {/* Desna kolona — vizuelni pregled statusa kalendara (Dok. 24 sekcija 12) */}
        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
          <p className="text-sm text-slate-400 mb-4">Pregled statusa termina u kalendaru</p>
          <div className="space-y-3">
            {APPOINTMENT_STATUS_COLORS.map((item) => (
              <div key={item.status} className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-3">
                {/* Boja statusa — kvadratić sa bojom iz design sistema */}
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-sm text-slate-200">{item.label}</span>
                <span className="text-xs text-slate-500 ml-auto">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FeaturesSection — šta platforma radi danas (Dok. 22)
// ---------------------------------------------------------------------------
function FeaturesSection() {
  return (
    // Sekcija sa id-jem za anchor navigaciju iz headera
    <section id={LANDING_SECTIONS.features} className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Naslov sekcije */}
        <h2 className={`${TYPOGRAPHY.sectionTitleClass} text-slate-900 text-center mb-3`}>
          Šta {BRAND.productName} radi danas
        </h2>
        <p className="text-slate-500 text-center mb-10 max-w-2xl mx-auto">
          Alat koji stvarno pomaže malim biznisima da organizuju termine — bez nepotrebne komplikacije.
        </p>

        {/* Grid kartica funkcionalnosti — Dok. 24: radius 12px, shadow sm, white bg */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES_TODAY.map((feature) => (
            <article
              key={feature.title}
              className={`${COLORS.cardClass} rounded-xl shadow-sm border ${COLORS.borderClass} p-6 ${ANIMATION.transitionClass} hover:shadow-md`}
            >
              <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// PricingSection — cjenovnik iz Dok. 13
// ---------------------------------------------------------------------------
function PricingSection() {
  return (
    <section id={LANDING_SECTIONS.pricing} className="py-16 md:py-20 bg-white border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className={`${TYPOGRAPHY.sectionTitleClass} text-slate-900 text-center mb-3`}>
          Jednostavan cjenovnik
        </h2>
        {/* Obavijest o ukinutom free planu — Dok. 13 sekcija 5 */}
        <p className="text-slate-500 text-center mb-2">
          {SUBSCRIPTION.trialDays} dana besplatno, zatim plaćeni paket.
        </p>
        <p className="text-sm text-blue-600 text-center mb-10">
          Godišnja pretplata: {SUBSCRIPTION.annualDiscountPercent}% popusta
        </p>

        {/* Grid cjenovnih paketa */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// PricingCard — pojedinačna kartica paketa
// ---------------------------------------------------------------------------
function PricingCard({ plan }: { plan: (typeof PRICING_PLANS)[number] }) {
  // Izračun godišnje cijene ako postoji mjesečna cijena
  const annual =
    plan.priceMonthlyKM !== null ? annualPriceKM(plan.priceMonthlyKM) : null;

  return (
    <article
      className={`rounded-xl border p-6 flex flex-col ${
        plan.highlighted
          ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
          : `${COLORS.borderClass} shadow-sm`
      } ${COLORS.cardClass}`}
    >
      {/* Naziv paketa */}
      <h3 className="font-bold text-lg text-slate-900 mb-1">{plan.name}</h3>
      {/* Cijena */}
      <p className="text-2xl font-bold text-blue-600 mb-1">{plan.priceLabel}</p>
      {/* Godišnja cijena sa popustom — prikaz samo za fiksne pakete */}
      {annual !== null && (
        <p className="text-xs text-slate-500 mb-3">
          ili {annual} KM/godišnje (−{SUBSCRIPTION.annualDiscountPercent}%)
        </p>
      )}
      {/* Limiti zaposlenih i lokacija */}
      <p className="text-sm text-slate-600 mb-1">{plan.employeeLimit}</p>
      <p className="text-sm text-slate-600 mb-4">{plan.locationLimit}</p>
      <p className="text-sm text-slate-500 mb-4 flex-1">{plan.description}</p>

      {/* Lista uključenih funkcionalnosti */}
      <ul className="text-sm text-slate-600 space-y-1 mb-4">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-green-500" aria-hidden="true">
              ✓
            </span>
            {f}
          </li>
        ))}
        {/* Lista isključenih stavki (npr. Solo paket) */}
        {plan.excluded?.map((f) => (
          <li key={f} className="flex gap-2 text-slate-400">
            <span aria-hidden="true">—</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA — Business vodi na kontakt, ostali na registraciju */}
      {plan.id === "business" ? (
        <a
          href={`#${LANDING_SECTIONS.contact}`}
          className={`block text-center px-4 py-2.5 border ${COLORS.borderClass} rounded-lg font-medium text-slate-700 ${ANIMATION.transitionClass} hover:bg-slate-50`}
        >
          {plan.ctaLabel}
        </a>
      ) : (
        <Link
          to={`${ROUTES.register}?plan=${plan.id}`}
          className={`block text-center px-4 py-2.5 ${COLORS.primaryClass} text-white rounded-lg font-medium ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
        >
          {plan.ctaLabel}
        </Link>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// IndustriesSection — ciljne industrije (Dok. 00 Growth Strategy)
// ---------------------------------------------------------------------------
function IndustriesSection() {
  return (
    <section id={LANDING_SECTIONS.industries} className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className={`${TYPOGRAPHY.sectionTitleClass} text-slate-900 text-center mb-10`}>
          Za sve uslužne djelatnosti
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Godina 1 — Beauty & Wellness */}
          <IndustryColumn title="Godina 1 — Beauty & Wellness" items={TARGET_INDUSTRIES.year1} />
          {/* Godina 2 — Services */}
          <IndustryColumn title="Godina 2 — Services" items={TARGET_INDUSTRIES.year2} />
          {/* Godina 3 — Health */}
          <IndustryColumn title="Godina 3 — Health" items={TARGET_INDUSTRIES.year3} />
        </div>
      </div>
    </section>
  );
}

function IndustryColumn({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className={`${COLORS.cardClass} rounded-xl border ${COLORS.borderClass} p-6 shadow-sm`}>
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm text-slate-600 flex gap-2">
            <span className="text-blue-600" aria-hidden="true">
              •
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RoadmapSection — planirane funkcionalnosti (Dok. 22)
// ---------------------------------------------------------------------------
function RoadmapSection() {
  return (
    <section id={LANDING_SECTIONS.roadmap} className="py-16 md:py-20 bg-white border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className={`${TYPOGRAPHY.sectionTitleClass} text-slate-900 text-center mb-3`}>
          Planirano u narednih 2 godine
        </h2>
        <p className="text-slate-500 text-center mb-10">
          Marketplace, mobilne aplikacije i napredne funkcionalnosti — sve na istom principu: jednostavno i korisno.
        </p>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {FEATURES_ROADMAP.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200"
            >
              <span className="text-blue-600 font-bold shrink-0" aria-hidden="true">
                →
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// IntegrationSection — rute i API za lakše povezivanje (Dok. 07, public.py)
// ---------------------------------------------------------------------------




// ---------------------------------------------------------------------------
// ContactSection — podrška (Dok. 22)
// ---------------------------------------------------------------------------
function ContactSection() {
  return (
    <section id={LANDING_SECTIONS.contact} className="py-16 md:py-20 bg-white border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className={`${TYPOGRAPHY.sectionTitleClass} text-slate-900 mb-3`}>
          Imate pitanja?
        </h2>
        <p className="text-slate-500 mb-6">
          Brza prijava problema — direktan kontakt sa podrškom u svakom trenutku.
        </p>

        {/* Email podrške iz CONTACT config-a */}
        <a
          href={`mailto:${CONTACT.supportEmail}`}
          className={`inline-block px-6 py-3 ${COLORS.primaryClass} text-white font-medium rounded-xl ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
        >
          {CONTACT.supportEmail}
        </a>

        <p className="text-sm text-slate-400 mt-4">
          Kanali: {CONTACT.supportChannels.join(" · ")} · WhatsApp: {CONTACT.whatsapp}
        </p>

        {/* Finalni CTA ka registraciji */}
        <div className="mt-10">
          <Link
            to={ROUTES.register}
            className={`inline-block px-8 py-3 ${COLORS.primaryClass} text-white font-medium rounded-xl ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
          >
            Kreiraj nalog — {SUBSCRIPTION.trialDays} dana besplatno
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// LandingFooter — podnožje sa društvenim mrežama (Dok. 27)
// ---------------------------------------------------------------------------
function LandingFooter() {
  return (
    <footer className={`${COLORS.secondaryClass} text-slate-400 py-10`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright i naziv brenda */}
          <div className="text-center md:text-left">
            <p className="font-semibold text-white">{BRAND.productName}</p>
            <p className="text-sm mt-1">
              © {new Date().getFullYear()} {BRAND.platformName}
            </p>
          </div>

          {/* Linkovi ka društvenim mrežama — SOCIAL_LINKS iz Dok. 27 */}
          <nav className="flex flex-wrap justify-center gap-4 text-sm">
            <SocialLink href={SOCIAL_LINKS.facebook} label="Facebook" />
            <SocialLink href={SOCIAL_LINKS.instagram} label="Instagram" />
            <SocialLink href={SOCIAL_LINKS.linkedin} label="LinkedIn" />
            <SocialLink href={SOCIAL_LINKS.youtube} label="YouTube" />
          </nav>

          {/* Brzi linkovi ka auth stranicama */}
          <div className="flex gap-4 text-sm">
            <Link to={ROUTES.login} className={`${ANIMATION.transitionClass} hover:text-white`}>
              Prijava
            </Link>
            <Link to={ROUTES.register} className={`${ANIMATION.transitionClass} hover:text-white`}>
              Registracija
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** SocialLink — eksterni link ka društvenoj mreži (otvara se u novom tabu) */
function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${ANIMATION.transitionClass} hover:text-white`}
    >
      {label}
    </a>
  );
}

export default Landing;
