import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useOrders } from "@/lib/queries";
import { formatDate } from "@/lib/analytics";
import { money, quoteTotal } from "@/lib/types";

export const Route = createFileRoute("/designer/designer")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Designer Portal — CodeCrew PCB ERP" },
      { name: "description", content: "Assigned PCB orders, design files and price submissions for outsourced designers." },
      { property: "og:title", content: "Designer Portal — CodeCrew PCB ERP" },
      { property: "og:description", content: "Your assigned PCB orders and quotes." },
    ],
  }),
  component: () => (
    <RequireRole role="designer">
      <DesignerPortal />
    </RequireRole>
  ),
});

function DesignerPortal() {
  const { user } = useAuth();
  const { data: orders = [] } = useOrders();
  const mine = orders.filter((order) => {
    if (!user) return false;
    const normalizedUserName = user.name.trim().toLowerCase();
    const normalizedUserEmail = user.email.trim().toLowerCase();
    const normalizedDesignerName = order.designerName?.trim().toLowerCase();

    return (
      order.designerId === user.id ||
      normalizedDesignerName === normalizedUserName ||
      normalizedDesignerName === normalizedUserEmail
    );
  });

  return (
    <AppShell title="Designer Portal" subtitle={`${mine.length} orders assigned to you`}>
      <div className="grid gap-4 md:grid-cols-2">
        {mine.map((order) => (
          <div key={order.id} className="surface-card lift-hover p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-semibold">{order.code}</p>
                <p className="truncate text-sm text-muted-foreground">{order.title}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{order.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Due {formatDate(order.dueDate)}</span>
              <span>{order.quote ? `Quoted ${money(quoteTotal(order.quote))}` : "No quote yet"}</span>
            </div>
            <Button asChild size="sm" className="mt-4 w-full rounded-xl">
              <Link to="/orders/$orderId" params={{ orderId: order.id }}>
                Open order
              </Link>
            </Button>
          </div>
        ))}
        {mine.length === 0 && (
          <p className="surface-card p-12 text-center text-muted-foreground">No orders assigned yet.</p>
        )}
      </div>
    </AppShell>
  );
}
