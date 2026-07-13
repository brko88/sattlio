import { useState, useEffect } from "react";
import api from "../services/api";

function ReportIssue() {
  const [userEmail, setUserEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/api/v1/auth/me").then((res) => setUserEmail(res.data.email));
  }, []);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScreenshot(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      if (screenshot) formData.append("screenshot", screenshot);

      const response = await api.post("/api/v1/support/report-issue", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(response.data.detail);
      setSubject("");
      setMessage("");
      setScreenshot(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom slanja prijave.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Prijavi problem</h1>
      <p className="text-slate-500 mb-6">
        Opišite šta se desilo — javićemo se na vaš email čim prije.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-500 mb-2">Vaš email</label>
          <input
            type="text"
            value={userEmail}
            readOnly
            className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-500 mb-2">Naslov</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Npr. Ne mogu sačuvati radno vrijeme"
            required
            maxLength={100}
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-500 mb-2">Opišite problem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Šta ste radili kad se problem desio, šta ste očekivali, šta se stvarno desilo..."
            required
            rows={6}
            maxLength={2000}
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-500 mb-2">
            Screenshot greške (opciono)
          </label>
          {screenshot ? (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm">
              <span className="text-slate-700 truncate">{screenshot.name}</span>
              <button
                type="button"
                onClick={() => setScreenshot(null)}
                className="text-slate-400 hover:text-red-600 text-xs ml-2 shrink-0"
              >
                Ukloni
              </button>
            </div>
          ) : (
            <label className="block w-full px-3 py-2 border border-dashed border-slate-300 rounded-md text-sm text-slate-500 text-center cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors">
              Dodaj sliku (JPG, PNG ili WEBP, do 5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleScreenshotChange}
              />
            </label>
          )}
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "Slanje..." : "Pošalji prijavu"}
        </button>
      </form>
    </div>
  );
}

export default ReportIssue;
