import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import Avatar from "../components/Avatar";
import { SkeletonCards } from "../components/Skeleton";
import { useToast } from "../contexts/ToastContext";

interface PublicEmployee {
  id: number;
  first_name: string;
  last_name: string;
  allow_self_booking: boolean;
  avatar_url: string | null;
}

interface PublicService {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

interface SalonDetail {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  business_category: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  employees: PublicEmployee[];
  services: PublicService[];
}

function SalonProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const showToast = useToast();

  const handleShare = async (salonName: string) => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: salonName, text: `Pogledajte salon ${salonName} na Sattlio`, url });
      } catch {
        // Korisnik je otkazao share - ne radimo nista
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link kopiran ✔️");
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showToast("Link kopiran ✔️");
    }
  };

  useEffect(() => {
    const fetchSalon = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const response = await api.get(`/api/v1/public/tenants/by-slug/${slug}`);
        setSalon(response.data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchSalon();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 max-w-2xl mx-auto">
        <SkeletonCards count={4} />
      </div>
    );
  }

  if (notFound || !salon) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Salon nije pronađen</h1>
          <p className="text-slate-500 text-sm">
            Provjerite da li je link ispravan, ili salon više nije aktivan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {salon.cover_url ? (
        <div className="w-full bg-slate-800" style={{ aspectRatio: "8 / 3" }}>
          <img src={salon.cover_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-20 md:h-24 bg-gradient-to-r from-slate-700 to-slate-900" />
      )}

      <div className="max-w-2xl mx-auto px-4">
        <div className="-mt-10 md:-mt-12">
          <Avatar
            src={salon.logo_url}
            firstName={salon.name}
            size={88}
            className="ring-4 ring-white shadow-md"
          />
        </div>

        <div className="pt-3 pb-10">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{salon.name}</h1>
            <button
              onClick={() => handleShare(salon.name)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Podijeli
            </button>
          </div>
          <div className="flex flex-col gap-1 mb-1">
            {(salon.address || salon.city) && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [salon.address, salon.city].filter(Boolean).join(", ")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 w-fit"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {[salon.address, salon.city].filter(Boolean).join(", ")}
              </a>
            )}
            {salon.phone && (
              <a
                href={`tel:${salon.phone}`}
                className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 w-fit"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {salon.phone}
              </a>
            )}
            {salon.email && (
              <a
                href={`mailto:${salon.email}`}
                className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 w-fit"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {salon.email}
              </a>
            )}
          </div>
          {salon.business_category && (
            <p className="text-sm text-purple-700 font-medium mb-4">{salon.business_category}</p>
          )}
        {salon.description && (
          <p className="text-slate-600 mb-6">{salon.description}</p>
        )}

        <h2 className="text-lg font-bold text-slate-900 mb-3 mt-8">Usluge</h2>
        {salon.services.length === 0 ? (
          <p className="text-slate-400 text-sm">Trenutno nema dostupnih usluga.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y divide-slate-100 mb-8">
            {salon.services.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.duration_minutes} min</p>
                </div>
                <p className="font-semibold text-slate-700">{s.price.toFixed(2)} KM</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-900 mb-3">Zakažite termin</h2>
        {salon.employees.length === 0 ? (
          <p className="text-slate-400 text-sm">
            Trenutno nema dostupnih zaposlenih za online rezervaciju.
          </p>
        ) : (
          <div className="grid gap-3">
            {salon.employees.map((e) => (
              <Link
                key={e.id}
                to={`/book/${e.id}`}
                className="bg-white rounded-lg shadow-sm px-4 py-3 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={e.avatar_url} firstName={e.first_name} lastName={e.last_name} size={40} />
                  <p className="font-medium text-slate-900">
                    {e.first_name} {e.last_name}
                  </p>
                </div>
                <span className="text-sm text-purple-700 font-semibold">Rezerviši →</span>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default SalonProfile;
