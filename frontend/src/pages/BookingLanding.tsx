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
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Nova rezervacija</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {!selectedTenant ? (
        <>
          <p className="text-slate-500 mb-8">Odaberite salon gdje želite rezervisati termin</p>

          {loading ? (
            <p>Učitavanje...</p>
          ) : tenants.length === 0 ? (
            <div className="bg-white rounded-lg p-10 text-center text-slate-500">
              Trenutno nema dostupnih salona.
            </div>
          ) : (
            <div className="grid gap-3 max-w-lg">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant)}
                  className="bg-white rounded-lg p-5 shadow-sm text-left hover:shadow-md transition-shadow border border-slate-100 hover:border-blue-200"
                >
                  <p className="font-semibold text-slate-900 text-base">{tenant.name}</p>
                  {tenant.business_category && (
                    <p className="text-xs text-blue-600 mt-0.5">{tenant.business_category}</p>
                  )}
                  <div className="mt-2 space-y-0.5">
                    {tenant.city && (
                      <p className="text-sm text-slate-500">📍 {tenant.city}{tenant.address ? `, ${tenant.address}` : ""}</p>
                    )}
                  </div>
                  <p className="text-sm text-blue-600 mt-3">Pogledaj termine →</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setSelectedTenant(null)}
            className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
          >
            ← Nazad na salone
          </button>

          <div className="bg-white rounded-lg p-4 shadow-sm mb-6 max-w-lg">
            <p className="font-semibold text-slate-900">{selectedTenant.name}</p>
            {selectedTenant.business_category && (
              <p className="text-xs text-blue-600 mt-0.5">{selectedTenant.business_category}</p>
            )}
            {selectedTenant.city && (
              <p className="text-sm text-slate-500 mt-1">
                📍 {selectedTenant.city}{selectedTenant.address ? `, ${selectedTenant.address}` : ""}
              </p>
            )}
          </div>

          {loadingEmployees ? (
            <p>Učitavanje...</p>
          ) : employees.length === 0 ? (
            <div className="bg-white rounded-lg p-10 text-center text-slate-500">
              Nema dostupnih termina za online rezervaciju u ovom salonu.
            </div>
          ) : (
            <div className="grid gap-3 max-w-lg">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => navigate(`/book/${emp.id}`)}
                  className="bg-white rounded-lg p-5 shadow-sm text-left hover:shadow-md transition-shadow border border-slate-100 hover:border-blue-200"
                >
                  <p className="font-semibold text-slate-900">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">Pogledaj slobodne termine →</p>
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
