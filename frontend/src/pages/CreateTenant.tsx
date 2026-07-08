import { useState } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

const BUSINESS_CATEGORIES = [
  "Frizerski salon",
  "Barber salon",
  "KozmetiÄŤki salon",
  "MasaĹľni studio",
  "Manikir / Pedikir",
  "Tattoo studio",
  "Spa centar",
  "Fitnes studio",
  "Ordinacija",
  "Fizioterapija",
  "Stomatologija",
  "Servis raÄŤunara",
  "Servis mobilnih telefona",
  "AutomehaniÄŤar",
  "Vulkanizer",
  "Ostalo",
];

function CreateTenant() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [jib, setJib] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const { setTenantId } = useTenant();

  const extractErrorMessage = (err: any): string => {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg || JSON.stringify(item)).join(" ");
    return "GreĹˇka prilikom kreiranja salona.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setEmailNotVerified(false);
      setSubmitting(true);
      const response = await api.post("/api/v1/tenants", {
        name,
        city: city || null,
        address: address || null,
        phone: phone || null,
        jib,
        business_category: businessCategory || null,
        description: description || null,
      });

      setTenantId(response.data.id);
      localStorage.setItem("tenant_id", response.data.id.toString());
      localStorage.setItem("current_role", "owner");
      setSuccess(true);
      setSubmitting(false);

      // Redirect na dashboard nakon 4 sekunde
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err: any) {
      setSubmitting(false);
      if (err.response?.status === 403) {
        setEmailNotVerified(true);
      } else {
        setError(extractErrorMessage(err));
      }
    }
  };

  if (submitting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-sm">Kreiranje salona...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg p-8 shadow-sm text-center">
          <div className="text-green-500 text-5xl mb-4">âś“</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Salon je uspjeĹˇno kreiran!
          </h2>
          <p className="text-slate-500 mb-4">
            VaĹˇ salon je trenutno u statusu <span className="font-semibold text-amber-600">na ÄŤekanju</span>.
          </p>
          <p className="text-slate-400 text-sm">
            Administrator platforme Ä‡e pregledati vaĹˇe podatke i aktivirati salon u najkraÄ‡em roku.
            Nakon aktivacije, vaĹˇ salon Ä‡e biti vidljiv klijentima.
          </p>
          <p className="text-slate-400 text-xs mt-4">
            Preusmjeravamo vas na dashboard za nekoliko sekundi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-slate-900">
          Kreiraj poslovni subjekt
        </h1>
        <p className="text-slate-500 mb-6">
          Unesite podatke o vaĹˇem salonu ili poslovnom subjektu.
        </p>

        {emailNotVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4 mb-6">
            <p className="font-medium text-amber-800 text-sm">âš ď¸Ź Email nije potvrÄ‘en</p>
            <p className="text-amber-600 text-xs mt-1 mb-3">
              Morate potvrditi email adresu prije kreiranja poslovnog subjekta. 
              Provjerite inbox i spam folder.
            </p>
            <a
              href="mailto:"
              className="text-xs text-blue-600 font-medium hover:underline"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await api.post("/api/v1/auth/resend-verification");
                  alert("Verifikacijski email je ponovo poslan.");
                } catch {
                  alert("GreĹˇka. PokuĹˇajte se odjaviti i ponovo prijaviti.");
                }
              }}
            >
              PoĹˇalji verifikacijski email ponovo â†’
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm">

          <div className="mb-4">
            <input
              type="text"
              placeholder="Naziv salona *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <select
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="">Vrsta djelatnosti (opciono)</option>
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="JIB (13 cifara) *"
              value={jib}
              onChange={(e) => setJib(e.target.value)}
              required
              maxLength={13}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Jedinstveni identifikacioni broj vaĹˇeg poslovnog subjekta
            </p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Grad *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Adresa (ulica i broj)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <textarea
              placeholder="Kratak opis salona (opciono)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Prikazuje se na javnoj stranici vaseg salona.
            </p>
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Kreiraj
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateTenant;
