import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";

type Period = "today" | "7d" | "30d" | "12mo" | "all";

interface GrowthPoint {
  date: string;
  new_tenants: number;
  new_users: number;
  new_appointments: number;
}

interface GrowthSummary {
  total_tenants: number;
  total_users: number;
  total_appointments: number;
  new_tenants_today: number;
  new_appointments_today: number;
}

interface GrowthResponse {
  period: string;
  granularity: string;
  series: GrowthPoint[];
  summary: GrowthSummary;
}

interface HealthResponse {
  suspended_tenants: number;
  pending_tenants: number;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Danas" },
  { value: "7d", label: "7 dana" },
  { value: "30d", label: "30 dana" },
  { value: "12mo", label: "12 mjeseci" },
  { value: "all", label: "Sve" },
];

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Analytics() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<GrowthResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGrowth = async (selectedPeriod: Period) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/v1/admin/analytics/growth", {
        params: { period: selectedPeriod },
      });
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom učitavanja statistike.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await api.get("/api/v1/admin/analytics/health");
      setHealth(response.data);
    } catch (err) {
      setHealth(null);
    }
  };

  useEffect(() => {
    fetchGrowth(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-slate-900">Statistika</h1>
          <p className="text-slate-500">Rast platforme kroz vrijeme</p>
        </div>

        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === opt.value
                  ? "bg-purple-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <SummaryCard label="Ukupno salona" value={data.summary.total_tenants} />
            <SummaryCard label="Ukupno korisnika" value={data.summary.total_users} />
            <SummaryCard label="Ukupno rezervacija" value={data.summary.total_appointments} />
            <SummaryCard label="Novi saloni danas" value={data.summary.new_tenants_today} />
            <SummaryCard label="Nove rezervacije danas" value={data.summary.new_appointments_today} />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase mb-4">
              📈 Growth
            </h2>
            {data.series.length === 0 ? (
              <p className="text-slate-400 text-sm">Nema podataka za odabrani period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="new_tenants"
                    name="Novi saloni"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="new_users"
                    name="Novi korisnici"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="new_appointments"
                    name="Rezervacije"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase mb-4">
              🚨 Health
            </h2>
            {health ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Suspendovani saloni" value={health.suspended_tenants} />
                <SummaryCard label="Na čekanju verifikacije" value={health.pending_tenants} />
                <div className="bg-slate-50 rounded-lg p-5 border border-dashed border-slate-300">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Neuspjele prijave
                  </p>
                  <p className="text-sm text-slate-400">Uskoro</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-5 border border-dashed border-slate-300">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Greške sistema
                  </p>
                  <p className="text-sm text-slate-400">Uskoro (Sentry)</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Učitavanje...</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default Analytics;
