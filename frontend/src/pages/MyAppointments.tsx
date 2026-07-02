import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

interface Appointment {
  id: number;
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

const STATUS_LABELS: Record<string, string> = {
  created: "Zakazano",
  confirmed: "Potvrđeno",
  completed: "Završeno",
  cancelled: "Otkazano",
  no_show: "Nije došao",
};

const STATUS_STYLES: Record<string, string> = {
  created: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-slate-100 text-slate-500",
};

function MyAppointments() {
  const { tenantId } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, empRes, srvRes] = await Promise.all([
          api.get("/api/v1/appointments/my"),
          api.get("/api/v1/public/employees"),
          api.get("/api/v1/public/employees"),
        ]);
        setAppointments(apptRes.data);
        setEmployees(empRes.data);
        setServices(srvRes.data);
      } catch (err: any) {
        setError("Greška prilikom učitavanja termina.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  const getEmployeeName = (id: number) => {
    const e = employees.find((e) => e.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "—";
  };

  const getServiceName = (id: number) =>
    services.find((s) => s.id === id)?.name || "—";

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

  const upcoming = appointments.filter(
    (a) => a.status === "created" || a.status === "confirmed"
  );
  const past = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled" || a.status === "no_show"
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Moji termini</h1>
      <p className="text-slate-500 mb-8">Pregled vaših rezervacija</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          <p className="mb-2">Nemate zakazanih termina.</p>
          <a
            href="/book"
            className="text-blue-600 font-medium hover:underline"
          >
            Rezervišite termin →
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-3">
                Predstojeći termini
              </h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {getServiceName(a.service_id)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {getEmployeeName(a.employee_id)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(a.start_time)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[a.status]}`}
                    >
                      {STATUS_LABELS[a.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-3">
                Historija termina
              </h2>
              <div className="space-y-3">
                {past.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between opacity-75"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {getServiceName(a.service_id)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {getEmployeeName(a.employee_id)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(a.start_time)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[a.status]}`}
                    >
                      {STATUS_LABELS[a.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
