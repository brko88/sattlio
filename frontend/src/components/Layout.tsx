import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { useTenant } from "../contexts/TenantContext";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, setTenantId, tenants } = useTenant();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: "Dashboard" },
    { to: "/calendar", label: "Kalendar", icon: "Kalendar" },
    { to: "/employees", label: "Zaposleni", icon: "Zaposleni" },
    { to: "/services", label: "Usluge", icon: "Usluge" },
    { to: "/customers", label: "Klijenti", icon: "Klijenti" },
    { to: "/appointments", label: "Rezervacije", icon: "Rezervacije" },
    { to: "/working-hours", label: "Radno vrijeme", icon: "Radno vrijeme" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-slate-800 text-white p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-1">SmartBooking</h2>
        <p className="text-sm text-slate-400 mb-4">Upravljanje rezervacijama</p>

        {tenants.length > 0 && (
          <select
            value={tenantId}
            onChange={(e) => setTenantId(parseInt(e.target.value))}
            className="mb-6 w-full px-2 py-2 rounded-md bg-slate-700 text-white text-sm border border-slate-600 focus:outline-none"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.role})
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

        <Link
          to="/admin"
          className={`px-3 py-2.5 rounded-md text-sm flex items-center gap-2.5 transition-colors mb-2 ${
            location.pathname === "/admin"
              ? "bg-purple-600 text-white font-semibold"
              : "text-purple-300 hover:bg-slate-700"
          }`}
        >
          Admin Panel
        </Link>

        <Link
          to="/create-tenant"
          className="px-3 py-2.5 text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          + Novi poslovni subjekt
        </Link>

        <div className="flex flex-col gap-1 mb-2 border-t border-slate-700 pt-3">
          <a href="mailto:boris.kalamanda@gmail.com?subject=Prijava problema" className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            Prijavi problem (Email)
          </a>
          <a href="https://wa.me/38765497119" target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            Prijavi problem (WhatsApp)
          </a>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-2.5 border border-slate-600 text-slate-300 rounded-md text-sm hover:bg-slate-700 transition-colors"
        >
          Odjavi se
        </button>
      </aside>

      <main className="flex-1 p-8 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
