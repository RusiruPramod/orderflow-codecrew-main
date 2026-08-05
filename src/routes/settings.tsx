import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — CodeCrew PCB ERP" },
      { name: "description", content: "Profile, role and workspace settings for CodeCrew PCB ERP users." },
      { property: "og:title", content: "Settings — CodeCrew PCB ERP" },
      { property: "og:description", content: "Manage your CodeCrew profile and session." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell title="Settings" subtitle="Your profile and workspace preferences">
      <div className="surface-card max-w-2xl p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent font-display text-xl font-semibold text-accent-foreground">
            {user?.name.slice(0, 1)}
          </span>
          <div>
            <p className="font-display text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-primary capitalize">{user?.role} access</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["Role", user?.role ?? "—"],
            ["Specialty", user?.specialty ?? "—"],
            ["Status", user?.active ? "Active" : "Paused"],
            ["Backend", "Firebase (Auth · Firestore · Storage)"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border px-4 py-3">
              <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{k}</dt>
              <dd className="text-sm font-medium capitalize">{v}</dd>
            </div>
          ))}
        </dl>

        <Button
          variant="outline"
          className="mt-6 rounded-xl text-destructive"
          onClick={async () => {
            await signOut();
            void navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </AppShell>
  );
}
