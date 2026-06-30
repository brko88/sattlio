import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

function Employees() {
  const { tenantId } = useTenant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/api/v1/employees", {
        params: { tenant_id: tenantId },
      });
      setEmployees(response.data);
    } catch (err: any) {
      setError("Greska prilikom ucitavanja zaposlenih.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [tenantId]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/v1/employees", {
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greska prilikom dodavanja zaposlenog.");
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditFirstName(emp.first_name);
    setEditLastName(emp.last_name);
    setEditPhone(emp.phone || "");
  };

  const handleEdit = async (employeeId: number) => {
    setError("");
    try {
      await api.put(`/api/v1/employees/${employeeId}`, {
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone || null,
      });
      setEditingId(null);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greska prilikom uredivanja.");
    }
  };

  const handleDelete = async (employeeId: number, name: string) => {
    if (!confirm(`Obrisati zaposlenog ${name}?`)) return;
    setError("");
    try {
      await api.delete(`/api/v1/employees/${employeeId}`);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greska prilikom brisanja.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Zaposleni</h1>

      <form
        onSubmit={handleAddEmployee}
        className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md"
      >
        <h3 className="text-lg font-semibold mb-4">Dodaj zaposlenog</h3>
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

      <h3 className="text-lg font-semibold mb-3">Lista zaposlenih</h3>

      {loading ? (
        <p>Ucitavanje...</p>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema zaposlenih.
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ime</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Prezime</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Telefon</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-100">
                {editingId === emp.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-slate-400">—</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => handleEdit(emp.id)}
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
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">{emp.first_name}</td>
                    <td className="px-4 py-3">{emp.last_name}</td>
                    <td className="px-4 py-3">{emp.phone || "—"}</td>
                    <td className="px-4 py-3">{emp.is_active ? "Aktivan" : "Neaktivan"}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => startEdit(emp)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        Uredi
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                      >
                        Obrisi
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Employees;
