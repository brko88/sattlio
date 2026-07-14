import { useState, useEffect } from "react";
import api from "../services/api";

interface Me {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email_verified: boolean;
}

function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/api/v1/auth/me")
      .then((res) => {
        setMe(res.data);
        setEditFirstName(res.data.first_name || "");
        setEditLastName(res.data.last_name || "");
        setEditPhone(res.data.phone || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);
    try {
      const response = await api.put("/api/v1/auth/me", {
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone || null,
      });
      setMe(response.data);
      setProfileSuccess("Podaci su sačuvani.");
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || "Greška prilikom čuvanja.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Nova lozinka i potvrda se ne poklapaju.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Nova lozinka mora imati barem 8 karaktera.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/api/v1/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(response.data.detail);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || "Greška prilikom promjene lozinke.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Učitavanje...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Moj profil</h1>
      <p className="text-slate-500 mb-6">Vaši osnovni podaci i sigurnost naloga</p>

      {me && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 max-w-md">
          <h2 className="text-sm font-semibold text-slate-700 uppercase mb-4">
            Osnovni podaci
          </h2>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-900">{me.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email potvrđen</span>
              <span className="font-medium text-slate-900">
                {me.email_verified ? "Da" : "Ne"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Telefon</span>
              <span className="font-medium text-slate-900">{me.phone || "—"}</span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-2">Ime</label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                required
                maxLength={30}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-2">Prezime</label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                required
                maxLength={30}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-500 mb-2">Telefon (opciono)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  maxLength={20}
                  className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  disabled
                  title="Verifikacija broja telefona uskoro dolazi"
                  className="px-3 py-2 border border-slate-200 text-slate-400 rounded-md text-sm cursor-not-allowed shrink-0"
                >
                  Verifikuj
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Verifikacija broja telefona nije još implementirana — uskoro.
              </p>
            </div>

            {profileError && <p className="text-red-600 text-sm mb-3">{profileError}</p>}
            {profileSuccess && <p className="text-green-600 text-sm mb-3">{profileSuccess}</p>}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {savingProfile ? "Čuvanje..." : "Sačuvaj podatke"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
        <h2 className="text-sm font-semibold text-slate-700 uppercase mb-4">
          Promjena lozinke
        </h2>
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Trenutna lozinka
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Nova lozinka
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Potvrdite novu lozinku
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          {passwordError && <p className="text-red-600 text-sm mb-3">{passwordError}</p>}
          {passwordSuccess && <p className="text-green-600 text-sm mb-3">{passwordSuccess}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Čuvanje..." : "Promijeni lozinku"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
