import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getRoleHomePath, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { Logo } from "@/components/logo";

export function RequireRole({ role, children }: { role: Role | Role[]; children: ReactNode }) {
  const { user, loading, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const allowedRoles = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (loading || !firebaseReady) return;
    if (!user) {
      void navigate({ to: "/", replace: true });
    } else if (!allowedRoles.includes(user.role)) {
      void navigate({ to: getRoleHomePath(user.role), replace: true });
    }
  }, [allowedRoles, loading, firebaseReady, user, navigate]);

  if (loading || !firebaseReady || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
