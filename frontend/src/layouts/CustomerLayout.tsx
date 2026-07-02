import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="flex min-h-screen">
      <aside className="w-60 bg-slate-800 text-white p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-1">Sattlio</h2>
        <p className="text-xs text-slate-400 mb-6">Moj nalog</p>

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

      <main className="flex-1 p-8 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}

export default CustomerLayout;
