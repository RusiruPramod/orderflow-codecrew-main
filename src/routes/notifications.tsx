import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { upsert } from "@/lib/db";
import { useNotifications } from "@/lib/queries";
import { relativeTime } from "@/lib/analytics";

export const Route = createFileRoute("/notifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notifications — CodeCrew PCB ERP" },
      { name: "description", content: "Real-time alerts for quotes, uploads, approvals and completed PCB orders." },
      { property: "og:title", content: "Notifications — CodeCrew PCB ERP" },
      { property: "og:description", content: "Alerts for quotes, approvals and order updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const { data: notifications = [] } = useNotifications();
  const queryClient = useQueryClient();

  const mine = notifications
    .filter((n) => !user || (n.to === user.role && (!n.userId || n.userId === user.id)))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const markAll = async () => {
    await Promise.all(mine.filter((n) => !n.read).map((n) => upsert("notifications", { ...n, read: true })));
    await queryClient.invalidateQueries();
  };

  return (
    <AppShell
      title="Notifications"
      subtitle={`${mine.filter((n) => !n.read).length} unread`}
      actions={
        <Button size="sm" variant="outline" className="rounded-xl" onClick={markAll}>
          <Check className="size-4" /> Mark all read
        </Button>
      }
    >
      <div className="surface-card divide-y divide-border">
        {mine.map((n) => (
          <div key={n.id} className={`flex gap-3 p-5 ${n.read ? "" : "bg-primary-soft/60"}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Bell className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.body}</p>
            </div>
            <span className="text-xs whitespace-nowrap text-muted-foreground">{relativeTime(n.createdAt)}</span>
          </div>
        ))}
        {mine.length === 0 && <p className="p-12 text-center text-muted-foreground">You are all caught up.</p>}
      </div>
    </AppShell>
  );
}
