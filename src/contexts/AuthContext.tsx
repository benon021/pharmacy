import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { localDb, User, AppRole } from "@/lib/db";
import { supabase } from "@/lib/supabase";

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
        // 1. Check for existing Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("[Auth] Restoring Supabase session for:", session.user.email);
          applyUserFromSession(session.user);
        } else {
          applyUser(null);
        }

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            applyUserFromSession(session.user);
          } else {
            applyUser(null);
          }
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error("[Auth] Initialization error:", err);
        applyUser(null);
      }
    };

    initAuth();
  }, []);

  const applyUserFromSession = (supabaseUser: any) => {
    const u: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      full_name: supabaseUser.user_metadata.full_name || "User",
      role: supabaseUser.user_metadata.role as AppRole,
      pharmacy_id: supabaseUser.user_metadata.pharmacy_id || null,
      is_active: true,
      created_at: supabaseUser.created_at
    };
    applyUser(u);
  };

  const applyUser = (u: User | null) => {
    setUser(u);
    setRole(u?.role ?? null);
    setPharmacyId(u?.pharmacy_id ?? null);
    setLoading(false);
    initialHandled.current = true;
    
    // Maintain lumiaxy_session for legacy components that read from localStorage
    if (u) {
      localStorage.setItem("lumiaxy_session", JSON.stringify(u));
    } else {
      localStorage.removeItem("lumiaxy_session");
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log("[Auth] Attempting Supabase sign-in for:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return { error };
      }

      if (data.user) {
        applyUserFromSession(data.user);
      }
      
      return { error: null };
    } catch (err: any) {
      console.error("[Auth] Sign-in error:", err);
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    applyUser(null);
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
