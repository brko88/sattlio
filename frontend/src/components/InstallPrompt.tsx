import { useState, useEffect, useRef } from "react";

const OPEN_COUNT_KEY = "sattlio_open_count";
const DISMISSED_KEY = "sattlio_install_dismissed";
const MIN_OPENS_BEFORE_PROMPT = 3;

function InstallPrompt() {
  const deferredPromptRef = useRef<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Preskoci ako je vec instalirana (standalone mod) ili je korisnik ranije odbio
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone || localStorage.getItem(DISMISSED_KEY) === "true") return;

    // Broj otvaranja aplikacije - prompt se nudi tek nakon 2-3. puta, ne odmah
    const count = parseInt(localStorage.getItem(OPEN_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(OPEN_COUNT_KEY, String(count));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      if (count >= MIN_OPENS_BEFORE_PROMPT) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShowPrompt(false);
    deferredPromptRef.current = null;
    if (outcome !== "accepted") {
      localStorage.setItem(DISMISSED_KEY, "true");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[9998] w-[calc(100%-2rem)] max-w-sm"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            S
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">Instaliraj Sattlio</p>
            <p className="text-xs text-slate-500">Dodaj na početni ekran za brži pristup, bez browsera.</p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Zatvori"
            className="text-slate-400 hover:text-slate-600 shrink-0 flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Instaliraj
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
