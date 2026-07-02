import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  allow_self_booking: boolean;
}

function BookingLanding() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/public/employees")
      .then((res) => setEmployees(res.data))
      .catch(() => setError("Greška prilikom učitavanja."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Nova rezervacija</h1>
      <p className="text-slate-500 mb-8">Odaberite osobu kod koje želite rezervisati termin</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          Trenutno nema dostupnih termina za online rezervaciju.
        </div>
      ) : (
        <div className="grid gap-3 max-w-md">
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => navigate(`/book/${emp.id}`)}
              className="bg-white rounded-lg p-5 shadow-sm text-left hover:shadow-md transition-shadow border border-slate-100 hover:border-blue-200"
            >
              <p className="font-semibold text-slate-900">
                {emp.first_name} {emp.last_name}
              </p>
              <p className="text-sm text-blue-600 mt-1">Pogledaj slobodne termine →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingLanding;
