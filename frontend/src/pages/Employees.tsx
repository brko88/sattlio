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
  allow_self_booking: boolean;
  can_manage_own_hours: boolean;
}

function Employees() {
  const { tenantId } = useTenant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAllowSelfBooking, setEditAllowSelfBooking] = useState(false);
  const [editCanManageOwnHours, setEditCanManageOwnHours] = useState(false);

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
        email: email,
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom dodavanja zaposlenog.");
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditFirstName(emp.first_name);
    setEditLastName(emp.last_name);
    setEditPhone(emp.phone || "");
    setEditAllowSelfBooking(emp.allow_self_booking);
    setEditCanManageOwnHours(emp.can_manage_own_hours);
  };

  const handleEdit = async (employeeId: number) => {
    setError("");
    try {
      await api.put(`/api/v1/employees/${employeeId}`, {
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone || null,
        allow_self_booking: editAllowSelfBooking,
        can_manage_own_hours: editCanManageOwnHours,
      });
      setEditingId(null);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom uređivanja.");
    }
  };

  const handleDelete = async (employeeId: number, name: string) => {
    if (!confirm(`Obrisati zaposlenog ${name}?`)) return;
    setError("");
    try {
      await api.delete(`/api/v1/employees/${employeeId}`);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom brisanja.");
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
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Zaposleni se prijavljuje ovim emailom. Ako se registruje istim emailom, automatski dobija pristup salonu.
          </p>
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
        <>
        {/* Mobilni prikaz - kartice (ispod md) */}
        <div className="md:hidden space-y-3">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-lg shadow-sm p-4">
              {editingId === emp.id ? (
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAllowSelfBooking}
                      onChange={(e) => setEditAllowSelfBooking(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-slate-600">Online rezervacije omogućene</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanManageOwnHours}
                      onChange={(e) => setEditCanManageOwnHours(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-slate-600">Upravlja svojim radnim vremenom</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleEdit(emp.id)}
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
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-slate-900">{emp.first_name} {emp.last_name}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      emp.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {emp.is_active ? "Aktivan" : "Neaktivan"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 break-all">{emp.email || "—"}</p>
                  <p className="text-sm text-slate-500 mb-3">{emp.phone || "—"}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      emp.allow_self_booking ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      Online rezervacije: {emp.allow_self_booking ? "Uključeno" : "Isključeno"}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      emp.can_manage_own_hours ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      Svoje radno vrijeme: {emp.can_manage_own_hours ? "Uključeno" : "Isključeno"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(emp)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      Uredi
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
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
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ime</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Prezime</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Telefon</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Online rezervacije</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Upravlja svojim vremenom</th>
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
                    <td className="px-4 py-2 text-slate-400 text-sm">{emp.email || "—"}</td>
                    <td className="px-4 py-2">
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        maxLength={20}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-slate-400">—</td>
                    <td className="px-4 py-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAllowSelfBooking}
                          onChange={(e) => setEditAllowSelfBooking(e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-slate-600">Omogućeno</span>
                      </label>
                    </td>
                    <td className="px-4 py-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editCanManageOwnHours}
                          onChange={(e) => setEditCanManageOwnHours(e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-slate-600">Omogućeno</span>
                      </label>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
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
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">{emp.first_name}</td>
                    <td className="px-4 py-3">{emp.last_name}</td>
                    <td className="px-4 py-3 text-sm">{emp.email || "—"}</td>
                    <td className="px-4 py-3">{emp.phone || "—"}</td>
                    <td className="px-4 py-3">{emp.is_active ? "Aktivan" : "Neaktivan"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        emp.allow_self_booking
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {emp.allow_self_booking ? "Uključeno" : "Isključeno"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        emp.can_manage_own_hours
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {emp.can_manage_own_hours ? "Uključeno" : "Isključeno"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
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
    </div>
  );
}

export default Employees;
