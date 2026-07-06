import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

const PLAN_LABELS: Record<string, string> = {
  solo: "Solo — 14,90 KM/mj",
  start: "Start — 29,90 KM/mj",
  pro: "Pro — 59,90 KM/mj",
  business: "Business — po dogovoru",
};

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan") ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/api/v1/auth/register", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });

      // Sačuvaj odabrani plan za kasnije
      if (selectedPlan) {
        localStorage.setItem("selected_plan", selectedPlan);
      }

      setSuccess(true);
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Greška prilikom registracije.";
      setError(message);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Registracija uspješna
          </h1>
          <p className="text-slate-500 mb-6">
            Poslali smo vam email sa verifikacionim linkom. Provjerite inbox
            (i spam folder).
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Idi na prijavu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Sattlio — Registracija
        </h1>

        {/* Prikaz odabranog plana */}
        {selectedPlan && PLAN_LABELS[selectedPlan] && (
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-4">
            <p className="text-xs text-blue-600 font-medium">Odabrani paket</p>
            <p className="text-sm text-blue-900 font-semibold">{PLAN_LABELS[selectedPlan]}</p>
            <p className="text-xs text-blue-500 mt-0.5">14 dana besplatnog probnog perioda</p>
          </div>
        )}

        <p className="text-slate-500 text-sm mb-6">Kreirajte vaš nalog</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Ime
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Prezime
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Lozinka
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Registruj se
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          Već imaš nalog?{" "}
          <Link to="/login" className="text-blue-600 font-medium">
            Prijavi se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
