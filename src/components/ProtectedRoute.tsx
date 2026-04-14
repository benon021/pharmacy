import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "seller";
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Auth disabled — allow all access
  return <>{children}</>;
}
