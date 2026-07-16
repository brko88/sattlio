import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Floating Action Button (+) u donjem desnom uglu - samo na mobilnom (ispod lg,
 * gdje je sidebar sakriven iza hamburgera). Brzi pristup dvjema najcescim
 * akcijama bez otvaranja menija: nova rezervacija i novi klijent.
 */
function FabMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="lg:hidden">
      {/* Backdrop - klik van menija ga zatvara */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <div
        className="fixed z-50 flex flex-col items-end gap-2"
        style={{ right: "1rem", bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        {open && (
          <>
            <button
              onClick={() => go("/appointments")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 rounded-full shadow-lg border border-slate-200 text-sm font-medium"
            >
              <span aria-hidden="true">➕</span> Nova rezervacija
            </button>
            <button
              onClick={() => go("/customers")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 rounded-full shadow-lg border border-slate-200 text-sm font-medium"
            >
              <span aria-hidden="true">👤</span> Novi klijent
            </button>
          </>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Brze akcije"
          aria-expanded={open}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default FabMenu;
