import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../services/api";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  role: string;
}

interface TenantContextType {
  tenantId: number;
  setTenantId: (id: number) => void;
  tenants: Tenant[];
  refreshTenants: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem("tenant_id");
  const [tenantId, setTenantIdState] = useState<number>(
    stored ? parseInt(stored) : 1
  );
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const setTenantId = (id: number) => {
    localStorage.setItem("tenant_id", id.toString());
    setTenantIdState(id);
  };

  const refreshTenants = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await api.get("/api/v1/tenants/my");
      setTenants(response.data);

      // Ako trenutni tenantId nije u listi (npr. star/nepostojeći), prebaci na prvi dostupan
      const exists = response.data.some((t: Tenant) => t.id === tenantId);
      if (!exists && response.data.length > 0) {
        setTenantId(response.data[0].id);
      }
    } catch {
      // korisnik možda nije ulogovan, ignoriši
    }
  };

  useEffect(() => {
    refreshTenants();
  }, []);

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId, tenants, refreshTenants }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant mora biti korišten unutar TenantProvider");
  }
  return context;
}