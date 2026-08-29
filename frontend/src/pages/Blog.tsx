/**
 * Blog.tsx — javna stranica /blog (lista postova)
 *
 * Sav sadržaj dolazi iz config/blogConfig.ts — ova komponenta samo crta.
 * Za dodavanje novog posta NE dirati ovaj fajl, nego config.
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { ANIMATION, BRAND, COLORS, ROUTES, TYPOGRAPHY } from "../config/landingConfig";
import { BLOG_POSTS, formatBlogDate } from "../config/blogConfig";

function Blog() {
  useEffect(() => {
    const previous = document.title;
    document.title = `Blog — ${BRAND.productName}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className={`min-h-screen ${COLORS.backgroundClass} ${TYPOGRAPHY.fontFamily}`}>
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
        <div className="text-center mb-12">
          <h1 className={`${TYPOGRAPHY.heroTitleClass} text-slate-900 mb-3`}>Blog</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Savjeti za vlasnike salona — organizacija termina, manje nedolazaka, digitalizacija posla.
          </p>
        </div>

        {BLOG_POSTS.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 transition-colors"
              >
                <p className="text-xs text-slate-400 mb-2">{formatBlogDate(post.publishedAt)}</p>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">{post.title}</h2>
                <p className="text-sm text-slate-500">{post.excerpt}</p>
              </Link>
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

/** Prazno stanje — dok prvi post nije objavljen. */
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
      <h2 className="font-semibold text-slate-900 mb-2">Prvi tekstovi stižu uskoro</h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">Vratite se uskoro.</p>
    </div>
  );
}

export default Blog;
