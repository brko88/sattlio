import { useState, useEffect } from "react";
import api from "../services/api";
import { formatDateTime } from "../utils/time";
import Avatar from "../components/Avatar";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonCards } from "../components/Skeleton";
import { useToast } from "../contexts/ToastContext";

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
  tenant_logo_url: string | null;
  tenant_timezone: string;
}

function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const showToast = useToast();

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
    const toastMessage = sessionStorage.getItem("toast_message");
    if (toastMessage) {
      showToast(toastMessage);
      sessionStorage.removeItem("toast_message");
    }
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setError("");
    setMessage("");
    try {
      await api.post(`/api/v1/appointments/${cancelTarget.id}/cancel`);
      setMessage("Rezervacija je otkazana.");
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom otkazivanja.");
    } finally {
      setCancelTarget(null);
    }
  };

  const toDate = (a: Appointment) => new Date(a.start_time.endsWith("Z") ? a.start_time : a.start_time + "Z");

  const now = new Date();
  const upcoming = appointments
    .filter((a) => toDate(a) >= now && a.status !== "cancelled")
    .sort((a, b) => toDate(a).getTime() - toDate(b).getTime());
  const history = appointments
    .filter((a) => toDate(a) < now || a.status === "cancelled")
    .sort((a, b) => toDate(b).getTime() - toDate(a).getTime());

  const statusLabel = (status: string) => {
    switch (status) {
      case "created": return { text: "Zakazano", cls: "bg-blue-100 text-blue-700" };
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
      <div
        key={a.id}
        className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 flex items-start gap-3"
      >
        <Avatar src={a.tenant_logo_url} firstName={a.tenant_name} size={40} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900">{a.service_name}</p>
            {label && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${label.cls}`}>
                {label.text}
              </span>
            )}
          </div>
          <p className="text-sm text-purple-700 font-medium truncate">{a.tenant_name}</p>
          <p className="text-sm text-slate-500">{a.employee_name}</p>
          <p className="text-sm text-slate-500">{formatDateTime(a.start_time, a.tenant_timezone)}</p>
        </div>
        {showCancel && (
          <button
            onClick={() => setCancelTarget(a)}
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
        <SkeletonCards count={3} />
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
            📅
          </div>
          <p className="text-slate-500 text-sm">Nemate nijednu rezervaciju.</p>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Predstojeći termini</h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-100 mb-8">
              <p className="text-slate-400 text-sm">Nemate predstojećih termina.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {upcoming.map((a) => renderCard(a, true))}
            </div>
          )}

          <h2 className="text-lg font-semibold text-slate-900 mb-3">Historija termina</h2>
          {history.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
              <p className="text-slate-400 text-sm">Nema prošlih termina.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((a) => renderCard(a, false))}
            </div>
          )}
        </>
      )}

      {cancelTarget && (
        <ConfirmModal
          title="Otkazivanje termina"
          message={`Da li ste sigurni da želite otkazati "${cancelTarget.service_name}" u ${cancelTarget.tenant_name}?`}
          confirmLabel="Da, otkaži"
          cancelLabel="Nazad"
          danger
          onCancel={() => setCancelTarget(null)}
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
}

export default MyAppointments;
