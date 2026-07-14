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
  tenant_name: string;
  tenant_timezone: string;
}

function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchAppointments = async () => {
    try {
      const response = await api.get("/api/v1/appointments/my");
      setAppointments(response.data);
    } catch (err: any) {
      setError("Greška prilikom učitavanja termina.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (appointmentId: number) => {
    if (!confirm("Otkazati ovu rezervaciju?")) return;
    setError("");
    setMessage("");
    try {
      await api.post(`/api/v1/appointments/${appointmentId}/cancel`);
      setMessage("Rezervacija je otkazana.");
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom otkazivanja.");
    }
  };

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.start_time.endsWith("Z") ? a.start_time : a.start_time + "Z") >= now
      && a.status !== "cancelled"
  );
  const history = appointments.filter(
    (a) => new Date(a.start_time.endsWith("Z") ? a.start_time : a.start_time + "Z") < now
      || a.status === "cancelled"
  );

  const statusLabel = (status: string) => {
    switch (status) {
      case "created": return null;
      case "completed": return { text: "Završeno", cls: "bg-green-100 text-green-700" };
      case "cancelled": return { text: "Otkazano", cls: "bg-red-100 text-red-700" };
      case "no_show": return { text: "Nije se pojavio", cls: "bg-amber-100 text-amber-700" };
      case "expired": return { text: "Isteklo", cls: "bg-slate-100 text-slate-500" };
      default: return null;
    }
  };

  const renderCard = (a: Appointment, showCancel: boolean) => {
    const label = statusLabel(a.status);
    return (
      <div key={a.id} className="bg-white rounded-lg shadow-sm p-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{a.service_name}</p>
            {label && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${label.cls}`}>
                {label.text}
              </span>
            )}
          </div>
          <p className="text-sm text-purple-700 font-medium">{a.tenant_name}</p>
          <p className="text-sm text-slate-500">{a.employee_name}</p>
          <p className="text-sm text-slate-500">{formatDateTime(a.start_time, a.tenant_timezone)}</p>
        </div>
        {showCancel && (
          <button
            onClick={() => handleCancel(a.id)}
            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Otkaži
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Moji termini</h1>
      <p className="text-slate-500 mb-6">Pregled vaših rezervacija</p>

      {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Nemate nijednu rezervaciju.
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Predstojeći termini</h2>
          {upcoming.length === 0 ? (
            <p className="text-slate-400 text-sm mb-8">Nemate predstojećih termina.</p>
          ) : (
            <div className="space-y-3 mb-8">
              {upcoming.map((a) => renderCard(a, true))}
            </div>
          )}

          <h2 className="text-lg font-semibold text-slate-900 mb-3">Historija termina</h2>
          {history.length === 0 ? (
            <p className="text-slate-400 text-sm">Nema prošlih termina.</p>
          ) : (
            <div className="space-y-3">
              {history.map((a) => renderCard(a, false))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyAppointments;
