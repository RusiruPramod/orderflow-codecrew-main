import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { useActivity } from "@/lib/queries";
import { formatDateTime } from "@/lib/analytics";

export const Route = createFileRoute("/owner/activity")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Activity Logs — CodeCrew PCB ERP" },
      { name: "description", content: "Full audit trail of orders, files, pricing, invoices and logins." },
      { property: "og:title", content: "Activity Logs — CodeCrew PCB ERP" },
      { property: "og:description", content: "Timestamped audit trail for every action." },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <ActivityPage />
    </RequireRole>
  ),
});

function ActivityPage() {
  const { data: activity = [] } = useActivity();
  const rows = [...activity].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <AppShell title="Activity Logs" subtitle={`${rows.length} recorded events`}>
      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Detail</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((entry) => (
              <tr key={entry.id} className="hover:bg-muted">
                <td className="px-5 py-3 font-medium">{entry.action}</td>
                <td className="px-5 py-3 text-muted-foreground">{entry.detail}</td>
                <td className="px-5 py-3">{entry.userName}</td>
                <td className="px-5 py-3 text-muted-foreground capitalize">{entry.role}</td>
                <td className="px-5 py-3 text-muted-foreground">{formatDateTime(entry.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
