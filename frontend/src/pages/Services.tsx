import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

function Services() {
  const { tenantId } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  const fetchServices = async () => {
    try {
      const response = await api.get("/api/v1/services", {
        params: { tenant_id: tenantId },
      });
      setServices(response.data);
    } catch (err: any) {
      setError("Greška prilikom učitavanja usluga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [tenantId]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/api/v1/services", {
        tenant_id: tenantId,
        name,
        duration_minutes: parseInt(duration),
        price: parseFloat(price),
      });

      setName("");
      setDuration("");
      setPrice("");

      fetchServices();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Greška prilikom dodavanja usluge.";
      setError(message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Usluge</h1>

      <form
        onSubmit={handleAddService}
        className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md"
      >
        <h3 className="text-lg font-semibold mb-4">Dodaj uslugu</h3>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Naziv usluge"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <input
            type="number"
            placeholder="Trajanje (minuta)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <input
            type="number"
            step="0.01"
            placeholder="Cijena (KM)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Dodaj
        </button>
      </form>

      <h3 className="text-lg font-semibold mb-3">Lista usluga</h3>

      {loading ? (
        <p>Učitavanje...</p>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema usluga.
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Naziv
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Trajanje
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Cijena
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.duration_minutes} min</td>
                <td className="px-4 py-3">{s.price.toFixed(2)} KM</td>
                <td className="px-4 py-3">
                  {s.is_active ? "Aktivna" : "Neaktivna"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Services;