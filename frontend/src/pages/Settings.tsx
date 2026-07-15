import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";
import Avatar from "../components/Avatar";
import { SkeletonCards } from "../components/Skeleton";

const SLOT_OPTIONS = [
  { value: 15, label: "15 minuta" },
  { value: 20, label: "20 minuta" },
  { value: 30, label: "30 minuta" },
  { value: 60, label: "60 minuta" },
];

const TIMEZONES = [
  { value: "Europe/Sarajevo", label: "Sarajevo / Banja Luka (UTC+1/+2)" },
  { value: "Europe/Belgrade", label: "Beograd (UTC+1/+2)" },
  { value: "Europe/Zagreb", label: "Zagreb (UTC+1/+2)" },
  { value: "Europe/Ljubljana", label: "Ljubljana (UTC+1/+2)" },
  { value: "Europe/London", label: "London (UTC+0/+1)" },
  { value: "Europe/Paris", label: "Pariz (UTC+1/+2)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)" },
  { value: "Europe/Rome", label: "Rim (UTC+1/+2)" },
  { value: "Europe/Vienna", label: "Beč (UTC+1/+2)" },
  { value: "Europe/Athens", label: "Atina (UTC+2/+3)" },
  { value: "Europe/Istanbul", label: "Istanbul (UTC+3)" },
  { value: "America/New_York", label: "New York (UTC-5/-4)" },
  { value: "America/Chicago", label: "Chicago (UTC-6/-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { value: "Asia/Riyadh", label: "Rijad (UTC+3)" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10/+11)" },
];

function Settings() {
  const { tenantId, refreshTenants } = useTenant();
  const [slotDuration, setSlotDuration] = useState(30);
  const [customValue, setCustomValue] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [timezone, setTimezone] = useState("Europe/Sarajevo");
  const [tenantName, setTenantName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadTenant = () => {
    api
      .get("/api/v1/tenants/my")
      .then((res) => {
        const tenant = res.data.find((t: any) => t.id === tenantId);
        if (tenant) {
          const val = tenant.slot_duration_minutes;
          const isStandard = SLOT_OPTIONS.some((o) => o.value === val);
          if (isStandard) {
            setSlotDuration(val);
            setIsCustom(false);
          } else {
            setIsCustom(true);
            setCustomValue(val.toString());
          }
          if (tenant.timezone) setTimezone(tenant.timezone);
          setTenantName(tenant.name);
          setLogoUrl(tenant.logo_url);
          setCoverUrl(tenant.cover_url);
        }
      })
      .catch(() => setError("Greška prilikom učitavanja podešavanja."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTenant();
  }, [tenantId]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setMediaError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/api/v1/tenants/${tenantId}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogoUrl(res.data.logo_url);
      await refreshTenants();
    } catch (err: any) {
      setMediaError(err.response?.data?.detail || "Greška prilikom uploada loga.");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await api.delete(`/api/v1/tenants/${tenantId}/logo`);
      setLogoUrl(null);
      await refreshTenants();
    } catch (err: any) {
      setMediaError(err.response?.data?.detail || "Greška prilikom brisanja loga.");
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setMediaError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/api/v1/tenants/${tenantId}/cover`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCoverUrl(res.data.cover_url);
    } catch (err: any) {
      setMediaError(err.response?.data?.detail || "Greška prilikom uploada cover slike.");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleRemoveCover = async () => {
    try {
      await api.delete(`/api/v1/tenants/${tenantId}/cover`);
      setCoverUrl(null);
    } catch (err: any) {
      setMediaError(err.response?.data?.detail || "Greška prilikom brisanja cover slike.");
    }
  };

  const getEffectiveValue = (): number => {
    if (isCustom) {
      const parsed = parseInt(customValue);
      return isNaN(parsed) ? 30 : parsed;
    }
    return slotDuration;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    const value = getEffectiveValue();

    if (value < 5 || value > 240) {
      setError("Interval mora biti između 5 i 240 minuta.");
      setSaving(false);
      return;
    }

    try {
      await api.patch(`/api/v1/tenants/${tenantId}`, {
        slot_duration_minutes: value,
        timezone,
      });
      await refreshTenants();
      setSuccess(`Podešavanja su sačuvana.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom čuvanja.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Podešavanja</h1>
      <p className="text-slate-500 mb-8">Upravljajte postavkama vašeg salona</p>

      {loading ? (
        <SkeletonCards count={2} />
      ) : (
        <>
        <div className="bg-white rounded-lg p-6 shadow-sm max-w-md space-y-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Logo salona</h3>
            <p className="text-sm text-slate-500 mb-3">
              Prikazuje se na javnoj stranici salona, self-booking stranici i u emailovima. JPG, PNG ili WEBP, do 5 MB.
            </p>
            <div className="flex items-center gap-4">
              <Avatar src={logoUrl} firstName={tenantName} size={72} />
              <div className="flex flex-col gap-2">
                <label className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer text-center">
                  {uploadingLogo ? "Učitavanje..." : "Promijeni logo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
                </label>
                {logoUrl && (
                  <button type="button" onClick={handleRemoveLogo} className="text-sm text-red-600 hover:underline">
                    Ukloni logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">Cover slika (opciono)</h3>
            <p className="text-sm text-slate-500 mb-3">
              Banner na vrhu javne stranice salona. JPG, PNG ili WEBP, do 5 MB.
            </p>
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-32 object-cover rounded-md mb-3" />
            ) : (
              <div className="w-full h-32 bg-slate-100 rounded-md mb-3 flex items-center justify-center text-slate-400 text-sm">
                Nema cover slike
              </div>
            )}
            <div className="flex gap-3">
              <label className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer">
                {uploadingCover ? "Učitavanje..." : "Promijeni cover"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} disabled={uploadingCover} />
              </label>
              {coverUrl && (
                <button type="button" onClick={handleRemoveCover} className="text-sm text-red-600 hover:underline">
                  Ukloni cover
                </button>
              )}
            </div>
          </div>

          {mediaError && <p className="text-red-600 text-sm">{mediaError}</p>}
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-lg p-6 shadow-sm max-w-md space-y-6">

          {/* Timezone */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Vremenska zona</h3>
            <p className="text-sm text-slate-500 mb-3">
              Sve rezervacije i termini prikazuju se u ovoj vremenskoj zoni.
            </p>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Interval termina */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Online rezervacije</h3>
            <p className="text-sm text-slate-500 mb-3">
              Vremenski interval između termina koji klijenti mogu rezervisati.
            </p>
            <div className="flex flex-col gap-2">
              {SLOT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer transition-colors ${
                    !isCustom && slotDuration === opt.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="slot_duration"
                    checked={!isCustom && slotDuration === opt.value}
                    onChange={() => {
                      setSlotDuration(opt.value);
                      setIsCustom(false);
                      setCustomValue("");
                    }}
                    className="accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                </label>
              ))}

              <label
                className={`flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer transition-colors ${
                  isCustom
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200"
                }`}
              >
                <input
                  type="radio"
                  name="slot_duration"
                  checked={isCustom}
                  onChange={() => setIsCustom(true)}
                  className="accent-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">Prilagođeno</span>
                {isCustom && (
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="number"
                      min="5"
                      max="240"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder="npr. 45"
                      className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm text-slate-500">min</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {success && <p className="text-green-600 text-sm">{success}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Čuvanje..." : "Sačuvaj podešavanja"}
          </button>
        </form>
        </>
      )}
    </div>
  );
}

export default Settings;
