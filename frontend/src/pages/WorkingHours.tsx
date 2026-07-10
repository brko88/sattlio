import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";
import { formatDateTime as formatApptDateTime } from "../utils/time";

interface Employee {
  id: number;
  user_id: number | null;
  first_name: string;
  last_name: string;
  can_manage_own_hours: boolean;
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

interface ConflictingAppointment {
  id: number;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_phone: string | null;
  customer_has_email: boolean;
  service_name: string;
}

const DAYS = [
  "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak",
  "Petak", "Subota", "Nedjelja",
];

const formatTime = (time: string) => time.slice(0, 5);
const isValidTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

function WorkingHours() {
  const { tenantId, currentRole } = useTenant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
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
  const [conflicts, setConflicts] = useState<ConflictingAppointment[] | null>(null);
  const [confirmingSpecialDay, setConfirmingSpecialDay] = useState(false);

  const fetchEmployees = async () => {
    const response = await api.get("/api/v1/employees", { params: { tenant_id: tenantId } });
    setEmployees(response.data);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/api/v1/auth/me");
      setCurrentUserId(response.data.id);
    } catch {
      // ignore
    }
  };

  const isOwner = currentRole === "owner";
  const myEmployee = employees.find((e) => e.user_id === currentUserId) || null;
  const canManageSelected = isOwner
    ? true
    : selectedEmployeeId !== "" &&
      myEmployee !== null &&
      String(myEmployee.id) === selectedEmployeeId &&
      myEmployee.can_manage_own_hours;

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

  useEffect(() => { fetchEmployees(); fetchCurrentUser(); }, [tenantId]);

  useEffect(() => {
    if (!isOwner && myEmployee && selectedEmployeeId === "") {
      setSelectedEmployeeId(String(myEmployee.id));
    }
  }, [isOwner, myEmployee, selectedEmployeeId]);

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

  const buildSpecialDayPayload = (force: boolean) => ({
    tenant_id: tenantId,
    employee_id: parseInt(selectedEmployeeId),
    date: specialDate,
    is_working_day: specialIsWorking,
    start_time: specialIsWorking ? specialStart + ":00" : null,
    end_time: specialIsWorking ? specialEnd + ":00" : null,
    note: specialNote || null,
    force,
  });

  const handleAddSpecialDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccessMessage(""); setConflicts(null);

    if (!specialDate) { setError("Odaberite datum."); return; }
    if (specialIsWorking) {
      if (!isValidTime(specialStart) || !isValidTime(specialEnd)) { setError("Neispravan format vremena."); return; }
      if (specialStart >= specialEnd) { setError("Početak mora biti prije kraja."); return; }
    }

    try {
      const response = await api.post("/api/v1/special-days", buildSpecialDayPayload(false));
      if (!response.data.saved) {
        setConflicts(response.data.conflicts);
        return;
      }
      setSuccessMessage("Specijalni dan sačuvan.");
      setSpecialDate(""); setSpecialNote(""); setSpecialIsWorking(false);
      fetchSpecialDays(selectedEmployeeId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    }
  };

  const handleConfirmSpecialDay = async () => {
    setConfirmingSpecialDay(true);
    setError("");
    try {
      const response = await api.post("/api/v1/special-days", buildSpecialDayPayload(true));
      const cancelledList: ConflictingAppointment[] = response.data.conflicts || [];
      if (cancelledList.length > 0) {
        const withoutEmail = cancelledList.filter((c) => !c.customer_has_email);
        let msg = `Specijalni dan sačuvan. Otkazano ${cancelledList.length} termin(a).`;
        if (withoutEmail.length > 0) {
          msg += ` ${withoutEmail.length} klijent(a) NEMA email — kontaktirajte ručno: ` +
            withoutEmail.map((c) => `${c.customer_name}${c.customer_phone ? ` (${c.customer_phone})` : " (nema ni telefon)"}`).join(", ");
        } else {
          msg += " Svi klijenti su obaviješteni mailom.";
        }
        setSuccessMessage(msg);
      } else {
        setSuccessMessage("Specijalni dan sačuvan.");
      }
      setConflicts(null);
      setSpecialDate(""); setSpecialNote(""); setSpecialIsWorking(false);
      fetchSpecialDays(selectedEmployeeId);
      fetchHours(selectedEmployeeId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    } finally {
      setConfirmingSpecialDay(false);
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
        {isOwner ? (
          <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500">
            <option value="">Izaberi zaposlenog</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
            ))}
          </select>
        ) : myEmployee ? (
          <p className="text-slate-700 font-medium">{myEmployee.first_name} {myEmployee.last_name} (vi)</p>
        ) : (
          <p className="text-slate-400 text-sm">Niste povezani ni sa jednim zaposlenim u ovom salonu.</p>
        )}
      </div>

      {!isOwner && myEmployee && !myEmployee.can_manage_own_hours && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 max-w-md text-sm text-amber-800">
          Nemate dozvolu da mijenjate svoje radno vrijeme. Obratite se vlasniku salona da vam omogući ovu opciju u podešavanjima zaposlenih. Ispod možete pregledati trenutno radno vrijeme.
        </div>
      )}

      {selectedEmployeeId && (
        <>
          {/* Forma za radno vrijeme */}
          {canManageSelected && (
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
          )}

          {/* Copy sekcija */}
          {canManageSelected && (
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
          )}

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
                      {canManageSelected && (
                        <button onClick={() => handleDelete(h.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors">
                          Obriši
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Specijalni dani */}
          {canManageSelected && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md">
            <h3 className="text-lg font-semibold mb-1">Specijalni dani — skraćivanje/otkazivanje za JEDAN dan</h3>
            <p className="text-sm text-slate-500 mb-4">
              Ovdje privremeno mijenjate radno vrijeme samo za odabrani datum (npr. hitna obaveza, ljekar, godišnji odmor) — ne utiče na ostale sedmice. Ako postoje rezervacije koje više ne staju u novo vrijeme, sistem će vas upozoriti i tražiti potvrdu prije nego što ih automatski otkaže i obavijesti klijente mailom.
            </p>

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
          )}

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
                        {canManageSelected && (
                          <button onClick={() => handleDeleteSpecialDay(sd.id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors">
                            Obriši
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}

      {/* Modal — upozorenje o konfliktnim terminima */}
      {conflicts && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConflicts(null)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Upozorenje</h3>
            <p className="text-sm text-slate-600 mb-4">
              U ovom periodu imate <span className="font-semibold">{conflicts.length}</span> {conflicts.length === 1 ? "rezervaciju" : "rezervacije/-a"} koje više ne staju u novo radno vrijeme. Da li ste sigurni da želite nastaviti? Ovi termini će biti otkazani, a klijenti sa email-om obaviješteni.
            </p>
            <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-md divide-y divide-slate-100 mb-4">
              {conflicts.map((c) => (
                <div key={c.id} className="px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{c.customer_name}</p>
                    {c.customer_has_email ? (
                      <span className="text-xs text-green-600">✓ email</span>
                    ) : (
                      <span className="text-xs text-amber-600">⚠ nema email{c.customer_phone ? ` — ${c.customer_phone}` : ""}</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">{c.service_name} — {formatApptDateTime(c.start_time)}</p>
                </div>
              ))}
            </div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleConfirmSpecialDay}
                disabled={confirmingSpecialDay}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {confirmingSpecialDay ? "Čekajte..." : "Da, otkaži i nastavi"}
              </button>
              <button
                onClick={() => setConflicts(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Odustani
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkingHours;
