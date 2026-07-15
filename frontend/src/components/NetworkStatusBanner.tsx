import { useState, useEffect } from "react";

function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="w-full text-center text-sm px-4 py-2 bg-red-600 text-white">
        📡 Nema internet konekcije.
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="w-full text-center text-sm px-4 py-2 bg-green-600 text-white">
        🟢 Konekcija je ponovo uspostavljena.
      </div>
    );
  }

  return null;
}

export default NetworkStatusBanner;
