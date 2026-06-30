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

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/api/v1/employees", {
        params: { tenant_id: tenantId },
      });
      setEmployees(response.data);
    } catch (err: any) {
      setError("Greška prilikom učitavanja zaposlenih.");
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
      const message =
        err.response?.data?.detail || "Greška prilikom dodavanja zaposlenog.";
      setError(message);
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
        <p>Učitavanje...</p>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema zaposlenih.
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
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{emp.first_name}</td>
                <td className="px-4 py-3">{emp.last_name}</td>
                <td className="px-4 py-3">{emp.phone || "—"}</td>
                <td className="px-4 py-3">
                  {emp.is_active ? "Aktivan" : "Neaktivan"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Employees;