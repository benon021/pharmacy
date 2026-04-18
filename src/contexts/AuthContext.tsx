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
          // 2. Check localStorage cache (for quick restore before Supabase responds)
          const localSession = localStorage.getItem("lumiaxy_session");
          if (localSession) {
            console.log("[Auth] Restoring cached session");
            applyUser(JSON.parse(localSession));
          } else {
            applyUser(null);
          }
        }

        // 3. Listen for Supabase auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            applyUserFromSession(session.user);
          } else if (_event === 'SIGNED_OUT') {
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
    
    if (u) {
      localStorage.setItem("lumiaxy_session", JSON.stringify(u));
    } else {
      localStorage.removeItem("lumiaxy_session");
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log("[Auth] Signing in via Supabase:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!error && data.user) {
        applyUserFromSession(data.user);
        return { error: null };
      }
      
      return { error: error || new Error("Invalid credentials.") };
    } catch (err: any) {
      console.error("[Auth] Sign-in exception:", err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
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
