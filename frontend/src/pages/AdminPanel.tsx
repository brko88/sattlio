import { useState, useEffect } from "react";
import api from "../services/api";
import Pagination from "../components/Pagination";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  is_active: boolean;
  jib: string | null;
  verification_status: string;
  owner_name: string | null;
  owner_email: string | null;
}

interface TenantHealth {
  tenant_id: number;
  tenant_name: string;
  checks: {
    email_verified: boolean;
    salon_verified: boolean;
    employees_added: boolean;
    employees_count: number;
    services_added: boolean;
    services_count: number;
    working_hours_set: boolean;
    self_booking_enabled: boolean;
  };
  owner_email: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
};

const CHECK_LABELS: Record<string, string> = {
  email_verified: "Email vlasnika potvrđen",
  salon_verified: "Salon verifikovan",
  employees_added: "Zaposleni dodani",
  services_added: "Usluge dodane",
  working_hours_set: "Radno vrijeme podešeno",
  self_booking_enabled: "Self-booking aktivan",
};

function HealthCheckModal({
  health,
  loading,
  onClose,
}: {
  health: TenantHealth | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <p className="text-slate-500">Učitavanje...</p>
        ) : !health ? (
          <p className="text-red-600">Greška prilikom učitavanja podataka.</p>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {health.tenant_name}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {health.owner_email || "Nema vlasnika"}
            </p>

            <ul className="space-y-2 mb-4">
              {(Object.keys(CHECK_LABELS) as Array<keyof typeof CHECK_LABELS>).map(
                (key) => {
                  const ok = Boolean(
                    (health.checks as Record<string, boolean | number>)[key]
                  );
                  let extra = "";
                  if (key === "employees_added") {
                    extra = ` (${health.checks.employees_count})`;
                  }
                  if (key === "services_added") {
                    extra = ` (${health.checks.services_count})`;
                  }
                  return (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          ok ? "bg-green-500" : "bg-red-400"
                        }`}
                      >
                        {ok ? "✓" : "✕"}
                      </span>
                      <span className="text-slate-700">
                        {CHECK_LABELS[key]}
                        {extra}
                      </span>
                    </li>
                  );
                }
              )}
            </ul>

            <button
              onClick={onClose}
              className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Zatvori
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Sve" },
  { value: "pending", label: "Na čekanju" },
  { value: "verified", label: "Verifikovano" },
  { value: "suspended", label: "Suspendovano" },
];

interface AdminPanelProps {
  title?: string;
  description?: string;
  initialStatusFilter?: string;
}

function AdminPanel({
  title = "Admin Panel",
  description = "Pregled i verifikacija svih poslovnih subjekata na platformi",
  initialStatusFilter = "",
}: AdminPanelProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthData, setHealthData] = useState<TenantHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchTenants = async (searchTerm: string = "", pageNum: number = 1, status: string = statusFilter) => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/admin/tenants", {
        params: {
          ...(searchTerm ? { search: searchTerm } : {}),
          ...(status ? { verification_status: status } : {}),
          page: pageNum,
          page_size: PAGE_SIZE,
        },
      });
      setTenants(response.data.items);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Greška prilikom učitavanja salona."
      );
    } finally {
      setLoading(false);
    }
  };

  // Ucitavanje pri promjeni stranice (i prvo ucitavanje, jer page pocinje na 1)
  useEffect(() => {
    fetchTenants(search, page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Debounce pretrage — čeka 400ms nakon zadnjeg tastera prije poziva, uvijek
  // resetuje na stranicu 1 (novu pretragu treba gledati od pocetka)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page === 1) {
        fetchTenants(search, 1, statusFilter);
      } else {
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleStatusTabChange = (value: string) => {
    setStatusFilter(value);
    if (page === 1) {
      fetchTenants(search, 1, value);
    } else {
      setPage(1);
    }
  };

  const handleAction = async (tenantId: number, action: "verify" | "suspend" | "reactivate") => {
    setError("");
    setSuccessMessage("");

    try {
      const response = await api.post(`/api/v1/admin/tenants/${tenantId}/${action}`);
      setSuccessMessage(response.data.detail);
      fetchTenants(search, page);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom akcije.");
    }
  };

  const handleShowHealth = async (tenantId: number) => {
    setHealthModalOpen(true);
    setHealthLoading(true);
    setHealthData(null);
    try {
      const response = await api.get(`/api/v1/admin/tenants/${tenantId}/health`);
      setHealthData(response.data);
    } catch (err) {
      setHealthData(null);
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">{title}</h1>
      <p className="text-slate-500 mb-6">{description}</p>

      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusTabChange(tab.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraga po nazivu, JIB-u, gradu, emailu ili vlasniku..."
          className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {successMessage && (
        <p className="text-green-600 text-sm mb-3">{successMessage}</p>
      )}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          {search || statusFilter
            ? "Nema rezultata za zadate filtere."
            : "Nema registrovanih poslovnih subjekata."}
        </div>
      ) : (
        <>
        {/* Mobilni prikaz - kartice (ispod md) */}
        <div className="md:hidden space-y-3">
          {tenants.map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <span
                  className={`${STATUS_STYLES[t.verification_status] || "bg-slate-100 text-slate-600"} px-2 py-1 rounded-full text-xs font-semibold shrink-0`}
                >
                  {t.verification_status}
                </span>
              </div>
              <p className="text-sm text-slate-500">{t.owner_name || "-"}</p>
              <p className="text-sm text-slate-500 break-all">{t.owner_email || "-"}</p>
              <p className="text-sm text-slate-500">
                {t.city || "—"}{t.jib ? ` · JIB: ${t.jib}` : ""}
              </p>
              <p className="text-sm text-slate-500 mb-3">Aktivan: {t.is_active ? "Da" : "Ne"}</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleShowHealth(t.id)}
                  className="px-3 py-1.5 bg-slate-600 text-white rounded-md text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Detalji
                </button>
                {t.verification_status !== "verified" && (
                  <button
                    onClick={() => handleAction(t.id, "verify")}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    Verifikuj
                  </button>
                )}
                {t.verification_status !== "suspended" ? (
                  <button
                    onClick={() => handleAction(t.id, "suspend")}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    Suspenduj
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(t.id, "reactivate")}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    Reaktiviraj
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop/tablet prikaz - tabela (md i vece) */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Naziv
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Vlasnik
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Grad
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                JIB
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Aktivan
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">{t.owner_name || "-"}</td>
                <td className="px-4 py-3 text-sm">{t.owner_email || "-"}</td>
                <td className="px-4 py-3">{t.city || "—"}</td>
                <td className="px-4 py-3 font-mono text-sm">{t.jib || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`${STATUS_STYLES[t.verification_status] || "bg-slate-100 text-slate-600"} px-3 py-1 rounded-full text-xs font-semibold`}
                  >
                    {t.verification_status}
                  </span>
                </td>
                <td className="px-4 py-3">{t.is_active ? "Da" : "Ne"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleShowHealth(t.id)}
                      className="px-3 py-1.5 bg-slate-600 text-white rounded-md text-xs font-medium hover:bg-slate-700 transition-colors"
                    >
                      Detalji
                    </button>
                    {t.verification_status !== "verified" && (
                      <button
                        onClick={() => handleAction(t.id, "verify")}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Verifikuj
                      </button>
                    )}
                    {t.verification_status !== "suspended" ? (
                      <button
                        onClick={() => handleAction(t.id, "suspend")}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Suspenduj
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(t.id, "reactivate")}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Reaktiviraj
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />

      {healthModalOpen && (
        <HealthCheckModal
          health={healthData}
          loading={healthLoading}
          onClose={() => setHealthModalOpen(false)}
        />
      )}
    </div>
  );
}

export default AdminPanel;
