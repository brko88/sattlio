import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Lozinke se ne podudaraju.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Lozinka mora imati najmanje 8 karaktera.");
      return;
    }
    try {
      await api.post("/api/v1/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greska. Token mozda istekao.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm text-center">
          <p className="text-red-600">Neispravan link za reset lozinke.</p>
          <Link to="/" className="text-blue-600 text-sm mt-4 block">Nazad na prijavu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Nova lozinka
        </h1>
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-700">
            Lozinka je uspjesno promijenjena. Preusmjeravamo vas na prijavu...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-2">
                Nova lozinka
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-2">
                Potvrdi lozinku
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Promijeni lozinku
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
