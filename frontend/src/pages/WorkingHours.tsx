import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

interface WorkingHour {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working_day: boolean;
}

const DAYS = [
  "Ponedjeljak",
  "Utorak",
  "Srijeda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedjelja",
];

function WorkingHours() {
  const { tenantId } = useTenant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const fetchEmployees = async () => {
    const response = await api.get("/api/v1/employees", {
      params: { tenant_id: tenantId },
    });
    setEmployees(response.data);
  };

  const fetchHours = async (employeeId: string) => {
    if (!employeeId) return;
    try {
      const response = await api.get("/api/v1/working-hours", {
        params: { tenant_id: tenantId, employee_id: employeeId },
      });
      setHours(response.data);
    } catch (err: any) {
      setError("Greška prilikom učitavanja radnog vremena.");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [tenantId]);

  useEffect(() => {
    fetchHours(selectedEmployeeId);
  }, [selectedEmployeeId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      await api.post("/api/v1/working-hours", {
        tenant_id: tenantId,
        employee_id: parseInt(selectedEmployeeId),
        day_of_week: parseInt(dayOfWeek),
        start_time: startTime + ":00",
        end_time: endTime + ":00",
      });

      setSuccessMessage("Radno vrijeme je sačuvano.");
      fetchHours(selectedEmployeeId);
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Greška prilikom dodavanja.";
      setError(message);
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    setSuccessMessage("");

    try {
      await api.delete(`/api/v1/working-hours/${id}`);
      setSuccessMessage("Radno vrijeme je obrisano.");
      fetchHours(selectedEmployeeId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom brisanja.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Radno vrijeme</h1>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md">
        <label className="block text-sm font-medium text-slate-500 mb-2">
          Zaposleni
        </label>
        <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
        >
          <option value="">Izaberi zaposlenog</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.first_name} {emp.last_name}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployeeId && (
        <>
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">
              Dodaj / izmijeni radno vrijeme
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-2">
                Dan
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
              >
                {DAYS.map((day, idx) => (
                  <option key={idx} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Od
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Do
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {successMessage && (
              <p className="text-green-600 text-sm mb-3">{successMessage}</p>
            )}
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Sačuvaj
            </button>
          </form>

          <h3 className="text-lg font-semibold mb-3">Trenutno radno vrijeme</h3>
          {hours.length === 0 ? (
            <div className="bg-white rounded-lg p-10 text-center text-slate-500">
              Nema postavljenog radnog vremena.
            </div>
          ) : (
            <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
              <thead>
                <tr className="text-left bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Dan
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Od
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Do
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h) => (
                  <tr key={h.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{DAYS[h.day_of_week]}</td>
                    <td className="px-4 py-3">{h.start_time}</td>
                    <td className="px-4 py-3">{h.end_time}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Obriši
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default WorkingHours;