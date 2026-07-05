import { useState, useEffect } from "react";
import api from "../services/api";
import { formatDateTime } from "../utils/time";

interface Appointment {
  id: number;
  employee_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  service_name: string;
  employee_name: string;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchAppointments = () => {
    api
      .get("/api/v1/appointments/my")
      .then((res) => setAppointments(res.data))
      .catch(() => setError("Greška prilikom učitavanja termina."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Da li ste sigurni da želite otkazati ovaj termin?")) return;
    setCancelling(id);
    try {
      await api.post(`/api/v1/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom otkazivanja.");
    } finally {
      setCancelling(null);
    }
  };



  const upcoming = appointments.filter(
    (a) => a.status === "created" || a.status === "confirmed"
  );
  const past = appointments.filter(
    (a) =>
      a.status === "completed" ||
      a.status === "cancelled" ||
      a.status === "no_show"
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
          <a href="/book" className="text-blue-600 font-medium hover:underline">
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
                    className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{a.service_name}</p>
                      <p className="text-sm text-slate-500">{a.employee_name}</p>
                      <p className="text-sm text-slate-500">{formatDateTime(a.start_time)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                      <button
                        onClick={() => handleCancel(a.id)}
                        disabled={cancelling === a.id}
                        className="px-3 py-1.5 border border-red-300 text-red-600 rounded-md text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {cancelling === a.id ? "..." : "Otkaži"}
                      </button>
                    </div>
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
                      <p className="font-medium text-slate-900">{a.service_name}</p>
                      <p className="text-sm text-slate-500">{a.employee_name}</p>
                      <p className="text-sm text-slate-500">{formatDateTime(a.start_time)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[a.status]}`}>
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
