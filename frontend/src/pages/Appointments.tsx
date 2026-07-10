import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";
import { formatDateTime, formatTime } from "../utils/time";

interface Appointment {
  id: number;
  customer_id: number;
  employee_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
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
}

const STATUS_LABELS: Record<string, string> = {
  created: "Zakazano",
  confirmed: "Potvrđeno",
  completed: "Završeno",
  cancelled: "Otkazano",
  no_show: "Nije došao",
};

const STATUS_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-slate-100 text-slate-500",
};

function Appointments() {
  const { tenantId, timezone } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Pretraga klijenta
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Otkazivanje termina — potvrda + tip + razlog
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelType, setCancelType] = useState<"customer" | "staff" | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const today = new Date().toISOString().split("T")[0];

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
      setError("Greška prilikom učitavanja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [tenantId]);

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

  useEffect(() => {
    if (!selectedEmployee || !selectedService || !selectedDate) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    api
      .get(`/api/v1/public/employees/${selectedEmployee}/slots`, {
        params: { date_str: selectedDate, service_id: selectedService },
      })
      .then((res) => setSlots(res.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedEmployee, selectedService, selectedDate]);

  const handleCreateCustomer = async () => {
    if (!newFirstName || !newLastName) {
      setError("Ime i prezime su obavezni.");
      return;
    }
    setCreatingCustomer(true);
    setError("");
    try {
      const res = await api.post("/api/v1/customers", {
        tenant_id: tenantId,
        first_name: newFirstName,
        last_name: newLastName,
        phone: newPhone || null,
      });
      await fetchAll();
      setSelectedCustomer(res.data);
      setShowNewCustomer(false);
      setNewFirstName("");
      setNewLastName("");
      setNewPhone("");
      setCustomerSearch("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom kreiranja klijenta.");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedSlot || !selectedEmployee || !selectedService || !selectedCustomer) {
      setError("Molimo popunite sva polja.");
      return;
    }
    setError("");
    try {
      await api.post("/api/v1/appointments", {
        tenant_id: tenantId,
        employee_id: parseInt(selectedEmployee),
        service_id: parseInt(selectedService),
        customer_id: selectedCustomer.id,
        start_time: selectedSlot,
      });
      setSelectedEmployee("");
      setSelectedService("");
      setSelectedCustomer(null);
      setSelectedDate("");
      setSlots([]);
      setSelectedSlot(null);
      setCustomerSearch("");
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom kreiranja rezervacije.");
    }
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelType(null);
    setCancelReason("");
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget || !cancelType) return;
    setCancelling(true);
    try {
      await api.post(`/api/v1/appointments/${cancelTarget.id}/cancel`, {
        cancelled_by_type: cancelType,
        reason: cancelReason.trim() || null,
      });
      closeCancelModal();
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    } finally {
      setCancelling(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.post(`/api/v1/appointments/${id}/complete`);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška.");
    }
  };

  const getEmployeeName = (id: number) => {
    const e = employees.find((e) => e.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "—";
  };

  const getServiceName = (id: number) =>
    services.find((s) => s.id === id)?.name || "—";

  const getCustomerName = (id: number) => {
    const c = customers.find((c) => c.id === id);
    return c ? `${c.first_name} ${c.last_name}` : "—";
  };



  const formatSlot = (iso: string) => formatTime(iso, timezone);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Rezervacije</h1>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Nova rezervacija</h3>

        <div className="mb-4">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
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

        <div className="mb-4">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          >
            <option value="">Izaberi uslugu</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name} ({svc.duration_minutes} min)
              </option>
            ))}
          </select>
        </div>

        {/* Pretraga klijenta */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-500 mb-2">Klijent</label>

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
                className="text-slate-400 hover:text-slate-600 text-xs ml-2"
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
              />

              {searchResults.length > 0 && (
                <div className="mt-1 border border-slate-200 rounded-md overflow-hidden shadow-sm">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch("");
                        setSearchResults([]);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium">{c.first_name} {c.last_name}</span>
                      {c.phone && <span className="text-slate-400 ml-2">{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}

              {customerSearch.length >= 2 && searchResults.length === 0 && !showNewCustomer && (
                <div className="mt-1 px-3 py-2 text-sm text-slate-500">
                  Nema rezultata.{" "}
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(true)}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    + Dodaj novog klijenta
                  </button>
                </div>
              )}

              {customerSearch.length < 2 && !showNewCustomer && (
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="mt-2 text-sm text-blue-600 font-medium hover:underline"
                >
                  + Novi klijent
                </button>
              )}
            </>
          )}

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
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={creatingCustomer}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingCustomer ? "Čuvanje..." : "Dodaj klijenta"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCustomer(false);
                    setNewFirstName("");
                    setNewLastName("");
                    setNewPhone("");
                  }}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-md text-sm hover:bg-slate-50"
                >
                  Odustani
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedEmployee && selectedService && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">Datum</label>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {selectedDate && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">Slobodni termini</label>
            {loadingSlots ? (
              <p className="text-slate-400 text-sm">Učitavanje termina...</p>
            ) : slots.length === 0 ? (
              <p className="text-slate-400 text-sm">Nema slobodnih termina za odabrani datum.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                      selectedSlot === slot
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {formatSlot(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {selectedSlot && selectedCustomer && (
          <button
            onClick={handleCreate}
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Kreiraj rezervaciju
          </button>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-3">Lista rezervacija</h3>

      {loading ? (
        <p>Učitavanje...</p>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema rezervacija.
        </div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Klijent</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Zaposleni</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Usluga</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Datum i vrijeme</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-semibind text-slate-500 uppercase">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{getCustomerName(appt.customer_id)}</td>
                <td className="px-4 py-3">{getEmployeeName(appt.employee_id)}</td>
                <td className="px-4 py-3">{getServiceName(appt.service_id)}</td>
                <td className="px-4 py-3">{formatDateTime(appt.start_time, timezone)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[appt.status]}`}>
                    {STATUS_LABELS[appt.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {(appt.status === "created" || appt.status === "confirmed") && (
                      <>
                        <button
                          onClick={() => handleComplete(appt.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700"
                        >
                          Završi
                        </button>
                        <button
                          onClick={() => setCancelTarget(appt)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700"
                        >
                          Otkaži
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal — potvrda otkazivanja */}
      {cancelTarget && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeCancelModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">Otkazivanje termina</h3>
            <p className="text-sm text-slate-500 mb-4">
              Da li ste sigurni da želite otkazati termin za{" "}
              <span className="font-medium">{getCustomerName(cancelTarget.customer_id)}</span>?
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
                onClick={handleCancelConfirm}
                disabled={!cancelType || cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Otkazujem..." : "Potvrdi otkazivanje"}
              </button>
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Nazad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
