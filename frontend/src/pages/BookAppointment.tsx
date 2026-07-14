import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { formatTime } from "../utils/time";
import Avatar from "../components/Avatar";

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  tenant_timezone: string | null;
}

function BookAppointment() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, svcRes] = await Promise.all([
          api.get(`/api/v1/public/employees/${employeeId}`),
          api.get(`/api/v1/public/employees/${employeeId}/services`),
        ]);
        setEmployee(empRes.data);
        setServices(svcRes.data);
      } catch (err: any) {
        setError("Zaposleni nije dostupan za online rezervaciju.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    api
      .get(`/api/v1/public/employees/${employeeId}/slots`, {
        params: { date_str: selectedDate, service_id: selectedService },
      })
      .then((res) => setSlots(res.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedService]);

  const handleBook = async () => {
    if (!selectedSlot || !selectedService) return;
    if (!token) {
      localStorage.setItem(
        "pending_booking",
        JSON.stringify({
          employee_id: Number(employeeId),
          service_id: selectedService,
          start_time: selectedSlot,
          note: note || null,
        })
      );
      navigate("/login");
      return;
    }
    setError("");
    try {
      await api.post("/api/v1/public/appointments", {
        employee_id: Number(employeeId),
        service_id: selectedService,
        start_time: selectedSlot,
        note: note || null,
      });
      window.location.href = "/my-appointments";
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom rezervacije.");
    }
  };

  const formatSlot = (iso: string) => formatTime(iso, employee?.tenant_timezone || undefined);

  const today = new Date().toISOString().split("T")[0];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      Učitavanje...
    </div>
  );

  if (error && !employee) return (
    <div className="min-h-screen flex items-center justify-center text-red-600">
      {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate("/book")}
          className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
        >
          ← Nazad
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Online rezervacija</h1>
        {employee && (
          <div className="flex items-center gap-2 mb-6">
            <Avatar src={employee.avatar_url} firstName={employee.first_name} lastName={employee.last_name} size={32} />
            <p className="text-slate-500">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-semibold mb-3">1. Odaberite uslugu</h3>
          <div className="flex flex-col gap-2">
            {services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => { setSelectedService(svc.id); setSelectedSlot(null); }}
                className={`px-4 py-3 rounded-md text-left border transition-colors ${
                  selectedService === svc.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <span className="font-medium">{svc.name}</span>
                <span className="text-slate-400 text-sm ml-2">
                  {svc.duration_minutes} min • {svc.price} KM
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedService && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h3 className="font-semibold mb-3">2. Odaberite datum</h3>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {selectedDate && selectedService && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h3 className="font-semibold mb-3">3. Odaberite termin</h3>
            {loadingSlots ? (
              <p className="text-slate-400 text-sm">Učitavanje termina...</p>
            ) : slots.length === 0 ? (
              <p className="text-slate-400 text-sm">
                Nema slobodnih termina za odabrani datum.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
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

        {selectedSlot && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <label className="block font-semibold mb-2 text-sm">Napomena uz rezervaciju (opciono)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Npr. alergija, poseban zahtjev, kasnicu par minuta..."
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {selectedSlot && (
          <button
            onClick={handleBook}
            className="w-full px-5 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            {token ? "Potvrdi rezervaciju" : "Prijavite se za rezervaciju"}
          </button>
        )}
      </div>
    </div>
  );
}

export default BookAppointment;

