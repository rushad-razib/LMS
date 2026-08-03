import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "@arva/shared";
import { useAuth } from "@/features/auth/AuthProvider";

export function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    const home =
      user.role === "ADMIN" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/student";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}

export function RequireStudentVerified() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "STUDENT") {
    const home = user.role === "ADMIN" ? "/admin" : "/teacher";
    return <Navigate to={home} replace />;
  }

  if (!user.canAccessStudentPortal) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}
