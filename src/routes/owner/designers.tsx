import { createFileRoute } from "@tanstack/react-router";
import { Mail, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { useOrders, useUsers } from "@/lib/queries";
import { designerPerformance, formatDate } from "@/lib/analytics";
import { money } from "@/lib/types";

export const Route = createFileRoute("/owner/designers")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Designer — CodeCrew PCB ERP" },
      { name: "description", content: "Manage your PCB designer and workload." },
      { property: "og:title", content: "Designer — CodeCrew PCB ERP" },
      { property: "og:description", content: "Single-designer roster and performance." },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <Designers />
    </RequireRole>
  ),
});

function Designers() {
  const { data: users = [] } = useUsers();
  const { data: orders = [] } = useOrders();
  const perf = designerPerformance(orders);
  const designers = users.filter((u) => u.role === "designer");

  return (
    <AppShell title="Designer" subtitle={`${designers.filter((d) => d.active).length} active collaborator`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {designers.map((designer) => {
          const stats = perf.find((p) => p.name === designer.name);
          return (
            <div key={designer.id} className="surface-card lift-hover p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-accent font-display text-lg font-semibold text-accent-foreground">
                  {designer.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{designer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{designer.specialty}</p>
                </div>
                <span
                  className={`ml-auto rounded-full border px-2.5 py-1 text-xs font-medium ${
                    designer.active
                      ? "border-success/30 bg-success/12 text-success"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {designer.active ? "Active" : "Paused"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Assigned", `${stats?.assigned ?? 0}`],
                  ["Completed", `${stats?.completed ?? 0}`],
                  ["Quoted", money(stats?.value ?? 0)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border py-2">
                    <p className="font-display text-sm font-semibold">{value}</p>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {designer.email}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 text-primary" /> since {formatDate(designer.joinedAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
