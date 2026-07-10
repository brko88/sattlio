import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Tenant {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  business_category: string | null;
  description: string | null;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  allow_self_booking: boolean;
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
];

const colorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initials = (a: string, b?: string) => `${a?.[0] ?? ""}${b?.[0] ?? ""}`.toUpperCase();

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

function BookingLanding() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/public/tenants")
      .then((res) => setTenants(res.data))
      .catch(() => setError("Greška prilikom učitavanja salona."))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectTenant = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setLoadingEmployees(true);
    setEmployees([]);
    try {
      const res = await api.get(`/api/v1/public/tenants/${tenant.id}/employees`);
      setEmployees(res.data);
    } catch {
      setError("Greška prilikom učitavanja zaposlenih.");
    } finally {
      setLoadingEmployees(false);
    }
  };

  return (
    <div>
      {/* Hero traka */}
      <div className="bg-slate-800 rounded-xl px-6 py-8 mb-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #2563EB 0%, transparent 45%), radial-gradient(circle at 85% 80%, #2563EB 0%, transparent 40%)",
          }}
        />
        <div className="relative">
          <p className="text-blue-400 text-xs font-semibold tracking-wide uppercase mb-2">Sattlio</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Nova rezervacija</h1>
          <p className="text-slate-300 text-sm max-w-lg">
            Odaberite salon, pa zaposlenog kod kojeg želite zakazati termin — brzo, jednostavno, bez poziva.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {!selectedTenant ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Odaberite salon</h2>
            {!loading && tenants.length > 0 && (
              <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                {tenants.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-3 max-w-lg">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : tenants.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-100">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                🏪
              </div>
              <p className="text-slate-500 text-sm">Trenutno nema dostupnih salona.</p>
            </div>
          ) : (
            <div className="grid gap-3 max-w-lg">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant)}
                  className="group bg-white rounded-xl p-5 shadow-sm text-left transition-all duration-200 border border-slate-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-full ${colorForName(tenant.name)} text-white flex items-center justify-center font-semibold text-sm shrink-0`}>
                      {initials(tenant.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-base truncate">{tenant.name}</p>
                      {tenant.business_category && (
                        <span className="inline-block text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full mt-1">
                          {tenant.business_category}
                        </span>
                      )}
                      {tenant.city && (
                        <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1">
                          <span>📍</span> {tenant.city}{tenant.address ? `, ${tenant.address}` : ""}
                        </p>
                      )}
                    </div>
                    <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity self-center text-lg">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setSelectedTenant(null)}
            className="text-sm text-slate-500 hover:text-blue-600 mb-4 flex items-center gap-1 transition-colors"
          >
            ← Nazad na salone
          </button>

          <div className="bg-white rounded-xl p-5 shadow-sm mb-6 max-w-lg border border-slate-100 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${colorForName(selectedTenant.name)} text-white flex items-center justify-center font-semibold shrink-0`}>
              {initials(selectedTenant.name)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{selectedTenant.name}</p>
              {selectedTenant.business_category && (
                <span className="inline-block text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full mt-1">
                  {selectedTenant.business_category}
                </span>
              )}
              {selectedTenant.city && (
                <p className="text-sm text-slate-500 mt-1">
                  📍 {selectedTenant.city}{selectedTenant.address ? `, ${selectedTenant.address}` : ""}
                </p>
              )}
            </div>
          </div>

          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Odaberite zaposlenog</h2>

          {loadingEmployees ? (
            <div className="grid gap-3 max-w-lg">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-100">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                🗓️
              </div>
              <p className="text-slate-500 text-sm">Nema dostupnih termina za online rezervaciju u ovom salonu.</p>
            </div>
          ) : (
            <div className="grid gap-3 max-w-lg">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => navigate(`/book/${emp.id}`)}
                  className="group bg-white rounded-xl p-5 shadow-sm text-left transition-all duration-200 border border-slate-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 flex items-center gap-3"
                >
                  <div className={`w-11 h-11 rounded-full ${colorForName(`${emp.first_name}${emp.last_name}`)} text-white flex items-center justify-center font-semibold text-sm shrink-0`}>
                    {initials(emp.first_name, emp.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-sm text-blue-600 mt-0.5">Pogledaj slobodne termine</p>
                  </div>
                  <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                    →
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BookingLanding;
