import { useState, useEffect } from "react";
import api from "../services/api";

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

function AdminPanel() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthData, setHealthData] = useState<TenantHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchTenants = async (searchTerm: string = "") => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/admin/tenants", {
        params: searchTerm ? { search: searchTerm } : {},
      });
      setTenants(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Greška prilikom učitavanja salona."
      );
    } finally {
      setLoading(false);
    }
  };

  // Prvo učitavanje
  useEffect(() => {
    fetchTenants();
  }, []);

  // Debounce pretrage — čeka 400ms nakon zadnjeg tastera prije poziva
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTenants(search);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleAction = async (tenantId: number, action: "verify" | "suspend" | "reactivate") => {
    setError("");
    setSuccessMessage("");

    try {
      const response = await api.post(`/api/v1/admin/tenants/${tenantId}/${action}`);
      setSuccessMessage(response.data.detail);
      fetchTenants(search);
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
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Admin Panel</h1>
      <p className="text-slate-500 mb-6">
        Pregled i verifikacija svih poslovnih subjekata na platformi
      </p>

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
          {search
            ? "Nema rezultata za zadatu pretragu."
            : "Nema registrovanih poslovnih subjekata."}
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
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
      )}

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
