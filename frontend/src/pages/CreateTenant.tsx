import { useState } from "react";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";
import { useToast } from "../contexts/ToastContext";

const BUSINESS_CATEGORIES = [
  "Frizerski salon",
  "Barber salon",
  "Kozmetički salon",
  "Masažni studio",
  "Manikir / Pedikir",
  "Tattoo studio",
  "Spa centar",
  "Fitnes studio",
  "Ordinacija",
  "Fizioterapija",
  "Stomatologija",
  "Servis računara",
  "Servis mobilnih telefona",
  "Automehaničar",
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
  const showToast = useToast();

  const extractErrorMessage = (err: any): string => {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg || JSON.stringify(item)).join(" ");
    return "Greška prilikom kreiranja salona.";
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
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Salon je uspješno kreiran!
          </h2>
          <p className="text-slate-500 mb-4">
            Vaš salon je trenutno u statusu <span className="font-semibold text-amber-600">na čekanju</span>.
          </p>
          <p className="text-slate-400 text-sm">
            Administrator platforme će pregledati vaše podatke i aktivirati salon u najkraćem roku.
            Nakon aktivacije, vaš salon će biti vidljiv klijentima.
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
          Unesite podatke o vašem salonu ili poslovnom subjektu.
        </p>

        {emailNotVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4 mb-6">
            <p className="font-medium text-amber-800 text-sm">⚠️ Email nije potvrđen</p>
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
                  showToast("Verifikacijski email je ponovo poslan. ✔️");
                } catch {
                  showToast("Greška. Pokušajte se odjaviti i ponovo prijaviti.", "error");
                }
              }}
            >
              Pošalji verifikacijski email ponovo →
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
              maxLength={100}
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
              Jedinstveni identifikacioni broj vašeg poslovnog subjekta
            </p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Grad *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              maxLength={50}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Adresa (ulica i broj)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={150}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <input
              type="tel"
              placeholder="Telefon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <textarea
              placeholder="Kratak opis salona (opciono)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={800}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Prikazuje se na javnoj stranici vašeg salona.
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
