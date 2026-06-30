import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

function Customers() {
  const { tenantId } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const fetchCustomers = async (searchTerm?: string) => {
    try {
      const response = await api.get("/api/v1/customers", {
        params: { tenant_id: tenantId, search: searchTerm || undefined },
      });
      setCustomers(response.data);
    } catch (err: any) {
      setError("Greška prilikom učitavanja klijenata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tenantId]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/api/v1/customers", {
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      });

      setFirstName("");
      setLastName("");
      setPhone("");

      fetchCustomers();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Greška prilikom dodavanja klijenta.";
      setError(message);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Klijenti</h1>

      <form
        onSubmit={handleAddCustomer}
        className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md"
      >
        <h3 className="text-lg font-semibold mb-4">Dodaj klijenta</h3>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Ime"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Prezime"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Telefon (opciono)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

      <form
        onSubmit={handleSearch}
        className="bg-white rounded-lg p-4 shadow-sm mb-6 max-w-lg flex gap-2 items-center"
      >
        <input
          type="text"
          placeholder="Pretraga (ime, prezime, telefon)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-white border border-slate-200 text-slate-900 rounded-md font-medium hover:bg-slate-50 transition-colors"
        >
          Pretraži
        </button>
      </form>

      <h3 className="text-lg font-semibold mb-3">Lista klijenata</h3>

      {loading ? (
        <p>Učitavanje...</p>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema klijenata.
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Ime
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Prezime
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Telefon
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{c.first_name}</td>
                <td className="px-4 py-3">{c.last_name}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Customers;