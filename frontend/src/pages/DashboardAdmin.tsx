import { useState, useEffect } from "react";
import api from "../services/api";

interface PlatformStats {
  total_tenants: number;
  total_users: number;
  total_employees: number;
  total_appointments: number;
  trial_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  verified_tenants: number;
  pending_tenants: number;
}

interface PlatformHealth {
  backend: { status: string };
  database: { status: string };
  smtp: { status: string };
  paddle: { status: string };
}

const STAT_CARDS: { key: keyof PlatformStats; label: string }[] = [
  { key: "total_tenants", label: "Ukupno salona" },
  { key: "total_users", label: "Ukupno korisnika" },
  { key: "total_employees", label: "Ukupno zaposlenih" },
  { key: "total_appointments", label: "Ukupno termina" },
  { key: "trial_tenants", label: "Na trial-u" },
  { key: "active_tenants", label: "Aktivni (plaćeni)" },
  { key: "verified_tenants", label: "Verifikovani" },
  { key: "pending_tenants", label: "Na čekanju" },
  { key: "suspended_tenants", label: "Suspendovani" },
];

const HEALTH_ITEMS: { key: keyof PlatformHealth; label: string }[] = [
  { key: "backend", label: "Backend" },
  { key: "database", label: "Baza podataka" },
  { key: "smtp", label: "Email (SMTP)" },
  { key: "paddle", label: "Paddle (plaćanja)" },
];

function StatusDot({ status }: { status: string }) {
  const color =
    status === "online"
      ? "bg-green-500"
      : status === "not_configured"
      ? "bg-slate-300"
      : "bg-red-500";
  const label =
    status === "online" ? "Online" : status === "not_configured" ? "Nije podešeno" : "Offline";

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, healthRes] = await Promise.all([
        api.get("/api/v1/admin/stats"),
        api.get("/api/v1/admin/health"),
      ]);
      setStats(statsRes.data);
      setHealth(healthRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom učitavanja podataka.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mb-6">Pregled stanja platforme</p>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {STAT_CARDS.map((card) => (
                <div key={card.key} className="bg-white rounded-lg shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{stats[card.key]}</p>
                </div>
              ))}
            </div>
          )}

          {health && (
            <div className="bg-white rounded-lg shadow-sm p-5 max-w-md">
              <h2 className="text-sm font-semibold text-slate-700 uppercase mb-3">
                Platform Health
              </h2>
              <div className="space-y-2">
                {HEALTH_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <StatusDot status={health[item.key].status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
