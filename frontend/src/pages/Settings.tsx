import { useState, useEffect } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

const SLOT_OPTIONS = [
  { value: 15, label: "15 minuta" },
  { value: 20, label: "20 minuta" },
  { value: 30, label: "30 minuta" },
  { value: 60, label: "60 minuta" },
];

function Settings() {
  const { tenantId } = useTenant();
  const [slotDuration, setSlotDuration] = useState(30);
  const [customValue, setCustomValue] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/tenants/my")
      .then((res) => {
        const tenant = res.data.find((t: any) => t.id === tenantId);
        if (tenant?.slot_duration_minutes) {
          const val = tenant.slot_duration_minutes;
          const isStandard = SLOT_OPTIONS.some((o) => o.value === val);
          if (isStandard) {
            setSlotDuration(val);
            setIsCustom(false);
          } else {
            setIsCustom(true);
            setCustomValue(val.toString());
          }
        }
      })
      .catch(() => setError("Greška prilikom učitavanja podešavanja."))
      .finally(() => setLoading(false));
  }, [tenantId]);

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
      });
      setSuccess(`Podešavanja su sačuvana. Interval termina: ${value} minuta.`);
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
        <p>Učitavanje...</p>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-lg p-6 shadow-sm max-w-md">
          <h3 className="text-lg font-semibold mb-1">Online rezervacije</h3>
          <p className="text-sm text-slate-500 mb-4">
            Vremenski interval između termina koji klijenti mogu rezervisati.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Interval termina
            </label>
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

              {/* Custom opcija */}
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

          {success && <p className="text-green-600 text-sm mb-3">{success}</p>}
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Čuvanje..." : "Sačuvaj podešavanja"}
          </button>
        </form>
      )}
    </div>
  );
}

export default Settings;
