import { useState, useEffect, useRef } from "react";

function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleWaiting = (worker: ServiceWorker | null) => {
      if (!worker) return;
      waitingWorkerRef.current = worker;
      setUpdateAvailable(true);
    };

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      // Vec postoji nova verzija koja ceka (npr. otvorena na drugoj kartici u medjuvremenu)
      if (registration.waiting) {
        handleWaiting(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // "installed" + vec postoji aktivni kontroler = ovo je AZURIRANJE postojece
          // instalacije, ne prvi install (tada kontrolera jos nema)
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            handleWaiting(installing);
          }
        });
      });
    });

    let reloaded = false;
    const handleControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const handleRefresh = () => {
    waitingWorkerRef.current?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!updateAvailable) return null;

  return (
    <div className="w-full flex items-center justify-center gap-3 text-sm px-4 py-2 bg-blue-600 text-white">
      <span>Dostupna je nova verzija.</span>
      <button
        onClick={handleRefresh}
        className="px-3 py-1 bg-white text-blue-600 rounded-md text-xs font-semibold hover:bg-blue-50 transition-colors"
      >
        Osvježi
      </button>
    </div>
  );
}

export default UpdateBanner;
