import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

interface Appointment {
  id: number;
  customer_id: number;
  employee_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

interface Service {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
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
  const { tenantId } = useTenant();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

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
    } catch (err: any) {
      setError("Greška prilikom učitavanja podataka.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [tenantId]);

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
    const start = new Date(appt.start_time);
    const end = new Date(appt.end_time);

    const startMinutesFromOpen =
      (start.getHours() - START_HOUR) * 60 + start.getMinutes();
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;

    const top = (startMinutesFromOpen / 30) * SLOT_HEIGHT;
    const height = (durationMinutes / 30) * SLOT_HEIGHT;

    return { top: `${top}px`, height: `${Math.max(height, 20)}px` };
  };

  const getEmployeeAppointments = (employeeId: number) =>
    dayAppointments.filter((a) => a.employee_id === employeeId);

  const timeLabels = Array.from({ length: SLOTS / 2 }, (_, i) => START_HOUR + i);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" });
  };

  const handleComplete = async (id: number) => {
    try {
      await api.post(`/api/v1/appointments/${id}/complete`);
      setSelectedAppt(null);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom završavanja.");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.post(`/api/v1/appointments/${id}/cancel`);
      setSelectedAppt(null);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom otkazivanja.");
    }
  };

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

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nema zaposlenih za prikaz.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `70px repeat(${employees.length}, minmax(200px, 1fr))`,
            }}
          >
            <div className="border-b border-r border-slate-100"></div>
            {employees.map((emp) => (
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

            {employees.map((emp) => (
              <div
                key={emp.id}
                className="relative border-r border-slate-100"
                style={{ height: `${SLOTS * SLOT_HEIGHT}px` }}
              >
                {Array.from({ length: SLOTS }).map((_, i) => (
                  <div
                    key={i}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    className={`border-b ${i % 2 === 0 ? "border-slate-100" : "border-slate-50"}`}
                  ></div>
                ))}

                {getEmployeeAppointments(emp.id).map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => setSelectedAppt(appt)}
                    style={getAppointmentStyle(appt)}
                    className={`absolute left-1 right-1 ${STATUS_COLORS[appt.status]} border-l-4 rounded p-1.5 text-xs overflow-hidden text-left cursor-pointer hover:brightness-95 transition-all`}
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
      )}

      {selectedAppt && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedAppt(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
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
                  {formatTime(selectedAppt.start_time)} - {formatTime(selectedAppt.end_time)}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Status:</span>{" "}
                <span className="font-medium">{selectedAppt.status}</span>
              </p>
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
                    onClick={() => handleCancel(selectedAppt.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Otkaži
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedAppt(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;