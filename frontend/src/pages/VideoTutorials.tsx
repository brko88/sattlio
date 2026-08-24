/**
 * VideoTutorials.tsx — javna stranica /video-uputstva
 *
 * Sav sadržaj dolazi iz config/videoTutorialsConfig.ts — ova komponenta samo
 * crta. Za dodavanje novog videa NE dirati ovaj fajl, nego config.
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import {
  ANIMATION,
  BRAND,
  COLORS,
  ROUTES,
  TYPOGRAPHY,
} from "../config/landingConfig";
import { VIDEO_TUTORIALS, type VideoTutorial } from "../config/videoTutorialsConfig";

function VideoTutorials() {
  // Naslov stranice — SEO/dijeljenje linka (Dok. 23)
  useEffect(() => {
    const previous = document.title;
    document.title = `Video uputstva — ${BRAND.productName}`;
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
          <h1 className={`${TYPOGRAPHY.heroTitleClass} text-slate-900 mb-3`}>Video uputstva</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Kratki vodiči kroz svaku funkciju platforme — od kreiranja salona do prve rezervacije.
          </p>
        </div>

        {VIDEO_TUTORIALS.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {VIDEO_TUTORIALS.map((video) => (
              <VideoCard key={video.youtubeId} video={video} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
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

/** Prazno stanje — dok prvi video nije snimljen (namjerno bez "uskoro" datuma). */
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
      <div
        className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4"
        aria-hidden="true"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 9.5l5 2.5-5 2.5v-5z" fill="currentColor" />
        </svg>
      </div>
      <h2 className="font-semibold text-slate-900 mb-2">Prva uputstva stižu uskoro</h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        Radimo na kratkim video vodičima kroz svaku funkciju platforme. Vratite se uskoro.
      </p>
    </div>
  );
}

/** Jedna kartica video uputstva — responzivan YouTube embed (16:9) + naslov/opis. */
function VideoCard({ video }: { video: VideoTutorial }) {
  return (
    <article className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="aspect-video bg-slate-100">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1">{video.title}</h3>
        <p className="text-sm text-slate-500">{video.description}</p>
      </div>
    </article>
  );
}

export default VideoTutorials;
