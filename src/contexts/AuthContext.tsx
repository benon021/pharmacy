import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { localDb, User, AppRole } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync with Supabase Auth session
    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Map Supabase user to our App User structure
        const profile = await localDb.auth.getProfile(session.user.id);
        if (profile) {
            setUser(profile);
            setRole(profile.role);
        }
      }
      setLoading(false);
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await localDb.auth.getProfile(session.user.id);
        if (profile) {
            setUser(profile);
            setRole(profile.role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Try Supabase Auth first
    const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (sbError) return { error: sbError };

    if (data.user) {
        const profile = await localDb.auth.getProfile(data.user.id);
        if (profile) {
            setUser(profile);
            setRole(profile.role);
        }
    }
    
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
