import { useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const links = [
    { to: "/my-appointments", label: "Moji termini" },
    { to: "/book", label: "Nova rezervacija" },
    { to: "/profile", label: "Moj profil" },
  ];

  return (
    <div className="lg:flex min-h-screen">
      {/* Mobilna gornja traka */}
      <div className="lg:hidden flex items-center justify-between bg-slate-800 text-white px-4 py-3">
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
        <p className="text-xs text-slate-400 mb-6">Moj nalog</p>

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
          <a
            href="https://wa.me/38765497119"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
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

      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default CustomerLayout;
