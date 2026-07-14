import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";
import Pagination from "../components/Pagination";

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
  const [email, setEmail] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchCustomers = async (searchTerm?: string, pageNum: number = page) => {
    try {
      const response = await api.get("/api/v1/customers", {
        params: { tenant_id: tenantId, search: searchTerm || undefined, page: pageNum, page_size: PAGE_SIZE },
      });
      setCustomers(response.data.items);
      setTotal(response.data.total);
    } catch (err: any) {
      setError("Greška prilikom učitavanja klijenata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search, page);
  }, [tenantId, page]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/api/v1/customers", {
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        email: email || null,
      });

      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");

      fetchCustomers();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Greška prilikom dodavanja klijenta.";
      setError(message);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(search, 1);
  };

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setEditFirstName(c.first_name);
    setEditLastName(c.last_name);
    setEditPhone(c.phone || "");
    setEditEmail(c.email || "");
  };

  const handleEditSave = async (customerId: number) => {
    setError("");
    try {
      await api.put(`/api/v1/customers/${customerId}`, {
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone || null,
        email: editEmail || null,
      });
      setEditingId(null);
      fetchCustomers(search);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom uređivanja.");
    }
  };

  const handleDelete = async (customerId: number, name: string) => {
    if (!confirm(`Obrisati klijenta ${name}?`)) return;
    setError("");
    try {
      await api.delete(`/api/v1/customers/${customerId}`);
      fetchCustomers(search);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom brisanja.");
    }
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
            maxLength={30}
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
            maxLength={30}
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Telefon (opciono)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email (opciono)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
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
        <>
        {/* Mobilni prikaz - kartice (ispod md) */}
        <div className="md:hidden space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow-sm p-4">
              {editingId === c.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Ime</label>
                    <input
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      maxLength={30}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Prezime</label>
                    <input
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      maxLength={30}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Telefon</label>
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      maxLength={20}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleEditSave(c.id)}
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
                  <p className="font-semibold text-slate-900">{c.first_name} {c.last_name}</p>
                  <p className="text-sm text-slate-500">{c.phone || "—"}</p>
                  <p className="text-sm text-slate-500 break-all mb-3">{c.email || "—"}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      Uredi
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, `${c.first_name} ${c.last_name}`)}
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
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ime</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Prezime</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Telefon</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                {editingId === c.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        maxLength={30}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        maxLength={30}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        maxLength={20}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(c.id)}
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
                    <td className="px-4 py-3">{c.first_name}</td>
                    <td className="px-4 py-3">{c.last_name}</td>
                    <td className="px-4 py-3">{c.phone || "—"}</td>
                    <td className="px-4 py-3">{c.email || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(c)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          Uredi
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, `${c.first_name} ${c.last_name}`)}
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

export default Customers;
