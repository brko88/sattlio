import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { useTenant } from "../contexts/TenantContext";
import api from "../services/api";

function EmployeeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, setTenantId, tenants } = useTenant();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    api.get("/api/v1/auth/me").then((res) => {
      const name = `${res.data.first_name || ""} ${res.data.last_name || ""}`.trim();
      setUserName(name);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/calendar", label: "Kalendar" },
    { to: "/appointments", label: "Rezervacije" },
    { to: "/customers", label: "Klijenti" },
    { to: "/working-hours", label: "Radno vrijeme" },
  ];

  return (
    <div className="lg:flex min-h-screen">
      {/* Mobilna gornja traka */}
      <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between bg-slate-800 text-white px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Otvori meni"
          className="p-2 -ml-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="font-bold">Sattlio</span>
        <div className="w-8" />
      </div>

      {/* Backdrop za mobilni meni */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-slate-800 text-white p-6 flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-xl font-bold mb-1">Sattlio</h2>
        <Link
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className="block mb-4 hover:opacity-80 transition-opacity"
        >
          <p className="text-xs text-slate-400">Zaposleni{userName ? ` — ${userName}` : ""}</p>
        </Link>

        {tenants.length > 0 && (
          <select
            value={tenantId}
            onChange={(e) => setTenantId(parseInt(e.target.value))}
            className="mb-6 w-full px-2 py-2 rounded-md bg-slate-700 text-white text-sm border border-slate-600 focus:outline-none"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        <nav className="flex flex-col gap-1 flex-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 mb-2 border-t border-slate-700 pt-3">
          <a
            href="mailto:podrska@sattlio.com?subject=Prijava problema"
            className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Prijavi problem (Email)
          </a>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-2.5 border border-slate-600 text-slate-300 rounded-md text-sm hover:bg-slate-700 transition-colors"
        >
          Odjavi se
        </button>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default EmployeeLayout;
