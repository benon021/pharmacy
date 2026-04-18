import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface TenantContextType {
  activePharmacyId: string | null;
  activePharmacyName: string | null;
  setActivePharmacy: (id: string, name: string) => void;
  clearActivePharmacy: () => void;
  isImpersonating: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const [activePharmacyId, setActivePharmacyId] = useState<string | null>(null);
  const [activePharmacyName, setActivePharmacyName] = useState<string | null>(null);

  // Load from session storage on mount
  useEffect(() => {
    const savedId = sessionStorage.getItem("active_pharmacy_id");
    const savedName = sessionStorage.getItem("active_pharmacy_name");
    if (savedId && savedName && role === "super_admin") {
      setActivePharmacyId(savedId);
      setActivePharmacyName(savedName);
    }
  }, [role]);

  const setActivePharmacy = (id: string, name: string) => {
    if (role !== "super_admin") return;
    setActivePharmacyId(id);
    setActivePharmacyName(name);
    sessionStorage.setItem("active_pharmacy_id", id);
    sessionStorage.setItem("active_pharmacy_name", name);
  };

  const clearActivePharmacy = () => {
    setActivePharmacyId(null);
    setActivePharmacyName(null);
    sessionStorage.removeItem("active_pharmacy_id");
    sessionStorage.removeItem("active_pharmacy_name");
  };

  // If user is no longer super_admin, clear impersonation
  useEffect(() => {
    if (role !== "super_admin" && activePharmacyId) {
      clearActivePharmacy();
    }
  }, [role]);

  const isImpersonating = !!activePharmacyId && role === "super_admin";

  return (
    <TenantContext.Provider value={{ activePharmacyId, activePharmacyName, setActivePharmacy, clearActivePharmacy, isImpersonating }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
