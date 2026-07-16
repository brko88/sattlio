import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";
import Pagination from "../components/Pagination";
import { SkeletonListPage } from "../components/Skeleton";

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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchServices = async () => {
    try {
      const response = await api.get("/api/v1/services", {
        params: { tenant_id: tenantId, page, page_size: PAGE_SIZE },
      });
      setServices(response.data.items);
      setTotal(response.data.total);
    } catch (err: any) {
      setError("Greška prilikom učitavanja usluga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [tenantId, page]);

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

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditDuration(s.duration_minutes.toString());
    setEditPrice(s.price.toString());
    setEditIsActive(s.is_active);
  };

  const handleEditSave = async (serviceId: number) => {
    setError("");
    try {
      await api.put(`/api/v1/services/${serviceId}`, {
        name: editName,
        duration_minutes: parseInt(editDuration),
        price: parseFloat(editPrice),
        is_active: editIsActive,
      });
      setEditingId(null);
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom uređivanja.");
    }
  };

  const handleDelete = async (serviceId: number, name: string) => {
    if (!confirm(`Obrisati uslugu "${name}"?`)) return;
    setError("");
    try {
      await api.delete(`/api/v1/services/${serviceId}`);
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom brisanja.");
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
            maxLength={60}
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
            inputMode="decimal"
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
        <SkeletonListPage rows={5} columns={4} />
      ) : services.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema usluga.
        </div>
      ) : (
        <>
        {/* Mobilni prikaz - kartice (ispod md) */}
        <div className="md:hidden space-y-3">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow-sm p-4">
              {editingId === s.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Naziv</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={60}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">Trajanje (min)</label>
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">Cijena (KM)</label>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-slate-600">Aktivna</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleEditSave(s.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Sačuvaj
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-300"
                    >
                      Odustani
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      s.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {s.is_active ? "Aktivna" : "Neaktivna"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{s.duration_minutes} min • {s.price.toFixed(2)} KM</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      Uredi
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                    >
                      Obriši
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Desktop/tablet prikaz - tabela (md i vece) */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full min-w-[650px]">
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
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                {editingId === s.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={60}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-24 px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-slate-600">Aktivna</span>
                      </label>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(s.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                        >
                          Sačuvaj
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-300"
                        >
                          Odustani
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.duration_minutes} min</td>
                    <td className="px-4 py-3">{s.price.toFixed(2)} KM</td>
                    <td className="px-4 py-3">
                      {s.is_active ? "Aktivna" : "Neaktivna"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(s)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          Uredi
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                        >
                          Obriši
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
    </div>
  );
}

export default Services;