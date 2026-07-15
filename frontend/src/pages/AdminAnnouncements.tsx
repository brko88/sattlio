import { useState, useEffect } from "react";
import api from "../services/api";

interface Announcement {
  id: number;
  kind: string;
  message: string;
  is_active: boolean;
  updated_at: string;
}

function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/admin/announcements");
      setAnnouncements(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom učitavanja banera.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleToggleActive = async (a: Announcement) => {
    setError("");
    setSuccessMessage("");
    try {
      await api.patch(`/api/v1/admin/announcements/${a.id}`, { is_active: !a.is_active });
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom izmjene.");
    }
  };

  const handleMessageBlur = async (a: Announcement, value: string) => {
    if (value === a.message) return;
    setError("");
    setSuccessMessage("");
    try {
      await api.patch(`/api/v1/admin/announcements/${a.id}`, { message: value });
      setSuccessMessage("Tekst banera je sačuvan.");
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom izmjene.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Obrisati ovaj baner?")) return;
    setError("");
    setSuccessMessage("");
    try {
      await api.delete(`/api/v1/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom brisanja.");
    }
  };

  const handleCreate = async () => {
    if (!newMessage.trim()) return;
    setError("");
    setSuccessMessage("");
    try {
      await api.post("/api/v1/admin/announcements", { message: newMessage.trim(), is_active: true });
      setNewMessage("");
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom kreiranja.");
    }
  };

  const betaBanner = announcements.find((a) => a.kind === "beta");
  const customBanners = announcements.filter((a) => a.kind === "custom");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Baneri</h1>
      <p className="text-slate-500 mb-6">
        Obavještenja koja se prikazuju na vrhu svake stranice, svim korisnicima.
      </p>

      {successMessage && <p className="text-green-600 text-sm mb-3">{successMessage}</p>}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <div className="space-y-6">
          {/* Beta baner */}
          {betaBanner && (
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">Beta baner</h2>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-sm text-slate-500">
                    {betaBanner.is_active ? "Uključen" : "Isključen"}
                  </span>
                  <input
                    type="checkbox"
                    checked={betaBanner.is_active}
                    onChange={() => handleToggleActive(betaBanner)}
                    className="w-5 h-5 accent-blue-600"
                  />
                </label>
              </div>
              <textarea
                defaultValue={betaBanner.message}
                key={betaBanner.updated_at}
                onBlur={(e) => handleMessageBlur(betaBanner, e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Custom baneri */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Najave (npr. planirano održavanje)</h2>

            {customBanners.length === 0 ? (
              <p className="text-sm text-slate-500 mb-4">Nema aktivnih najava.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {customBanners.map((a) => (
                  <div key={a.id} className="border border-slate-200 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={a.is_active}
                          onChange={() => handleToggleActive(a)}
                          className="w-5 h-5 accent-amber-500"
                        />
                        <span className="text-sm text-slate-500">
                          {a.is_active ? "Uključen" : "Isključen"}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Obriši
                      </button>
                    </div>
                    <textarea
                      defaultValue={a.message}
                      key={a.updated_at}
                      onBlur={(e) => handleMessageBlur(a, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Dodaj novu najavu</p>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                placeholder="npr. Nadogradnja platforme planirana je 20.07. od 02h do 04h — servis neće biti dostupan."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Dodaj baner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAnnouncements;
