import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";
import { formatTime, getLocalHoursMinutes } from "../utils/time";

interface Appointment {
  id: number;
  customer_id: number;
  employee_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  cancelled_by_type?: string | null;
  cancelled_by_name?: string | null;
  cancellation_reason?: string | null;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  created: "bg-blue-100 border-blue-500 text-blue-900",
  confirmed: "bg-green-100 border-green-500 text-green-900",
  completed: "bg-slate-200 border-slate-500 text-slate-700",
  cancelled: "bg-red-100 border-red-400 text-red-700 opacity-60",
  no_show: "bg-slate-100 border-slate-400 text-slate-500",
};

const START_HOUR = 7;
const END_HOUR = 20;
const SLOT_HEIGHT = 30;
const SLOTS = (END_HOUR - START_HOUR) * 2;

function Calendar() {
  const { tenantId, timezone } = useTenant();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal za detalje postojeće rezervacije
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Mobilni prikaz - jedan zaposleni odjednom (kalendar mreza je preuska za vise kolona)
  const [mobileEmployeeId, setMobileEmployeeId] = useState<number | null>(null);

  // Otkazivanje termina — potvrda + tip + razlog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelType, setCancelType] = useState<"customer" | "staff" | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Modal za novu rezervaciju
  const [newApptModal, setNewApptModal] = useState(false);
  const [newApptEmployee, setNewApptEmployee] = useState<Employee | null>(null);
  const [newApptTime, setNewApptTime] = useState("");
  const [newApptServiceId, setNewApptServiceId] = useState("");

  // Pretraga klijenta
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Novi klijent inline forma
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchAll = async () => {
    try {
      const [apptRes, empRes, srvRes, custRes] = await Promise.all([
        api.get("/api/v1/appointments", { params: { tenant_id: tenantId } }),
        api.get("/api/v1/employees", { params: { tenant_id: tenantId } }),
        api.get("/api/v1/services", { params: { tenant_id: tenantId } }),
        api.get("/api/v1/customers", { params: { tenant_id: tenantId } }),
      ]);
      setAppointments(apptRes.data);
      setEmployees(empRes.data);
      setServices(srvRes.data);
      setCustomers(custRes.data);
    } catch {
      setError("Greška prilikom učitavanja podataka.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [tenantId]);

  useEffect(() => {
    if (mobileEmployeeId === null && employees.length > 0) {
      setMobileEmployeeId(employees[0].id);
    }
  }, [employees, mobileEmployeeId]);

  // Pretraga klijenata
  useEffect(() => {
    if (customerSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const term = customerSearch.toLowerCase();
    const results = customers.filter(
      (c) =>
        c.first_name.toLowerCase().includes(term) ||
        c.last_name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
    );
    setSearchResults(results);
  }, [customerSearch, customers]);

  const dayAppointments = appointments.filter((a) => {
    const apptDate = a.start_time.split("T")[0];
    return apptDate === selectedDate && a.status !== "cancelled";
  });

  const getServiceName = (id: number) =>
    services.find((s) => s.id === id)?.name || "—";

  const getCustomerName = (id: number) => {
    const c = customers.find((c) => c.id === id);
    return c ? `${c.first_name} ${c.last_name}` : "—";
  };

  const getEmployeeName = (id: number) => {
    const e = employees.find((e) => e.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "—";
  };

  const getAppointmentStyle = (appt: Appointment) => {
    const { hours, minutes } = getLocalHoursMinutes(appt.start_time, timezone);
    const end = getLocalHoursMinutes(appt.end_time, timezone);
    const startMinutesFromOpen = (hours - START_HOUR) * 60 + minutes;
    const endMinutesFromOpen = (end.hours - START_HOUR) * 60 + end.minutes;
    const durationMinutes = endMinutesFromOpen - startMinutesFromOpen;
    const top = (startMinutesFromOpen / 30) * SLOT_HEIGHT;
    const height = (durationMinutes / 30) * SLOT_HEIGHT;
    return { top: `${top}px`, height: `${Math.max(height, 20)}px` };
  };

  const getEmployeeAppointments = (employeeId: number) =>
    dayAppointments.filter((a) => a.employee_id === employeeId);

  const timeLabels = Array.from(
    { length: SLOTS / 2 },
    (_, i) => START_HOUR + i
  );


  // Klik na slobodan slot
  const handleSlotClick = (employee: Employee, slotIndex: number) => {
    const totalMinutes = START_HOUR * 60 + slotIndex * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    setNewApptEmployee(employee);
    setNewApptTime(timeStr);
    setNewApptServiceId("");
    setSelectedCustomer(null);
    setCustomerSearch("");
    setSearchResults([]);
    setShowNewCustomer(false);
    setNewFirstName("");
    setNewLastName("");
    setNewPhone("");
    setModalError("");
    setNewApptModal(true);
  };

  const handleComplete = async (id: number) => {
    try {
      await api.post(`/api/v1/appointments/${id}/complete`);
      setSelectedAppt(null);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    }
  };

  const closeApptModal = () => {
    setSelectedAppt(null);
    setShowCancelConfirm(false);
    setCancelType(null);
    setCancelReason("");
  };

  const handleCancel = async () => {
    if (!selectedAppt || !cancelType) return;
    setCancelling(true);
    try {
      await api.post(`/api/v1/appointments/${selectedAppt.id}/cancel`, {
        cancelled_by_type: cancelType,
        reason: cancelReason.trim() || null,
      });
      if (cancelType === "staff") {
        const customer = customers.find((c) => c.id === selectedAppt.customer_id);
        if (customer && !customer.email) {
          setError(
            `Termin je otkazan, ali klijent ${customer.first_name} ${customer.last_name} nema email — ${
              customer.phone ? `obavijestite ga na ${customer.phone}.` : "nemate ni telefon, kontaktirajte ga drugim putem."
            }`
          );
        }
      }
      closeApptModal();
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    } finally {
      setCancelling(false);
    }
  };


  // Kreiranje rezervacije iz modala
  const handleCreateAppointment = async () => {
    if (!newApptEmployee || !newApptServiceId) {
      setModalError("Odaberite uslugu.");
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      let customerId = selectedCustomer?.id;

      // Ako nema odabranog klijenta, kreiraj novog
      if (!customerId) {
        if (!newFirstName || !newLastName) {
          setModalError("Unesite ime i prezime klijenta.");
          setSaving(false);
          return;
        }
        const custRes = await api.post("/api/v1/customers", {
          tenant_id: tenantId,
          first_name: newFirstName,
          last_name: newLastName,
          phone: newPhone || null,
        });
        customerId = custRes.data.id;
      }

      const startTime = `${selectedDate}T${newApptTime}:00`;

      await api.post("/api/v1/appointments", {
        tenant_id: tenantId,
        employee_id: newApptEmployee.id,
        service_id: parseInt(newApptServiceId),
        customer_id: customerId,
        start_time: startTime,
      });

      setNewApptModal(false);
      fetchAll();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || "Greška prilikom kreiranja rezervacije.");
    } finally {
      setSaving(false);
    }
  };

  const renderGrid = (gridEmployees: Employee[]) => (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `70px repeat(${gridEmployees.length}, minmax(200px, 1fr))`,
        }}
      >
        <div className="border-b border-r border-slate-100"></div>
        {gridEmployees.map((emp) => (
          <div
            key={emp.id}
            className="border-b border-r border-slate-100 p-3 font-semibold text-sm text-slate-700"
          >
            {emp.first_name} {emp.last_name}
          </div>
        ))}

        <div className="relative border-r border-slate-100">
          {timeLabels.map((hour) => (
            <div
              key={hour}
              style={{ height: `${SLOT_HEIGHT * 2}px` }}
              className="text-xs text-slate-400 text-right pr-2 border-b border-slate-50 pt-1"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {gridEmployees.map((emp) => (
          <div
            key={emp.id}
            className="relative border-r border-slate-100"
            style={{ height: `${SLOTS * SLOT_HEIGHT}px` }}
          >
            {Array.from({ length: SLOTS }).map((_, i) => (
              <div
                key={i}
                style={{ height: `${SLOT_HEIGHT}px` }}
                className={`border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                  i % 2 === 0 ? "border-slate-100" : "border-slate-50"
                }`}
                onClick={() => handleSlotClick(emp, i)}
              />
            ))}

            {getEmployeeAppointments(emp.id).map((appt) => (
              <button
                key={appt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAppt(appt);
                }}
                style={getAppointmentStyle(appt)}
                className={`absolute left-1 right-1 ${STATUS_COLORS[appt.status]} border-l-4 rounded p-1.5 text-xs overflow-hidden text-left cursor-pointer hover:brightness-95 transition-all z-10`}
              >
                <p className="font-semibold truncate">
                  {getCustomerName(appt.customer_id)}
                </p>
                <p className="truncate">{getServiceName(appt.service_id)}</p>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Kalendar</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Legenda statusa */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-100 border-l-2 border-blue-500 inline-block" />
          <span className="text-xs text-slate-500">Zakazano</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-100 border-l-2 border-green-500 inline-block" />
          <span className="text-xs text-slate-500">Potvrđeno</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-200 border-l-2 border-slate-500 inline-block" />
          <span className="text-xs text-slate-500">Završeno</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-100 border-l-2 border-red-400 inline-block" />
          <span className="text-xs text-slate-500">Otkazano</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-100 border-l-2 border-slate-400 inline-block" />
          <span className="text-xs text-slate-500">Nije došao</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema zaposlenih za prikaz.
        </div>
      ) : (
        <>
          {/* Mobilni prikaz - jedan zaposleni odjednom (ispod md) */}
          <div className="md:hidden">
            <select
              value={mobileEmployeeId ?? ""}
              onChange={(e) => setMobileEmployeeId(parseInt(e.target.value))}
              className="w-full mb-3 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
            {renderGrid(employees.filter((e) => e.id === mobileEmployeeId))}
          </div>

          {/* Desktop/tablet prikaz - svi zaposleni jedan pored drugog (md i vece) */}
          <div className="hidden md:block">
            {renderGrid(employees)}
          </div>
        </>
      )}

      {/* Modal — detalji postojeće rezervacije */}
      {selectedAppt && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeApptModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {!showCancelConfirm ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Detalji rezervacije</h3>
                <div className="space-y-2 text-sm mb-6">
                  <p>
                    <span className="text-slate-500">Klijent:</span>{" "}
                    <span className="font-medium">{getCustomerName(selectedAppt.customer_id)}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Zaposleni:</span>{" "}
                    <span className="font-medium">{getEmployeeName(selectedAppt.employee_id)}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Usluga:</span>{" "}
                    <span className="font-medium">{getServiceName(selectedAppt.service_id)}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Vrijeme:</span>{" "}
                    <span className="font-medium">
                      {formatTime(selectedAppt.start_time, timezone)} - {formatTime(selectedAppt.end_time, timezone)}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">Status:</span>{" "}
                    <span className="font-medium">{selectedAppt.status}</span>
                  </p>
                  {selectedAppt.status === "cancelled" && selectedAppt.cancelled_by_name && (
                    <>
                      <p>
                        <span className="text-slate-500">Otkazao:</span>{" "}
                        <span className="font-medium">
                          {selectedAppt.cancelled_by_name}
                          {selectedAppt.cancelled_by_type === "customer" ? " (klijent)" : " (osoblje)"}
                        </span>
                      </p>
                      {selectedAppt.cancellation_reason && (
                        <p>
                          <span className="text-slate-500">Razlog:</span>{" "}
                          <span className="font-medium">{selectedAppt.cancellation_reason}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {(selectedAppt.status === "created" || selectedAppt.status === "confirmed") && (
                    <>
                      <button
                        onClick={() => handleComplete(selectedAppt.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Završi
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Otkaži
                      </button>
                    </>
                  )}
                  <button
                    onClick={closeApptModal}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Zatvori
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">Otkazivanje termina</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Da li ste sigurni da želite otkazati ovaj termin?
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ko je otkazao?
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCancelType("customer")}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        cancelType === "customer"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Otkazao korisnik
                    </button>
                    <button
                      onClick={() => setCancelType("staff")}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        cancelType === "staff"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Otkazao ja
                    </button>
                  </div>
                  {cancelType === "staff" && (
                    <p className="text-xs text-slate-400 mt-1">
                      Klijent će dobiti email obavještenje o otkazivanju.
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Razlog (opciono)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    placeholder="Npr. klijent se razbolio, promjena rasporeda..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={!cancelType || cancelling}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? "Otkazujem..." : "Potvrdi otkazivanje"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCancelConfirm(false);
                      setCancelType(null);
                      setCancelReason("");
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Nazad
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal — nova rezervacija */}
      {newApptModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setNewApptModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">Nova rezervacija</h3>
            <p className="text-sm text-slate-500 mb-4">
              {newApptEmployee?.first_name} {newApptEmployee?.last_name} — {newApptTime}
            </p>

            {/* Pretraga klijenta */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Klijent
              </label>

              {selectedCustomer ? (
                <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                    {selectedCustomer.phone && (
                      <span className="text-blue-600 ml-2">{selectedCustomer.phone}</span>
                    )}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                      setShowNewCustomer(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Pretraži po imenu ili telefonu..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowNewCustomer(false);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm"
                    autoFocus
                  />

                  {/* Rezultati pretrage */}
                  {searchResults.length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-md overflow-hidden shadow-sm">
                      {searchResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch("");
                            setSearchResults([]);
                            setShowNewCustomer(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-slate-100 last:border-0"
                        >
                          <span className="font-medium">{c.first_name} {c.last_name}</span>
                          {c.phone && (
                            <span className="text-slate-400 ml-2">{c.phone}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Nema rezultata — ponudi novi klijent */}
                  {customerSearch.length >= 2 && searchResults.length === 0 && !showNewCustomer && (
                    <div className="mt-1 px-3 py-2 text-sm text-slate-500">
                      Nema rezultata.{" "}
                      <button
                        onClick={() => setShowNewCustomer(true)}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        + Dodaj novog klijenta
                      </button>
                    </div>
                  )}

                  {/* Dugme za novi klijent kad nema pretrage */}
                  {customerSearch.length < 2 && !showNewCustomer && (
                    <button
                      onClick={() => setShowNewCustomer(true)}
                      className="mt-2 text-sm text-blue-600 font-medium hover:underline"
                    >
                      + Novi klijent
                    </button>
                  )}
                </>
              )}

              {/* Inline forma za novog klijenta */}
              {showNewCustomer && !selectedCustomer && (
                <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                  <input
                    type="text"
                    placeholder="Ime *"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Prezime *"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Telefon (opciono)"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setShowNewCustomer(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Odustani
                  </button>
                </div>
              )}
            </div>

            {/* Usluga */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usluga
              </label>
              <select
                value={newApptServiceId}
                onChange={(e) => setNewApptServiceId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="">Odaberi uslugu</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            {modalError && (
              <p className="text-red-600 text-sm mb-3">{modalError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCreateAppointment}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Čekajte..." : "Rezerviši"}
              </button>
              <button
                onClick={() => setNewApptModal(false)}
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

export default Calendar;
