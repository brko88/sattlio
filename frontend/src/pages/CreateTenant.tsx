import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTenant } from "../contexts/TenantContext";

function CreateTenant() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [jib, setJib] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setTenantId } = useTenant();

  const extractErrorMessage = (err: any): string => {
    const detail = err.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || JSON.stringify(item))
        .join(" ");
    }

    return "Greška prilikom kreiranja salona.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/api/v1/tenants", {
        name,
        city: city || null,
        phone: phone || null,
        jib,
      });

      setTenantId(response.data.id);
      navigate("/dashboard");
    } catch (err: any) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900">
        Kreiraj poslovni subjekt
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm max-w-md">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Naziv salona"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="JIB (13 cifara)"
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
            placeholder="Grad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
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

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Kreiraj
        </button>
      </form>
    </div>
  );
}

export default CreateTenant;