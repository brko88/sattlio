import { useState, useEffect } from "react";
import api from "../services/api";
import { SkeletonCards } from "../components/Skeleton";

interface BillingSettings {
  enforcement_enabled: boolean;
  enforcement_since: string | null;
  protected_count?: number;
}

function AdminSubscriptions() {
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/v1/admin/billing-settings");
      setSettings(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom učitavanja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async () => {
    if (!settings) return;
    const turningOn = !settings.enforcement_enabled;
    if (
      turningOn &&
      !window.confirm(
        "Uključiti naplatu?\n\n• Svi POSTOJEĆI saloni će automatski biti označeni kao beta testeri (zaštićeni — nastavljaju besplatno).\n• Saloni registrovani OD SADA dobijaju 14 dana probnog perioda, pa read-only ako ne plate.\n\nKad poželiš da i neki od zaštićenih krene plaćati, samo mu skini beta oznaku u Salonima (dobiće svježih 14 dana)."
      )
    ) {
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await api.patch("/api/v1/admin/billing-settings", { enabled: turningOn });
      setSettings(res.data);
      if (turningOn) {
        const n = res.data.protected_count ?? 0;
        setMessage(
          n > 0
            ? `Naplata je uključena. Zaštićeno postojećih salona (označeni kao beta testeri): ${n}.`
            : "Naplata je uključena."
        );
      } else {
        setMessage("Naplata je isključena.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom izmjene.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Pretplate i naplata</h1>
      <p className="text-slate-500 mb-6">
        Globalni prekidač za naplatu i read-only mode. Dok je isključen, sve je besplatno za sve korisnike.
      </p>

      {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading || !settings ? (
        <SkeletonCards count={1} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-5 max-w-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900 mb-1">Naplata / read-only mode</h2>
              <p className="text-sm text-slate-500">
                Kad je <strong>uključeno</strong>: novi saloni imaju 14 dana probnog perioda pa idu u
                read-only ako ne plate. Svi <strong>postojeći</strong> saloni se pri uključenju automatski
                označe kao beta testeri (zaštićeni). Kad poželiš da neki od njih krene plaćati, skini mu
                beta oznaku u <strong>Salonima</strong> — dobiće svježih 14 dana pa tek onda read-only.
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`shrink-0 px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                settings.enforcement_enabled
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {settings.enforcement_enabled ? "Isključi naplatu" : "Uključi naplatu"}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Trenutno stanje</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  settings.enforcement_enabled
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {settings.enforcement_enabled ? "Naplata AKTIVNA" : "Besplatno za sve (test period)"}
              </span>
            </div>
            {settings.enforcement_since && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-600">Naplata uključena od</span>
                <span className="text-slate-900 font-medium">
                  {new Date(settings.enforcement_since).toLocaleString("bs-BA")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSubscriptions;
