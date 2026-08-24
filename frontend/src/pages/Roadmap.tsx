/**
 * Roadmap.tsx — javna stranica /roadmap
 *
 * Sav sadržaj dolazi iz config/roadmapConfig.ts — ova komponenta samo crta.
 * Za izmjenu roadmapa NE dirati ovaj fajl, nego config.
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import {
  ANIMATION,
  BRAND,
  COLORS,
  CONTACT,
  ROUTES,
  TYPOGRAPHY,
} from "../config/landingConfig";
import {
  ROADMAP,
  ROADMAP_CTA,
  ROADMAP_STATUS_META,
  type RoadmapGroup,
} from "../config/roadmapConfig";

function Roadmap() {
  // Naslov stranice — SEO/dijeljenje linka (Dok. 23)
  useEffect(() => {
    const previous = document.title;
    document.title = `Roadmap — ${BRAND.productName}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className={`min-h-screen ${COLORS.backgroundClass} ${TYPOGRAPHY.fontFamily}`}>
      {/* Jednostavan header — povratak na landing, bez pune navigacije */}
      <header className="sticky top-[env(safe-area-inset-top)] z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <BrandLogo />

          <Link
            to={ROUTES.register}
            className={`px-4 py-2 ${COLORS.primaryClass} text-white text-sm font-medium rounded-lg ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
          >
            Kreiraj nalog
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Uvod */}
        <div className="text-center mb-12">
          <h1 className={`${TYPOGRAPHY.heroTitleClass} text-slate-900 mb-3`}>Roadmap</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Gdje je {BRAND.productName} danas i kuda ide. Otvoreno objavljujemo šta radimo
            jer želimo da znate na čemu ste — a i da nam kažete ako nešto nedostaje.
          </p>
        </div>

        {/* Legenda statusa — tekst uz boju, ne samo boja (pristupačnost) */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {Object.entries(ROADMAP_STATUS_META).map(([key, meta]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${meta.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} aria-hidden="true" />
              {meta.label}
            </span>
          ))}
        </div>

        {/* Vremenska linija po grupama */}
        <div className="space-y-10">
          {ROADMAP.map((group) => (
            <RoadmapGroupBlock key={group.key} group={group} />
          ))}
        </div>

        {/* Poziv na akciju — vodi na postojeći kanal podrške */}
        <section className="mt-14 bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <h2 className={`${TYPOGRAPHY.sectionTitleClass} text-slate-900 mb-2`}>
            {ROADMAP_CTA.title}
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto mb-6">
            {ROADMAP_CTA.description}
          </p>
          <a
            href={`mailto:${CONTACT.supportEmail}?subject=${encodeURIComponent(
              "Prijedlog funkcionalnosti"
            )}`}
            className={`inline-block px-6 py-3 ${COLORS.primaryClass} text-white font-medium rounded-xl ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
          >
            {ROADMAP_CTA.buttonLabel}
          </a>
          <p className="text-xs text-slate-400 mt-4">
            Korisnici platforme prijedlog mogu poslati i kroz „Prijavi problem" u aplikaciji.
          </p>
        </section>

        {/* Napomena o obećanjima — štiti od "obećali ste pa niste" */}
        <p className="text-xs text-slate-400 text-center mt-10 max-w-2xl mx-auto">
          Datumi su plan, ne obaveza. Nova faza počinje kada prethodna stabilno radi i kada
          postoji stvarna potreba korisnika — zato daljim stavkama namjerno ne dajemo rok.
        </p>

        <div className="text-center mt-8">
          <Link
            to={ROUTES.home}
            className={`text-sm ${COLORS.primaryTextClass} font-medium ${ANIMATION.transitionClass} hover:underline`}
          >
            ← Nazad na početnu
          </Link>
        </div>
      </main>

      {/* Podnožje — minimalno, sa CTA na probni period */}
      <footer className={`${COLORS.secondaryClass} text-slate-400 py-10 mt-8`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-semibold text-white mb-1">{BRAND.productName}</p>
          <p className="text-sm mb-6">
            © {new Date().getFullYear()} {BRAND.platformName}
          </p>
          <Link
            to={ROUTES.register}
            className={`inline-block px-6 py-3 ${COLORS.primaryClass} text-white font-medium rounded-xl ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
          >
            Probajte besplatno
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Jedna grupa roadmapa (kvartal ili vizija) sa svojim stavkama. */
function RoadmapGroupBlock({ group }: { group: RoadmapGroup }) {
  const meta = ROADMAP_STATUS_META[group.status];

  return (
    <section aria-labelledby={`roadmap-${group.key}`}>
      {/* Zaglavlje grupe */}
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h2 id={`roadmap-${group.key}`} className="text-xl font-semibold text-slate-900">
          {group.title}
        </h2>
        {group.period && (
          <span className="text-sm font-medium text-slate-400">{group.period}</span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${meta.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} aria-hidden="true" />
          {meta.label}
        </span>
      </div>

      {group.intro && <p className="text-sm text-slate-500 mb-4">{group.intro}</p>}

      {/* Stavke — kartice u mreži */}
      <ul className="grid sm:grid-cols-2 gap-3">
        {group.items.map((item) => (
          <li
            key={item.title}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex gap-3"
          >
            <span
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${meta.dotClass}`}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              {item.description && (
                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Roadmap;
