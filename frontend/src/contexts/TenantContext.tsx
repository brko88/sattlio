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
  currentRole: string;
  isLoading: boolean;
  refreshTenants: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem("tenant_id");
  const [tenantId, setTenantIdState] = useState<number>(
    stored ? parseInt(stored) : 1
  );
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const setTenantId = (id: number) => {
    localStorage.setItem("tenant_id", id.toString());
    setTenantIdState(id);
  };

  const currentRole = tenants.find((t) => t.id === tenantId)?.role ?? "";

  const refreshTenants = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/api/v1/tenants/my");
      setTenants(response.data);

      const exists = response.data.some((t: Tenant) => t.id === tenantId);
      if (!exists && response.data.length > 0) {
        setTenantId(response.data[0].id);
      }
    } catch {
      // korisnik možda nije ulogovan
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTenants();
  }, []);

  return (
    <TenantContext.Provider
      value={{ tenantId, setTenantId, tenants, currentRole, isLoading, refreshTenants }}
    >
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
