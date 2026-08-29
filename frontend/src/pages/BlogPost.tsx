/**
 * BlogPost.tsx — javna stranica /blog/:slug (pojedinačan post)
 *
 * Sav sadržaj dolazi iz config/blogConfig.ts — ova komponenta samo crta.
 * Za izmjenu teksta NE dirati ovaj fajl, nego config.
 */

import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { ANIMATION, BRAND, COLORS, ROUTES, SEO, TYPOGRAPHY } from "../config/landingConfig";
import { getBlogPostBySlug, formatBlogDate } from "../config/blogConfig";
import { setPageMeta } from "../utils/seo";

function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  // Postavlja dinamički <title>, meta description i og:* po postu — Dok. 23
  // (SEO po stranici). og:image ovdje NE pomaze Facebook/WhatsApp botovima
  // (oni ne izvrsavaju JS, vidi utils/seo.ts) ali pomaze Google-u i botovima
  // koji renderuju JS.
  useEffect(() => {
    if (!post) return;
    return setPageMeta({
      title: `${post.title} — ${BRAND.productName}`,
      description: post.metaDescription,
      image: `${SEO.siteUrl}${post.coverImage}`,
    });
  }, [post]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

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

      <main className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <article>
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full rounded-2xl mb-8 border border-slate-200"
          />
          <p className="text-xs text-slate-400 mb-3">{formatBlogDate(post.publishedAt)}</p>
          <h1 className={`${TYPOGRAPHY.heroTitleClass} text-slate-900 mb-8`}>{post.title}</h1>

          <div className="space-y-6">
            {post.blocks.map((block, index) => {
              if (block.type === "paragraph") {
                return (
                  <p key={index} className="text-slate-600 leading-relaxed">
                    {block.text}
                  </p>
                );
              }
              return (
                <ol key={index} className="space-y-4 list-decimal list-inside">
                  {block.items.map((item) => (
                    <li key={item.title} className="text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-900">{item.title}</span>{" "}
                      {item.text}
                    </li>
                  ))}
                </ol>
              );
            })}
          </div>

          <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-slate-700 font-medium mb-4">
              Isprobajte {BRAND.productName} besplatno tokom beta perioda.
            </p>
            <Link
              to={ROUTES.register}
              className={`inline-block px-6 py-3 ${COLORS.primaryClass} text-white font-medium rounded-xl ${COLORS.primaryHoverClass} ${ANIMATION.transitionClass}`}
            >
              Registracija
            </Link>
          </div>
        </article>

        <div className="text-center mt-10">
          <Link
            to="/blog"
            className={`text-sm ${COLORS.primaryTextClass} font-medium ${ANIMATION.transitionClass} hover:underline`}
          >
            ← Nazad na blog
          </Link>
        </div>
      </main>

      <footer className={`${COLORS.secondaryClass} text-slate-400 py-10 mt-8`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-semibold text-white mb-1">{BRAND.productName}</p>
          <p className="text-sm mb-6">
            © {new Date().getFullYear()} {BRAND.platformName}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default BlogPost;
