import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import Avatar from "../components/Avatar";

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Učitavanje...</p>
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
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{salon.name}</h1>
          <p className="text-slate-500 mb-1">
            {[salon.address, salon.city].filter(Boolean).join(", ") || "—"}
          </p>
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
