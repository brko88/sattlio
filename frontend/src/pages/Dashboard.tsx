import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";
import ShareSalonButton from "../components/ShareSalonButton";
import { SkeletonStatCards } from "../components/Skeleton";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  allow_self_booking: boolean;
  is_active: boolean;
}

interface TenantInfo {
  verification_status: string;
  name: string;
}

function Dashboard() {
  const { tenantId, plan, trialEndsAt } = useTenant();
  const [stats, setStats] = useState({
    employees: 0,
    services: 0,
    customers: 0,
    appointments: 0,
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [betaActive, setBetaActive] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, srvRes, custRes, apptRes, tenantsRes, announcementsRes] = await Promise.all([
          api.get("/api/v1/employees", { params: { tenant_id: tenantId } }),
          api.get("/api/v1/services", { params: { tenant_id: tenantId } }),
          api.get("/api/v1/customers", { params: { tenant_id: tenantId } }),
          api.get("/api/v1/appointments", { params: { tenant_id: tenantId } }),
          api.get("/api/v1/tenants/my"),
          api.get("/api/v1/public/announcements"),
        ]);
        setStats({
          employees: empRes.data.length,
          services: srvRes.data.total,
          customers: custRes.data.total,
          appointments: apptRes.data.total,
        });
        setEmployees(empRes.data);
        const currentTenant = tenantsRes.data.find((t: any) => t.id === tenantId);
        if (currentTenant) setTenant(currentTenant);
        setBetaActive(announcementsRes.data.some((a: any) => a.kind === "beta"));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [tenantId]);

  const cards = [
    { label: "Zaposleni", value: stats.employees, border: "border-l-blue-600" },
    { label: "Usluge", value: stats.services, border: "border-l-green-600" },
    { label: "Klijenti", value: stats.customers, border: "border-l-amber-500" },
    { label: "Rezervacije", value: stats.appointments, border: "border-l-red-600" },
  ];

  const isPending = tenant?.verification_status === "pending";
  const isSuspended = tenant?.verification_status === "suspended";

  // Trial dani
  const trialDaysLeft = (() => {
    if (plan !== "trial" || !trialEndsAt) return null;
    const diff = new Date(trialEndsAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const getTrialBgClass = () => {
    if (trialDaysLeft === null) return "";
    if (trialDaysLeft <= 3) return "bg-red-50 border-red-200";
    if (trialDaysLeft <= 7) return "bg-amber-50 border-amber-200";
    return "bg-blue-50 border-blue-200";
  };

  const getTrialTextClass = () => {
    if (trialDaysLeft === null) return "";
    if (trialDaysLeft <= 3) return "text-red-800";
    if (trialDaysLeft <= 7) return "text-amber-800";
    return "text-blue-800";
  };

  const getTrialSubTextClass = () => {
    if (trialDaysLeft === null) return "";
    if (trialDaysLeft <= 3) return "text-red-600";
    if (trialDaysLeft <= 7) return "text-amber-600";
    return "text-blue-600";
  };

  const getTrialIcon = () => {
    if (trialDaysLeft === null) return "";
    if (trialDaysLeft <= 3) return "🔴";
    if (trialDaysLeft <= 7) return "⚠️";
    return "ℹ️";
  };

  const getDaysLabel = (days: number) => {
    if (days === 1) return "1 dan";
    if (days < 5) return `${days} dana`;
    return `${days} dana`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mb-6">Pregled vašeg poslovnog subjekta</p>

      {!loading && (
        <div className="mb-6 space-y-3">

          {/* Trial banner - sakriven dok je beta baner aktivan (kontradiktorne poruke) */}
          {trialDaysLeft !== null && !betaActive && (
            <div className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${getTrialBgClass()}`}>
              <span className="text-lg mt-0.5">{getTrialIcon()}</span>
              <div>
                <p className={`font-medium text-sm ${getTrialTextClass()}`}>
                  {trialDaysLeft === 0
                    ? "Probni period je istekao!"
                    : `Probni period — ostalo ${getDaysLabel(trialDaysLeft)}`}
                </p>
                <p className={`text-xs mt-0.5 ${getTrialSubTextClass()}`}>
                  {trialDaysLeft === 0
                    ? "Pretplatite se da nastavite koristiti Sattlio."
                    : "Nakon isteka probnog perioda potrebna je pretplata."}
                </p>
              </div>
            </div>
          )}

          {/* Verifikacija */}
          {isPending && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
              <div>
                <p className="font-medium text-amber-800 text-sm">Salon na čekanju verifikacije</p>
                <p className="text-amber-600 text-xs mt-0.5">
                  Klijenti ne mogu pronaći vaš salon dok administrator ne potvrdi podatke.
                </p>
              </div>
            </div>
          )}

          {isSuspended && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <span className="text-red-500 text-lg mt-0.5">🚫</span>
              <div>
                <p className="font-medium text-red-800 text-sm">Salon je suspendovan</p>
                <p className="text-red-600 text-xs mt-0.5">
                  Vaš salon je privremeno deaktiviran. Kontaktirajte podršku.
                </p>
              </div>
            </div>
          )}

          {/* Online rezervacije po zaposlenom */}
          {employees.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-slate-700 mb-2">Online rezervacije</p>
              <div className="space-y-1.5">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${emp.allow_self_booking ? "bg-green-500" : "bg-red-400"}`} />
                    <span className="text-sm text-slate-600">
                      {emp.first_name} {emp.last_name}
                    </span>
                    <span className={`text-xs ml-auto ${emp.allow_self_booking ? "text-green-600" : "text-slate-400"}`}>
                      {emp.allow_self_booking ? "Uključeno" : "Isključeno"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonStatCards count={4} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`bg-white rounded-lg p-5 shadow-sm border-l-4 ${card.border}`}
            >
              <p className="text-slate-500 text-sm mb-2">{card.label}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-6 max-w-md">
          <ShareSalonButton hasEnabledEmployee={employees.some((e) => e.allow_self_booking)} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
