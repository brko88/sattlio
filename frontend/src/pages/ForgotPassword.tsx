import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/v1/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err: any) {
      setError("Greska. Pokusajte ponovo.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Reset lozinke
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Unesite vas email i posaljemo vam link za reset lozinke.
        </p>
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-700">
            Ako email postoji u sistemu, poslan je link za reset lozinke.
            Provjerite inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Posalji link
            </button>
          </form>
        )}
        <p className="mt-4 text-sm text-slate-500">
          <Link to="/" className="text-blue-600 font-medium">
            Nazad na prijavu
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
