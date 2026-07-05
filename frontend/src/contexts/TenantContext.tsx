import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../services/api";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  role: string;
  slot_duration_minutes?: number;
  timezone?: string;
}

interface TenantContextType {
  tenantId: number;
  setTenantId: (id: number) => void;
  tenants: Tenant[];
  currentRole: string;
  timezone: string;
  isLoading: boolean;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const DEFAULT_TZ = "Europe/Sarajevo";

export function TenantProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem("tenant_id");
  const [tenantId, setTenantIdState] = useState<number>(
    stored ? parseInt(stored) : 0
  );
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const setTenantId = (id: number) => {
    localStorage.setItem("tenant_id", id.toString());
    setTenantIdState(id);
  };

  const currentRole = localStorage.getItem("current_role") ?? "";

  // Timezone aktivnog tenanta
  const timezone =
    tenants.find((t) => t.id === tenantId)?.timezone ?? DEFAULT_TZ;

  const refreshTenants = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/api/v1/tenants/my");
      setTenants(response.data);

      if (response.data.length > 0) {
        const storedId = localStorage.getItem("tenant_id");
        const storedIdNum = storedId ? parseInt(storedId) : 0;
        const exists = response.data.some((t: Tenant) => t.id === storedIdNum);

        const activeId = exists ? storedIdNum : response.data[0].id;

        if (!exists) {
          localStorage.setItem("tenant_id", activeId.toString());
          setTenantIdState(activeId);
        }

        const activeRole = response.data.find((t: Tenant) => t.id === activeId)?.role ?? "";
        localStorage.setItem("current_role", activeRole);
      } else {
        localStorage.removeItem("current_role");
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
      value={{ tenantId, setTenantId, tenants, currentRole, timezone, isLoading, refreshTenants }}
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
