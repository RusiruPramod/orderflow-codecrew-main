import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Plus, Search, Trash2, Edit, RefreshCcw, UserPlus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { upsert, logActivity, notify } from "@/lib/db";
import { useUsers } from "@/lib/queries";
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
import { useOrders } from "@/lib/queries";
import { formatDate } from "@/lib/analytics";
import { finalPrice, money, ORDER_STATUSES, quoteTotal, type OrderStatus } from "@/lib/types";
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

function OrdersPage() {
  const { data: orders = [] } = useOrders();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "All">("All");
  const [page, setPage] = useState(1);

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

  return (
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
            {(["All", ...ORDER_STATUSES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(s);
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
                <th className="px-5 py-3">Actions</th>
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
                  <td className="px-5 py-3.5 flex items-center gap-2">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Edit order"
                      onClick={() => {
                        navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
                      }}
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Assign designer"
                      onClick={async () => {
                        const { data: users = [] } = useUsers();
                        const designers = users.filter((u) => u.role === "designer" && u.active);
                        const designerId = prompt("Enter designer ID to assign:");
                        if (!designerId) return;
                        const designer = designers.find((d) => d.id === designerId);
                        if (!designer) {
                          toast.error("Designer not found");
                          return;
                        }
                        await upsert("orders", { ...order, designerId: designer.id, designerName: designer.name, status: order.status === "New" ? "Assigned" : order.status } as any);
                        await logActivity({ action: "Order Updated", detail: `${order.code} assigned to ${designer.name}`, userName: "Owner", role: "owner" });
                        await notify({ to: "designer", userId: designer.id, title: "Order assigned", body: `${order.code} assigned to you.`, orderId: order.id });
                        toast.success(`Assigned to ${designer.name}`);
                      }}
                    >
                      <UserPlus className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Update order"
                      onClick={async () => {
                        const WORKFLOW = ["New","Assigned","Under Review","Waiting for Price","Price Submitted","Price Approved","Customer Confirmed","Designing","Printing","Quality Check","Completed","Delivered"];
                        const currentIndex = WORKFLOW.indexOf(order.status as any);
                        const nextStatus = WORKFLOW[currentIndex + 1] ?? order.status;
                        if (nextStatus === order.status) {
                          toast.warning("Order is already at final status");
                          return;
                        }
                        await upsert("orders", { ...order, status: nextStatus } as any);
                        await logActivity({ action: "Order Updated", detail: `${order.code} status changed to ${nextStatus}`, userName: "Owner", role: "owner" });
                        toast.success(`Status updated to ${nextStatus}`);
                      }}
                    >
                      <RefreshCcw className="size-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-destructive transition-colors" title="Delete order">
                          <Trash2 className="size-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to delete this order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the order {order.code}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { import("@/lib/db").then((db) => db.remove("orders", order.id)); }}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                    No orders match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
  );
}
