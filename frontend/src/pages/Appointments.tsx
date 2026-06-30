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
  notes: string | null;
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
}

const STATUS_STYLES: Record<string, string> = {
  created: "bg-blue-600",
  confirmed: "bg-green-600",
  completed: "bg-slate-900",
  cancelled: "bg-red-600",
  no_show: "bg-slate-500",
};

function Appointments() {
  const { tenantId } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [startTime, setStartTime] = useState("");

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

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/api/v1/appointments", {
        tenant_id: tenantId,
        employee_id: parseInt(employeeId),
        service_id: parseInt(serviceId),
        customer_id: parseInt(customerId),
        start_time: startTime,
      });

      setEmployeeId("");
      setServiceId("");
      setCustomerId("");
      setStartTime("");

      fetchAll();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Greška prilikom kreiranja rezervacije.";
      setError(message);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.post(`/api/v1/appointments/${id}/cancel`);
      fetchAll();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Greška prilikom otkazivanja.";
      setError(message);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.post(`/api/v1/appointments/${id}/complete`);
      fetchAll();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Greška prilikom završavanja.";
      setError(message);
    }
  };

  const getEmployeeName = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : "—";
  };

  const getServiceName = (id: number) => {
    const srv = services.find((s) => s.id === id);
    return srv ? srv.name : "—";
  };

  const getCustomerName = (id: number) => {
    const cust = customers.find((c) => c.id === id);
    return cust ? `${cust.first_name} ${cust.last_name}` : "—";
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("bs-BA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Rezervacije</h1>

      <form
        onSubmit={handleCreateAppointment}
        className="bg-white rounded-lg p-6 shadow-sm mb-6 max-w-md"
      >
        <h3 className="text-lg font-semibold mb-4">Nova rezervacija</h3>

        <div className="mb-4">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
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
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          >
            <option value="">Izaberi uslugu</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes} min)
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          >
            <option value="">Izaberi klijenta</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Kreiraj rezervaciju
        </button>
      </form>

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
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Datum/Vrijeme
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Zaposleni
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Usluga
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Klijent
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{formatDateTime(a.start_time)}</td>
                <td className="px-4 py-3">{getEmployeeName(a.employee_id)}</td>
                <td className="px-4 py-3">{getServiceName(a.service_id)}</td>
                <td className="px-4 py-3">{getCustomerName(a.customer_id)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`${STATUS_STYLES[a.status] || "bg-slate-500"} text-white px-3 py-1 rounded-full text-xs font-semibold`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {(a.status === "created" || a.status === "confirmed") && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleComplete(a.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Završi
                      </button>
                      <button
                        onClick={() => handleCancel(a.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Otkaži
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Appointments;