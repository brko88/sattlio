import { useState, useEffect } from "react";
import api from "../services/api";
import Pagination from "../components/Pagination";
import { SkeletonListPage } from "../components/Skeleton";

interface TenantRole {
  tenant_id: number;
  tenant_name: string;
  role: string;
}

interface AppUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  is_active: boolean;
  is_superadmin: boolean;
  is_internal_tester: boolean;
  created_at: string;
  tenants: TenantRole[];
}

function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchUsers = async (searchTerm: string = "", pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/admin/users", {
        params: { ...(searchTerm ? { search: searchTerm } : {}), page: pageNum, page_size: PAGE_SIZE },
      });
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom učitavanja korisnika.");
    } finally {
      setLoading(false);
    }
  };

  // Ucitavanje pri promjeni stranice (i prvo ucitavanje, jer page pocinje na 1)
  useEffect(() => {
    fetchUsers(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page === 1) {
        fetchUsers(search, 1);
      } else {
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleBlock = async (userId: number, currentlyActive: boolean) => {
    setError("");
    setSuccessMessage("");
    const action = currentlyActive ? "block" : "unblock";
    try {
      const response = await api.post(`/api/v1/admin/users/${userId}/${action}`);
      setSuccessMessage(response.data.detail);
      fetchUsers(search, page);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom akcije.");
    }
  };

  const handleTesterToggle = async (userId: number, currentValue: boolean) => {
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.post(`/api/v1/admin/users/${userId}/internal-tester`, {
        value: !currentValue,
      });
      setSuccessMessage(response.data.detail);
      fetchUsers(search, page);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom akcije.");
    }
  };

  const handleResetPassword = async (userId: number) => {
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.post(`/api/v1/admin/users/${userId}/reset-password`);
      setSuccessMessage(response.data.detail);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška prilikom slanja reset linka.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Korisnici</h1>
      <p className="text-slate-500 mb-6">Pregled svih korisnika na platformi</p>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraga po imenu ili emailu..."
          className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {successMessage && <p className="text-green-600 text-sm mb-3">{successMessage}</p>}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {loading ? (
        <SkeletonListPage rows={6} columns={6} />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg p-10 text-center text-slate-500">
          {search ? "Nema rezultata za zadatu pretragu." : "Nema registrovanih korisnika."}
        </div>
      ) : (
        <>
        {/* Mobilni prikaz - kartice (ispod md) */}
        <div className="md:hidden space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-slate-900">
                  {u.first_name || u.last_name
                    ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                    : "-"}
                </p>
                {u.is_superadmin && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                    superadmin
                  </span>
                )}
                {u.is_internal_tester && (
                  <span className="px-2 py-0.5 bg-slate-800 text-white rounded-full text-xs font-semibold">
                    tester
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 break-all">{u.email}</p>
              <p className="text-sm text-slate-500">
                {u.tenants.length === 0
                  ? "-"
                  : u.tenants.map((t) => `${t.tenant_name} (${t.role})`).join(", ")}
              </p>
              <p className="text-sm text-slate-500 mb-3">
                Email potvrđen: {u.email_verified ? "Da" : "Ne"} · Aktivan: {u.is_active ? "Da" : "Ne"}
              </p>
              <div className="flex gap-2 flex-wrap">
                {!u.is_superadmin && (
                  <button
                    onClick={() => handleBlock(u.id, u.is_active)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors ${
                      u.is_active
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {u.is_active ? "Blokiraj" : "Deblokiraj"}
                  </button>
                )}
                <button
                  onClick={() => handleResetPassword(u.id)}
                  className="px-3 py-1.5 bg-slate-600 text-white rounded-md text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Reset lozinke
                </button>
                <button
                  onClick={() => handleTesterToggle(u.id, u.is_internal_tester)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    u.is_internal_tester
                      ? "bg-slate-800 text-white hover:bg-slate-900"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {u.is_internal_tester ? "Ukloni tester" : "Interni tester"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop/tablet prikaz - tabela (md i vece) */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ime i prezime</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Saloni / role</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email potvrđen</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aktivan</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">
                  {u.first_name || u.last_name
                    ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                    : "-"}
                  {u.is_superadmin && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      superadmin
                    </span>
                  )}
                  {u.is_internal_tester && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-800 text-white rounded-full text-xs font-semibold">
                      tester
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{u.email}</td>
                <td className="px-4 py-3 text-sm">
                  {u.tenants.length === 0
                    ? "-"
                    : u.tenants.map((t) => `${t.tenant_name} (${t.role})`).join(", ")}
                </td>
                <td className="px-4 py-3">{u.email_verified ? "Da" : "Ne"}</td>
                <td className="px-4 py-3">{u.is_active ? "Da" : "Ne"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {!u.is_superadmin && (
                      <button
                        onClick={() => handleBlock(u.id, u.is_active)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors ${
                          u.is_active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {u.is_active ? "Blokiraj" : "Deblokiraj"}
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="px-3 py-1.5 bg-slate-600 text-white rounded-md text-xs font-medium hover:bg-slate-700 transition-colors"
                    >
                      Reset lozinke
                    </button>
                    <button
                      onClick={() => handleTesterToggle(u.id, u.is_internal_tester)}
                      title="Interni tester - vidi salone označene kao interni (skriveni od javnosti)"
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        u.is_internal_tester
                          ? "bg-slate-800 text-white hover:bg-slate-900"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {u.is_internal_tester ? "Ukloni tester" : "Interni tester"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
    </div>
  );
}

export default Users;
