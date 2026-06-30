import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

function Dashboard() {
  const { tenantId } = useTenant();
  const [stats, setStats] = useState({
    employees: 0,
    services: 0,
    customers: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, srvRes, custRes, apptRes] = await Promise.all([
          api.get("/api/v1/employees", { params: { tenant_id: tenantId } }),
          api.get("/api/v1/services", { params: { tenant_id: tenantId } }),
          api.get("/api/v1/customers", { params: { tenant_id: tenantId } }),
          api.get("/api/v1/appointments", { params: { tenant_id: tenantId } }),
        ]);
        setStats({
          employees: empRes.data.length,
          services: srvRes.data.length,
          customers: custRes.data.length,
          appointments: apptRes.data.length,
        });
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mb-8">Pregled vašeg poslovnog subjekta</p>

      {loading ? (
        <p>Učitavanje...</p>
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
    </div>
  );
}

export default Dashboard;