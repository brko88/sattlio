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
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
};

function AdminPanel() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTenants = async () => {
    try {
      const response = await api.get("/api/v1/admin/tenants");
      setTenants(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Greška prilikom učitavanja salona."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleAction = async (tenantId: number, action: "verify" | "suspend" | "reactivate") => {
    setError("");
    setSuccessMessage("");

    try {
      const response = await api.post(`/api/v1/admin/tenants/${tenantId}/${action}`);
      setSuccessMessage(response.data.detail);
      fetchTenants();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom akcije.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Admin Panel</h1>
      <p className="text-slate-500 mb-6">
        Pregled i verifikacija svih poslovnih subjekata na platformi
      </p>

      {successMessage && (
        <p className="text-green-600 text-sm mb-3">{successMessage}</p>
      )}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema registrovanih poslovnih subjekata.
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Naziv
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
                  <div className="flex gap-2">
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
    </div>
  );
}

export default AdminPanel;