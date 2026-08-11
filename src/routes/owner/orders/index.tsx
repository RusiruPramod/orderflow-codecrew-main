import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Filter, Plus, Search, Trash2, Edit, RefreshCcw, UserPlus, ChevronRight } from "lucide-react";
import { upsert, logActivity, notify, remove } from "@/lib/db";
import { useOrders, useUsers, useRefresh } from "@/lib/queries";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { PaymentBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatDate } from "@/lib/analytics";
import { finalPrice, money, quoteTotal, type Order, type OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/owner/orders/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Orders — CodeCrew PCB ERP" },
      { name: "description", content: "Browse, filter and manage every PCB order from intake to delivery." },
      { property: "og:title", content: "Orders — CodeCrew PCB ERP" },
      { property: "og:description", content: "Every PCB order, status, designer and price in one table." },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <OrdersPage />
    </RequireRole>
  ),
});

const PAGE_SIZE = 8;

// Statuses shown in the filter bar — excludes intermediate workflow steps
const FILTER_STATUSES = [
  "New",
  "Assigned",
  "Under Review",
  "Waiting for Price",
  "Completed",
  "Delivered",
  "Cancelled",
] as const;

type FilterStatus = (typeof FILTER_STATUSES)[number] | "All";

const WORKFLOW = [
  "New",
  "Assigned",
  "Under Review",
  "Waiting for Price",
  "Price Submitted",
  "Price Approved",
  "Customer Confirmed",
  "Designing",
  "Printing",
  "Quality Check",
  "Completed",
  "Delivered",
];

