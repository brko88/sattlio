import { useState } from "react";
import { useTenant } from "../contexts/TenantContext";

interface ShareSalonButtonProps {
  hasEnabledEmployee?: boolean;
}

function ShareSalonButton({ hasEnabledEmployee }: ShareSalonButtonProps) {
  const { tenantId, tenants } = useTenant();
  const [copied, setCopied] = useState(false);

  const activeTenant = tenants.find((t) => t.id === tenantId);

  if (!activeTenant || !activeTenant.slug) {
    return null;
  }

  // Puni javni link salona (koristi trenutni domen, radi i na localhost i u produkciji)
  const salonUrl = `${window.location.origin}/${activeTenant.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(salonUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ako clipboard API nije dostupan
      const input = document.createElement("input");
      input.value = salonUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    // Native share (mobilni - otvara WhatsApp/Viber/Instagram itd.)
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeTenant.name,
          text: `Rezervišite termin u salonu ${activeTenant.name}`,
          url: salonUrl,
        });
      } catch {
        // Korisnik je otkazao share - ne radimo nista
      }
    } else {
      // Desktop fallback - samo kopiraj
      handleCopy();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 uppercase mb-2">
        Javni link salona
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Podijelite ovaj link sa klijentima da mogu rezervisati termin online.
      </p>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={salonUrl}
          readOnly
          className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 text-slate-600"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {copied ? "✓ Kopirano!" : "Kopiraj link"}
        </button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Podijeli
          </button>
        )}
      </div>

      {hasEnabledEmployee !== undefined && (
        hasEnabledEmployee ? (
          <p className="text-xs text-green-600 mt-3">
            🟢 Online rezervacije su uključene. Klijenti mogu odmah rezervisati termin putem ovog linka.
          </p>
        ) : (
          <p className="text-xs text-amber-600 mt-3">
            ⚠️ Online rezervacije su trenutno isključene. Posjetioci će moći vidjeti vaš javni profil, ali neće moći rezervisati termin dok ponovo ne uključite online rezervacije.
          </p>
        )
      )}
    </div>
  );
}

export default ShareSalonButton;
