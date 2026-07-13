import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("Morate prihvatiti Uslove korištenja i Politiku privatnosti.");
      return;
    }

    try {
      await api.post("/api/v1/auth/register", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        terms_accepted: termsAccepted,
      });

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

        {/* Beta pristup — besplatno tokom beta faze */}
        <div className="bg-purple-50 border border-purple-200 rounded-md px-3 py-2 mb-4">
          <p className="text-sm text-purple-900 font-semibold">
            🎉 Besplatan beta pristup
          </p>
          <p className="text-xs text-purple-600 mt-0.5">
            Sattlio je trenutno u beta fazi — korištenje je potpuno besplatno.
            Nema naplate niti obaveze.
          </p>
        </div>

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
              maxLength={30}
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
              maxLength={30}
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

          <div className="mb-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                className="w-4 h-4 mt-0.5 accent-blue-600 shrink-0"
              />
              <span className="text-sm text-slate-600">
                Pročitao/la sam i prihvatam{" "}
                <Link to="/uslovi-koristenja" target="_blank" className="text-blue-600 hover:underline">
                  Uslove korištenja
                </Link>{" "}
                i{" "}
                <Link to="/politika-privatnosti" target="_blank" className="text-blue-600 hover:underline">
                  Politiku privatnosti
                </Link>
                .
              </span>
            </label>
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={!termsAccepted}
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
