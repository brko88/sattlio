import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const links = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/tenants", label: "Saloni" },
    { to: "/admin/users", label: "Korisnici" },
    { to: "/admin/verifications", label: "Verifikacije" },
    { to: "/admin/subscriptions", label: "Pretplate" },
    { to: "/admin/statistics", label: "Statistika" },
    { to: "/admin/audit-log", label: "Audit log" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-purple-950 text-white p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-1">Sattlio</h2>
        <p className="text-xs text-purple-300 mb-6">Super Admin</p>

        <nav className="flex flex-col gap-1 flex-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2.5 rounded-md text-sm flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white font-semibold"
                    : "text-purple-200 hover:bg-purple-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-purple-800 pt-3 mb-2">
          <p className="px-3 py-2 text-xs text-purple-400">
            Sattlio Platform Admin
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-2.5 border border-purple-700 text-purple-300 rounded-md text-sm hover:bg-purple-900 transition-colors"
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

export default AdminLayout;