// ──────────────────────────────────────────────
// Assign Designer Dialog
// ──────────────────────────────────────────────
function AssignDialog({
  order,
  open,
  onClose,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
}) {
  const { data: users = [] } = useUsers();
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const designers = users.filter((u) => u.role === "designer" && u.active);

  const assign = async (designerId: string) => {
    const designer = designers.find((d) => d.id === designerId);
    if (!designer) return;
    setBusy(true);
    try {
      const nextStatus: OrderStatus =
        order.status === "New" ? "Assigned" : order.status;
      const updated: Order = {
        ...order,
        designerId: designer.id,
        designerName: designer.name,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      await upsert<Order>("orders", updated);
      await logActivity({
        action: "Order Assigned",
        detail: `${order.code} assigned to ${designer.name}`,
        userName: "Owner",
        role: "owner",
      });
      await notify({
        to: "designer",
        userId: designer.id,
        title: "New order assigned to you",
        body: `${order.code} — ${order.title} has been assigned to you.`,
        orderId: order.id,
      });
      refresh();
      toast.success(`Assigned to ${designer.name}`);
      onClose();
    } catch {
      toast.error("Failed to assign designer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Designer</DialogTitle>
          <DialogDescription>
            Choose an active designer for <strong>{order.code}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {designers.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No active designers found.
            </p>
          )}
          {designers.map((d) => (
            <button
              key={d.id}
              type="button"
              disabled={busy}
              onClick={() => void assign(d.id)}
              className={cn(
                "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-muted",
                order.designerId === d.id && "bg-primary/10",
              )}
            >
              <span>
                <span className="block font-medium">{d.name}</span>
                <span className="block text-xs text-muted-foreground">{d.email}</span>
                {d.specialty && (
                  <span className="block text-xs text-muted-foreground">{d.specialty}</span>
                )}
              </span>
              {order.designerId === d.id ? (
                <span className="text-xs text-primary font-medium">Current</span>
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Update Status Dialog
// ──────────────────────────────────────────────
function UpdateStatusDialog({
  order,
  open,
  onClose,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const currentIndex = WORKFLOW.indexOf(order.status as string);
  const nextStatus = WORKFLOW[currentIndex + 1] as OrderStatus | undefined;

  const handleUpdate = async () => {
    if (!nextStatus) {
      toast.warning("Order is already at final status");
      onClose();
      return;
    }
    setBusy(true);
    try {
      const updated: Order = {
        ...order,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      await upsert<Order>("orders", updated);
      await logActivity({
        action: "Status Updated",
        detail: `${order.code} moved to ${nextStatus}`,
        userName: "Owner",
        role: "owner",
      });
      // Notify assigned designer if any
      if (order.designerId) {
        await notify({
          to: "designer",
          userId: order.designerId,
          title: "Order status updated",
          body: `${order.code} status changed to "${nextStatus}".`,
          orderId: order.id,
        });
      }
      refresh();
      toast.success(`Status updated to "${nextStatus}"`);
      onClose();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Advance Order Status</DialogTitle>
          <DialogDescription>
            Move <strong>{order.code}</strong> forward in the workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current status</span>
            <span className="font-medium">{order.status}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next status</span>
            <span className="font-semibold text-primary">{nextStatus ?? "— Final —"}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handleUpdate()} disabled={busy || !nextStatus}>
            {busy ? "Updating…" : "Advance Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Orders Page
// ──────────────────────────────────────────────
function OrdersPage() {
  const navigate = useNavigate();
  const { data: orders = [] } = useOrders();
  const refresh = useRefresh();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterStatus>("All");
  const [page, setPage] = useState(1);

  // Dialog state
  const [assignTarget, setAssignTarget] = useState<Order | null>(null);
  const [updateTarget, setUpdateTarget] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => (status === "All" ? true : o.status === status))
      .filter((o) =>
        !q
          ? true
          : [o.code, o.title, o.customer.name, o.customer.company ?? "", o.designerName ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [orders, query, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const handleDelete = async (order: Order) => {
    try {
      await remove("orders", order.id);
      await logActivity({
        action: "Order Deleted",
        detail: `${order.code} was deleted`,
        userName: "Owner",
        role: "owner",
      });
      refresh();
      toast.success(`Order ${order.code} deleted`);
    } catch {
      toast.error("Failed to delete order");
    }
  };

  return (
    <>
      {/* Assign Dialog */}
      {assignTarget && (
        <AssignDialog
          order={assignTarget}
          open={!!assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {/* Update Status Dialog */}
      {updateTarget && (
        <UpdateStatusDialog
          order={updateTarget}
          open={!!updateTarget}
          onClose={() => setUpdateTarget(null)}
        />
      )}

      <AppShell
        title="Orders"
        subtitle={`${filtered.length} of ${orders.length} orders`}
        actions={
          <Button asChild size="sm" className="hidden rounded-xl sm:inline-flex">
            <Link to="/owner/orders/new">
              <Plus className="size-4" /> New order
            </Link>
          </Button>
        }
      >
        <div className="surface-card overflow-hidden">
          {/* Filter bar */}
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order, customer or designer…"
                className="h-10 rounded-xl pl-9"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="size-4 shrink-0 text-muted-foreground" />
              {(["All", ...FILTER_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatus(s as FilterStatus);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    status === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Designer</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 text-right font-medium">Designer cost</th>
                  <th className="px-5 py-3 text-right font-medium">Customer price</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((order) => (
                  <tr key={order.id} className="group transition-colors hover:bg-muted">
                    <td className="px-5 py-3.5">
                      <Link to="/orders/$orderId" params={{ orderId: order.id }} className="block">
                        <span className="block font-medium group-hover:text-primary">{order.title}</span>
                        <span className="block text-xs text-muted-foreground">{order.code}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="block">{order.customer.name}</span>
                      <span className="block text-xs text-muted-foreground">{order.customer.company}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{order.designerName ?? "Unassigned"}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">{order.quote ? money(quoteTotal(order.quote)) : "—"}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">
                      {order.pricing ? money(finalPrice(order)) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {/* Edit */}
                        <button
                          type="button"
                          id={`edit-order-${order.id}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="View / Edit order"
                          onClick={() => {
                            void navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
                          }}
                        >
                          <Edit className="size-4" />
                        </button>

                        {/* Assign designer */}
                        <button
                          type="button"
                          id={`assign-order-${order.id}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Assign designer"
                          onClick={() => setAssignTarget(order)}
                        >
                          <UserPlus className="size-4" />
                        </button>

                        {/* Advance status */}
                        <button
                          type="button"
                          id={`advance-order-${order.id}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Advance status"
                          onClick={() => setUpdateTarget(order)}
                        >
                          <RefreshCcw className="size-4" />
                        </button>

                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              id={`delete-order-${order.id}`}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete order"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete order {order.code}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The order <strong>{order.code}</strong> and all
                                associated data will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => void handleDelete(order)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-muted-foreground">
                      No orders match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {current} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}
