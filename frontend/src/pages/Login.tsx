import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/api/v1/auth/login", {
        email,
        password,
      });
      localStorage.setItem("access_token", response.data.access_token);

      // Učitaj podatke o korisniku
      const meResponse = await api.get("/api/v1/auth/me");
      localStorage.setItem("is_superadmin", meResponse.data.is_superadmin ? "true" : "false");

      // Učitaj tenante i postavi prvi kao aktivan
      if (!meResponse.data.is_superadmin) {
        const tenantsResponse = await api.get("/api/v1/tenants/my");
        if (tenantsResponse.data.length > 0) {
          const storedId = localStorage.getItem("tenant_id");
          const exists = tenantsResponse.data.some(
            (t: any) => t.id === parseInt(storedId || "0")
          );
          const activeId = exists ? parseInt(storedId!) : tenantsResponse.data[0].id;
          localStorage.setItem("tenant_id", activeId.toString());
          const activeRole = tenantsResponse.data.find((t: any) => t.id === activeId)?.role ?? "";
          localStorage.setItem("current_role", activeRole);
        }
      }

      // Ako je korisnik usred rezervacije bio prekinut zahtjevom za login,
      // zavrsi tu rezervaciju sad kad je token dostupan, pa ga vrati na Moje termine.
      const pendingBookingRaw = localStorage.getItem("pending_booking");
      if (pendingBookingRaw) {
        try {
          const pendingBooking = JSON.parse(pendingBookingRaw);
          await api.post("/api/v1/public/appointments", pendingBooking);
        } catch (err) {
          // Rezervacija nije uspjela (npr. termin je u meduvremenu zauzet) -
          // korisnik moze pokusati ponovo sa stranice salona.
        }
        localStorage.removeItem("pending_booking");
        window.location.href = "/my-appointments";
        return;
      }

      // Hard redirect — osigurava da TenantContext počne svježe
      window.location.href = "/dashboard";
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Greška prilikom prijave.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Sattlio - Prijava
        </h1>
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Lozinka
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4 text-right">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Zaboravili ste lozinku?
            </Link>
          </div>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Prijavi se
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Nemas nalog?{" "}
          <Link to="/register" className="text-blue-600 font-medium">
            Registruj se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

