import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { localDb, User, AppRole } from "@/lib/db";
import { db, seedDatabase } from "@/lib/dexie";

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  pharmacyId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initialHandled = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Ensure Super Admin exists locally
        await seedDatabase();

        // 2. Check for existing local session
        const sessionUser = await localDb.auth.getSession();
        if (sessionUser) {
          console.log("[Auth] Restoring local session for:", sessionUser.email);
          applyUser(sessionUser);
        } else {
          applyUser(null);
        }
      } catch (err) {
        console.error("[Auth] Initialization error:", err);
        applyUser(null);
      }
    };

    initAuth();
  }, []);

  const applyUser = (u: User | null) => {
    setUser(u);
    setRole(u?.role ?? null);
    setPharmacyId(u?.pharmacy_id ?? null);
    setLoading(false);
    initialHandled.current = true;
  };

  const signIn = async (email: string, password: string) => {
    console.log("[Auth] Attempting local sign-in for:", email);
    
    try {
      // Find user in local Dexie database
      const foundUser = await db.users.where("email").equalsIgnoreCase(email).first();
      
      if (!foundUser) {
        return { error: new Error("Invalid credentials") };
      }

      // Basic password check (for local DB, we can keep it simple first)
      if (foundUser.password !== password) {
        return { error: new Error("Invalid credentials") };
      }

      if (!foundUser.is_active) {
        return { error: new Error("Account is suspended") };
      }

      // Store in localStorage for persistence
      localStorage.setItem("lumiaxy_session", JSON.stringify(foundUser));
      applyUser(foundUser as User);
      
      return { error: null };
    } catch (err: any) {
      console.error("[Auth] Sign-in error:", err);
      return { error: err };
    }
  };

  const signOut = async () => {
    await localDb.auth.signOut();
    setUser(null);
    setRole(null);
    setPharmacyId(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, pharmacyId, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
