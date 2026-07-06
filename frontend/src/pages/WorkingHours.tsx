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
  break_start: string | null;
  break_end: string | null;
}

interface SpecialDay {
  id: number;
  date: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
}

const DAYS = [
  "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak",
  "Petak", "Subota", "Nedjelja",
];

const formatTime = (time: string) => time.slice(0, 5);
const isValidTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

function WorkingHours() {
  const { tenantId } = useTenant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [hasBreak, setHasBreak] = useState(false);
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("14:00");

  // Copy
  const [copyTarget, setCopyTarget] = useState("all");
  const [copying, setCopying] = useState(false);

  // Specijalni dani
  const [specialDate, setSpecialDate] = useState("");
  const [specialIsWorking, setSpecialIsWorking] = useState(false);
  const [specialStart, setSpecialStart] = useState("09:00");
  const [specialEnd, setSpecialEnd] = useState("17:00");
  const [specialNote, setSpecialNote] = useState("");

  const fetchEmployees = async () => {
    const response = await api.get("/api/v1/employees", { params: { tenant_id: tenantId } });
    setEmployees(response.data);
  };

  const fetchHours = async (employeeId: string) => {
    if (!employeeId) return;
    try {
      const response = await api.get("/api/v1/working-hours", {
        params: { tenant_id: tenantId, employee_id: employeeId },
      });
      setHours(response.data);
    } catch {
      setError("Greška prilikom učitavanja radnog vremena.");
    }
  };

  const fetchSpecialDays = async (employeeId: string) => {
    if (!employeeId) return;
    try {
      const response = await api.get("/api/v1/special-days", {
        params: { tenant_id: tenantId, employee_id: employeeId },
      });
      setSpecialDays(response.data);
    } catch {
      setError("Greška prilikom učitavanja specijalnih dana.");
    }
  };

  useEffect(() => { fetchEmployees(); }, [tenantId]);

  useEffect(() => {
    fetchHours(selectedEmployeeId);
    fetchSpecialDays(selectedEmployeeId);
  }, [selectedEmployeeId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccessMessage("");

    if (!isValidTime(startTime)) { setError("Neispravan format vremena za 'Od'."); return; }
    if (!isValidTime(endTime)) { setError("Neispravan format vremena za 'Do'."); return; }
    if (startTime >= endTime) { setError("Početak mora biti prije kraja."); return; }
    if (hasBreak) {
      if (!isValidTime(breakStart) || !isValidTime(breakEnd)) { setError("Neispravan format pauze."); return; }
      if (breakStart >= breakEnd) { setError("Početak pauze mora biti prije kraja."); return; }
    }

    try {
      await api.post("/api/v1/working-hours", {
        tenant_id: tenantId,
        employee_id: parseInt(selectedEmployeeId),
        day_of_week: parseInt(dayOfWeek),
        start_time: startTime + ":00",
        end_time: endTime + ":00",
        break_start: hasBreak ? breakStart + ":00" : null,
        break_end: hasBreak ? breakEnd + ":00" : null,
      });
      setSuccessMessage("Radno vrijeme je sačuvano.");
      fetchHours(selectedEmployeeId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    }
  };

  const handleDelete = async (id: number) => {
    setError(""); setSuccessMessage("");
    try {
      await api.delete(`/api/v1/working-hours/${id}`);
      setSuccessMessage("Obrisano.");
      fetchHours(selectedEmployeeId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    }
  };

  const handleCopy = async () => {
    if (!isValidTime(startTime) || !isValidTime(endTime)) { setError("Unesite ispravno radno vrijeme."); return; }
    if (startTime >= endTime) { setError("Početak mora biti prije kraja."); return; }
    setCopying(true); setError(""); setSuccessMessage("");
    try {
      const targetDays = copyTarget === "all" ? [0,1,2,3,4,5,6] : copyTarget === "workdays" ? [0,1,2,3,4] : [parseInt(copyTarget)];
      for (const day of targetDays) {
        await api.post("/api/v1/working-hours", {
          tenant_id: tenantId, employee_id: parseInt(selectedEmployeeId),
          day_of_week: day, start_time: startTime + ":00", end_time: endTime + ":00",
          break_start: hasBreak ? breakStart + ":00" : null,
          break_end: hasBreak ? breakEnd + ":00" : null,
        });
      }
      setSuccessMessage(copyTarget === "all" ? "Kopirano na sve dane." : copyTarget === "workdays" ? "Kopirano na radne dane." : `Kopirano na ${DAYS[parseInt(copyTarget)]}.`);
      fetchHours(selectedEmployeeId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    } finally { setCopying(false); }
  };

  const handleAddSpecialDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccessMessage("");

    if (!specialDate) { setError("Odaberite datum."); return; }
    if (specialIsWorking) {
      if (!isValidTime(specialStart) || !isValidTime(specialEnd)) { setError("Neispravan format vremena."); return; }
      if (specialStart >= specialEnd) { setError("Početak mora biti prije kraja."); return; }
    }

    try {
      await api.post("/api/v1/special-days", {
        tenant_id: tenantId,
        employee_id: parseInt(selectedEmployeeId),
        date: specialDate,
        is_working_day: specialIsWorking,
        start_time: specialIsWorking ? specialStart + ":00" : null,
        end_time: specialIsWorking ? specialEnd + ":00" : null,
        note: specialNote || null,
      });
      setSuccessMessage("Specijalni dan sačuvan.");
      setSpecialDate(""); setSpecialNote(""); setSpecialIsWorking(false);
      fetchSpecialDays(selectedEmployeeId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    }
  };

  const handleDeleteSpecialDay = async (id: number) => {
    try {
      await api.delete(`/api/v1/special-days/${id}`);
      setSuccessMessage("Specijalni dan obrisan.");
      fetchSpecialDays(selectedEmployeeId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Radno vrijeme</h1>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md">
        <label className="block text-sm font-medium text-slate-500 mb-2">Zaposleni</label>
        <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500">
          <option value="">Izaberi zaposlenog</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </select>
      </div>

      {selectedEmployeeId && (
        <>
          {/* Forma za radno vrijeme */}
          <form onSubmit={handleAdd} className="bg-white rounded-lg p-6 shadow-sm mb-4 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Dodaj / izmijeni radno vrijeme</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-2">Dan</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500">
                {DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
              </select>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-500 mb-2">Od</label>
                <input type="text" placeholder="09:00" value={startTime} onChange={(e) => setStartTime(e.target.value)} maxLength={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-500 mb-2">Do</label>
                <input type="text" placeholder="17:00" value={endTime} onChange={(e) => setEndTime(e.target.value)} maxLength={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">Format: HH:MM (npr. 09:00 — 17:00)</p>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={hasBreak} onChange={(e) => setHasBreak(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium text-slate-700">Pauza tokom radnog dana</span>
              </label>
              {hasBreak && (
                <div className="flex gap-3 mt-2">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Pauza od</label>
                    <input type="text" placeholder="13:00" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} maxLength={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Pauza do</label>
                    <input type="text" placeholder="14:00" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} maxLength={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                </div>
              )}
            </div>

            {successMessage && <p className="text-green-600 text-sm mb-3">{successMessage}</p>}
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <button type="submit" className="w-full px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
              Sačuvaj za odabrani dan
            </button>
          </form>

          {/* Copy sekcija */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md">
            <h3 className="text-lg font-semibold mb-1">Kopiraj radno vrijeme</h3>
            <p className="text-sm text-slate-500 mb-4">Kopiraj trenutno uneseno radno vrijeme ({startTime} — {endTime}) na:</p>
            <div className="flex gap-2">
              <select value={copyTarget} onChange={(e) => setCopyTarget(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm">
                <option value="all">Sve dane</option>
                <option value="workdays">Radne dane (Pon-Pet)</option>
                {DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
              </select>
              <button onClick={handleCopy} disabled={copying}
                className="px-4 py-2 bg-slate-700 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
                {copying ? "..." : "Kopiraj"}
              </button>
            </div>
          </div>

          {/* Tabela radnog vremena */}
          <h3 className="text-lg font-semibold mb-3">Trenutno radno vrijeme</h3>
          {hours.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-slate-500 max-w-2xl mb-6">Nema postavljenog radnog vremena.</div>
          ) : (
            <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden mb-6 max-w-2xl">
              <thead>
                <tr className="text-left bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Dan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Od</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Do</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pauza</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h) => (
                  <tr key={h.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{DAYS[h.day_of_week]}</td>
                    <td className="px-4 py-3">{formatTime(h.start_time)}</td>
                    <td className="px-4 py-3">{formatTime(h.end_time)}</td>
                    <td className="px-4 py-3">{h.break_start && h.break_end ? formatTime(h.break_start) + " — " + formatTime(h.break_end) : "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(h.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors">
                        Obriši
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Specijalni dani */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md">
            <h3 className="text-lg font-semibold mb-1">Specijalni dani</h3>
            <p className="text-sm text-slate-500 mb-4">Praznici, godišnji odmor, privremene izmjene rasporeda.</p>

            <form onSubmit={handleAddSpecialDay} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Datum</label>
                <input type="date" value={specialDate} onChange={(e) => setSpecialDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={specialIsWorking} onChange={(e) => setSpecialIsWorking(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-slate-700">Radni dan (izmijenjeno radno vrijeme)</span>
              </label>

              {specialIsWorking && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Od</label>
                    <input type="text" placeholder="09:00" value={specialStart} onChange={(e) => setSpecialStart(e.target.value)} maxLength={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Do</label>
                    <input type="text" placeholder="15:00" value={specialEnd} onChange={(e) => setSpecialEnd(e.target.value)} maxLength={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-500 mb-1">Napomena (opciono)</label>
                <input type="text" placeholder="npr. Državni praznik, Godišnji odmor..." value={specialNote} onChange={(e) => setSpecialNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm" />
              </div>

              <button type="submit" className="w-full px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
                Dodaj specijalni dan
              </button>
            </form>
          </div>

          {/* Lista specijalnih dana */}
          {specialDays.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-3">Lista specijalnih dana</h3>
              <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden max-w-2xl">
                <thead>
                  <tr className="text-left bg-slate-50">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Datum</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vrijeme</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Napomena</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {specialDays.map((sd) => (
                    <tr key={sd.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{new Date(sd.date + 'T00:00:00').toLocaleDateString("bs-BA")}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sd.is_working_day ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                          {sd.is_working_day ? "Izmijenjeno" : "Slobodan dan"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{sd.start_time && sd.end_time ? formatTime(sd.start_time) + " — " + formatTime(sd.end_time) : "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{sd.note || "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteSpecialDay(sd.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors">
                          Obriši
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default WorkingHours;
