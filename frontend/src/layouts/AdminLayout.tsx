import { useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import api from "../services/api";
import VersionBadge from "../components/VersionBadge";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await api.post("/api/v1/auth/logout").catch(() => {});
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const links = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/tenants", label: "Saloni" },
    { to: "/admin/users", label: "Korisnici" },
    { to: "/admin/verifications", label: "Verifikacije" },
    { to: "/admin/subscriptions", label: "Pretplate" },
    { to: "/admin/statistics", label: "Statistika" },
    { to: "/admin/announcements", label: "Baneri" },
    { to: "/admin/audit-log", label: "Audit log" },
  ];

  return (
    <div className="lg:flex min-h-screen">
      {/* Mobilna gornja traka */}
      <div className="lg:hidden sticky top-[env(safe-area-inset-top)] z-20 flex items-center justify-between bg-purple-950 text-white px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Otvori meni"
          className="p-2 -ml-2 min-w-11 flex items-center justify-center"
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
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-purple-950 text-white p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col overflow-y-auto transform transition-transform duration-200 lg:translate-x-0 lg:static ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-xl font-bold mb-1">Sattlio</h2>
        <p className="text-xs text-purple-300 mb-6">Super Admin</p>

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

        <VersionBadge className="text-purple-400" />
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
