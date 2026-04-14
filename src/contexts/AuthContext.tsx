import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { localDb, User, AppRole } from "@/lib/db";

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
    // Check for existing session
    const session = localDb.auth.getSession();
    if (session) {
      setUser(session);
      setRole(session.role);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: authedUser, error } = localDb.auth.signIn(email, password);
    if (authedUser) {
      setUser(authedUser);
      setRole(authedUser.role);
    }
    return { error };
  };

  const signOut = async () => {
    localDb.auth.signOut();
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
