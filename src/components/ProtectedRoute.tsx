import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Role, ROLE_HOME, useAuth } from "@/lib/auth";

interface Props {
  roles: Role[];
  children: ReactNode;
}

export function ProtectedRoute({ roles, children }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
