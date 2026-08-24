/**
 * Landing.tsx — javna marketing landing stranica platforme Sattlio
 *
 * Koristi centralni landingConfig.ts za sve parametre (boje, cijene, rute, API).
 * Svi značajni elementi imaju komentare na bosanskom/hrvatskom/srpskom.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";
import {
  ANIMATION,
  APPOINTMENT_STATUS_COLORS,
  BRAND,
  COLORS,
  CONTACT,
  FEATURES_TODAY,
  LANDING_SECTIONS,
  ROUTES,
  SEO,
  SOCIAL_LINKS,
  SUBSCRIPTION,
  TYPOGRAPHY,
  annualPriceKM,
} from "../config/landingConfig";
import {
  MINI_ROADMAP_KEYS,
  ROADMAP,
  ROADMAP_STATUS_META,
  miniRoadmapItems,
} from "../config/roadmapConfig";

interface PricingPlan {
  key: string;
  name: string;
  price_bam: number | null;
  price_label: string;
  price_conversion_label: string | null;
  employee_limit: number | null;
  employee_limit_label: string;
  location_limit_label: string;
  description: string;
  features: string[];
  excluded: string[];
  highlighted: boolean;
  cta_label: string;
}

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
        <LossCalculatorSection />
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
  // "/" se prikazuje SVIMA (i ulogovanim), jer je top-level ruta van
  // RoleRouter-a - bez ovoga bi ulogovan korisnik i dalje vidio "Prijavi
  // se/Registruj se". "/dashboard" je sigurna meta za bilo koju ulogu -
  // svaki RoleRouter blok ima fallback (`path="*"`) koji vlasnika/radnika
  // vodi na njihov dashboard, a klijenta/superadmina na njihovu stvarnu
  // pocetnu rutu.
  const isLoggedIn = !!localStorage.getItem("access_token");

  /**
   * Stavke sa `href` su sidra na ovoj stranici, stavke sa `to` vode na zasebnu
   * rutu.
   *
   * Roadmap NAMJERNO vodi na punu stranicu, ne na sidro: mini sekcija je peta
   * od šest na landingu, pa je skok na nju bacao posjetioca na 85% stranice
   * (scrollbar skoro na dnu, ispod samo kontakt i podnožje) — djelovalo je kao
   * da ga je odvelo na kraj. Puna stranica je ionako ono što stavka obećava.
   */
  const navLinks: { label: string; href?: string; to?: string }[] = [
    { href: `#${LANDING_SECTIONS.features}`, label: "Funkcionalnosti" },
    { href: `#${LANDING_SECTIONS.pricing}`, label: "Cijene" },
    { href: `#${LANDING_SECTIONS.calculator}`, label: "Kalkulator" },
    // Ranije je ovdje stajala "Integracija" → #integration, sekcija koja nikad
    // nije napravljena (mrtav link).
    { to: ROUTES.roadmap, label: "Roadmap" },
  ];

  return (
    // Sticky header — ostaje vidljiv pri scroll-u (Dok. 09, mobile sticky akcije)
    <header className="sticky top-[env(safe-area-inset-top)] z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo / naziv brenda — vidi components/BrandLogo.tsx */}
        <BrandLogo />

        {/* Desktop navigacija — sidra na ovoj stranici + linkovi ka zasebnim rutama */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {navLinks.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                className={`${ANIMATION.transitionClass} hover:text-blue-600`}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className={`${ANIMATION.transitionClass} hover:text-blue-600`}
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Akcije u headeru — prijava i registracija + mobilni hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            /* Vec ulogovan - profil/odjava vec postoje unutar app-a (OwnerLayout
               i sl.), ovdje samo jedno dugme da ga tamo odvede umjesto da
               duplira citav profilni meni na marketing stranici. */
            <Link
              to={ROUTES.dashboard}
              className={`px-3 sm:px-4 py-2 text-sm font-medium text-white ${COLORS.primaryClass} rounded-lg ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
            >
              Idi na kontrolnu tablu
            </Link>
          ) : (
            <>
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
            </>
          )}
          {/* Hamburger dugme — samo na mobilnom, otvara padajući meni sa anchor linkovima */}
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Otvori meni"
            aria-expanded={mobileNavOpen}
            className="md:hidden p-2 -mr-2 text-slate-700 min-w-11 flex items-center justify-center"
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

      {/* Mobilni padajući meni — ista lista, sidra i rute */}
      {mobileNavOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1 text-sm text-slate-600">
          {navLinks.map((link) => {
            const itemClass = `px-2 py-2.5 rounded-md ${ANIMATION.transitionClass} hover:bg-slate-50 hover:text-blue-600`;
            return link.to ? (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileNavOpen(false)}
                className={itemClass}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className={itemClass}
              >
                {link.label}
              </a>
            );
          })}
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
    <section id={LANDING_SECTIONS.features} className="scroll-mt-24 py-16 md:py-20">
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
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/v1/public/plans")
      .then((res) => setPlans(res.data))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id={LANDING_SECTIONS.pricing} className="scroll-mt-24 py-16 md:py-20 bg-white border-y border-slate-200">
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
        {loading ? (
          <p className="text-center text-slate-400">Učitavanje paketa...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <PricingCard key={plan.key} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// PricingCard — pojedinačna kartica paketa
// ---------------------------------------------------------------------------
function PricingCard({ plan }: { plan: PricingPlan }) {
  // Izračun godišnje cijene ako postoji mjesečna cijena
  const annual =
    plan.price_bam !== null ? annualPriceKM(plan.price_bam) : null;

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
      <p className="text-2xl font-bold text-blue-600 mb-1">{plan.price_label}</p>
      {/* Okvirna cijena u EUR/RSD — za posjetioce iz Srbije/Hrvatske, da ne
          moraju sami računati konverziju. EUR je tačan (BAM/EUR je fiksni
          currency board kurs), RSD je okvirna (tržišni kurs, vidi plans.py). */}
      {plan.price_conversion_label && (
        <p className="text-xs text-slate-400 mb-1">{plan.price_conversion_label}</p>
      )}
      {/* Godišnja cijena sa popustom — prikaz samo za fiksne pakete */}
      {annual !== null && (
        <p className="text-xs text-slate-500 mb-3">
          ili {annual} KM/godišnje (−{SUBSCRIPTION.annualDiscountPercent}%)
        </p>
      )}
      {/* Limiti zaposlenih i lokacija */}
      <p className="text-sm text-slate-600 mb-1">{plan.employee_limit_label}</p>
      <p className="text-sm text-slate-600 mb-4">{plan.location_limit_label}</p>
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
      {plan.key === "business" ? (
        <a
          href={`#${LANDING_SECTIONS.contact}`}
          className={`block text-center px-4 py-2.5 border ${COLORS.borderClass} rounded-lg font-medium text-slate-700 ${ANIMATION.transitionClass} hover:bg-slate-50`}
        >
          {plan.cta_label}
        </a>
      ) : (
        <Link
          to={`${ROUTES.register}?plan=${plan.key}`}
          className={`block text-center px-4 py-2.5 ${COLORS.primaryClass} text-white rounded-lg font-medium ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
        >
          {plan.cta_label}
        </Link>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// LossCalculatorSection — interaktivni kalkulator gubitka od nedolazaka.
// Zamijenio raniju IndustriesSection (odluka 05.08.2026.) — chip lista
// djelatnosti manje uvjerljiva od konkretne cifre. Cijena za poređenje je
// istaknuti (highlighted) paket iz istog /public/plans endpointa koji koristi
// PricingSection, ne hardkodovana vrijednost — ostaje tačna ako se plans.py
// ikad promijeni.
// ---------------------------------------------------------------------------
function LossCalculatorSection() {
  const [avgPrice, setAvgPrice] = useState(30);
  const [noShows, setNoShows] = useState(3);
  const [highlightedPlan, setHighlightedPlan] = useState<PricingPlan | null>(null);

  useEffect(() => {
    api
      .get("/api/v1/public/plans")
      .then((res) => {
        const plans = res.data as PricingPlan[];
        setHighlightedPlan(plans.find((p) => p.highlighted) ?? null);
      })
      .catch(() => setHighlightedPlan(null));
  }, []);

  // Prosjek 4.33 sedmice/mjesec (52/12), ne grubo x4 — tačnije na duži rok.
  const monthlyLoss = Math.round(avgPrice * noShows * (52 / 12));
  const annualLoss = Math.round(avgPrice * noShows * 52);
  const planPrice = highlightedPlan?.price_bam ?? null;
  const netMonthly = planPrice !== null ? Math.round(monthlyLoss - planPrice) : null;

  return (
    <section id={LANDING_SECTIONS.calculator} className="scroll-mt-24 py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className={`${TYPOGRAPHY.sectionTitleClass} text-slate-900 text-center mb-3`}>
          Koliko gubite na nedolascima?
        </h2>
        <p className="text-slate-500 text-center mb-10 max-w-2xl mx-auto">
          Svaki nedolazak je prazan termin koji niko drugi nije mogao rezervisati. Pomjerite
          klizače i vidite pravu cifru.
        </p>

        <div className={`${COLORS.cardClass} rounded-xl shadow-sm border ${COLORS.borderClass} p-6 md:p-10`}>
          {/* Dva klizača — cijena usluge i broj nedolazaka sedmično */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label htmlFor="calc-price" className="text-sm font-medium text-slate-700">
                  Prosječna cijena usluge
                </label>
                <span className="text-lg font-bold text-blue-600">{avgPrice} KM</span>
              </div>
              <input
                id="calc-price"
                type="range"
                min={10}
                max={200}
                step={5}
                value={avgPrice}
                onChange={(e) => setAvgPrice(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>10 KM</span>
                <span>200 KM</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label htmlFor="calc-noshows" className="text-sm font-medium text-slate-700">
                  Nedolasci sedmično
                </label>
                <span className="text-lg font-bold text-blue-600">{noShows}</span>
              </div>
              <input
                id="calc-noshows"
                type="range"
                min={0}
                max={15}
                step={1}
                value={noShows}
                onChange={(e) => setNoShows(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0</span>
                <span>15</span>
              </div>
            </div>
          </div>

          {/* Rezultat — gubitak nasuprot cijeni istaknutog paketa */}
          <div className="grid sm:grid-cols-2 gap-4 text-center">
            <div className="bg-red-50 rounded-lg p-5 border border-red-100">
              <p className="text-xs text-red-500 font-medium uppercase tracking-wide mb-1">
                Mjesečni gubitak
              </p>
              <p className="text-3xl font-bold text-red-600">{monthlyLoss} KM</p>
              <p className="text-xs text-slate-400 mt-1">≈ {annualLoss} KM godišnje</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
              <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">
                {highlightedPlan ? `Sattlio ${highlightedPlan.name}` : "Sattlio pretplata"}
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {planPrice !== null ? `${planPrice.toFixed(2).replace(".", ",")} KM` : "…"}
              </p>
              <p className="text-xs text-slate-400 mt-1">mjesečno</p>
            </div>
          </div>

          {netMonthly !== null && netMonthly > 0 && (
            <p className="text-center text-sm text-slate-600 mt-6">
              To je{" "}
              <span className="font-semibold text-slate-900">{netMonthly} KM</span> mjesečno koje
              trenutno odlazi u prazne termine — više nego što košta cijela pretplata.
            </p>
          )}

          <div className="text-center mt-8">
            <Link
              to={ROUTES.register}
              className={`inline-block px-6 py-3 ${COLORS.primaryClass} text-white font-medium rounded-xl ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
            >
              Započni besplatno — {SUBSCRIPTION.trialDays} dana
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// RoadmapSection — planirane funkcionalnosti (Dok. 22)
// ---------------------------------------------------------------------------
function RoadmapSection() {
  // Prikazuju se samo grupe iz MINI_ROADMAP_KEYS (urađeno / u izradi / planirano),
  // i to samo stavke označene sa highlight — vizija i ideje su na punoj stranici.
  const miniGroups = MINI_ROADMAP_KEYS.map((key) =>
    ROADMAP.find((group) => group.key === key)
  ).filter((group): group is NonNullable<typeof group> => group !== undefined);

  return (
    <section id={LANDING_SECTIONS.roadmap} className="scroll-mt-24 py-16 md:py-20 bg-white border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className={`${TYPOGRAPHY.sectionTitleClass} text-slate-900 text-center mb-3`}>
          Gdje smo i kuda idemo
        </h2>
        <p className="text-slate-500 text-center mb-10 max-w-2xl mx-auto">
          Otvoreno objavljujemo šta je gotovo, na čemu radimo i šta slijedi.
        </p>

        {/* Tri kolone — po jedna grupa roadmapa */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {miniGroups.map((group) => {
            const meta = ROADMAP_STATUS_META[group.status];
            return (
              <div
                key={group.key}
                className="bg-slate-50 rounded-xl border border-slate-200 p-5"
              >
                {/* Zaglavlje kolone — status uz tekst, ne samo boja */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} aria-hidden="true" />
                  <h3 className="font-semibold text-slate-900 text-sm">{group.title}</h3>
                </div>
                {group.period && (
                  <p className="text-xs text-slate-400 mb-4 ml-4">{group.period}</p>
                )}

                <ul className="space-y-2.5">
                  {miniRoadmapItems(group).map((item) => (
                    <li key={item.title} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-slate-300 shrink-0" aria-hidden="true">
                        •
                      </span>
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Link ka punoj stranici sa vizijom i idejama */}
        <div className="text-center mt-8">
          <Link
            to={ROUTES.roadmap}
            className={`inline-block px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:border-blue-500 hover:text-blue-600 ${ANIMATION.transitionClass}`}
          >
            Pogledajte pun roadmap →
          </Link>
        </div>
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
    <section id={LANDING_SECTIONS.contact} className="scroll-mt-24 py-16 md:py-20 bg-white border-t border-slate-200">
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

        {/* Opšti kontakt (partnerstva, mediji i sl.) - odvojeno od tehničke podrške */}
        <p className="text-sm text-slate-400 mt-4">
          Za opšte upite (partnerstva, mediji):{" "}
          <a href={`mailto:${CONTACT.generalEmail}`} className="text-slate-500 hover:text-blue-600 underline underline-offset-2">
            {CONTACT.generalEmail}
          </a>
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
            <SocialLink href={SOCIAL_LINKS.instagram} label="Instagram" />
            <SocialLink href={SOCIAL_LINKS.tiktok} label="TikTok" />
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

        {/* Pravni linkovi + roadmap */}
        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs mt-6 pt-6 border-t border-slate-700">
          <Link to={ROUTES.roadmap} className={`${ANIMATION.transitionClass} hover:text-white`}>
            Roadmap
          </Link>
          <Link to="/uslovi-koristenja" className={`${ANIMATION.transitionClass} hover:text-white`}>
            Uslovi korištenja
          </Link>
          <Link to="/politika-privatnosti" className={`${ANIMATION.transitionClass} hover:text-white`}>
            Politika privatnosti
          </Link>
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
