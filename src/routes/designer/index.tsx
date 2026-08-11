import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useOrders } from "@/lib/queries";
import { formatDate, formatDateTime } from "@/lib/analytics";
import { money, quoteTotal, type Order } from "@/lib/types";
import { CircuitBoard, FileText, Download, Phone, UserCog, Layers } from "lucide-react";

export const Route = createFileRoute("/designer/")({
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mine = orders
    .filter((order) => {
      if (!user) return false;
      const normalizedUserName = user.name.trim().toLowerCase();
      const normalizedUserEmail = user.email.trim().toLowerCase();
      const normalizedDesignerName = order.designerName?.trim().toLowerCase();

      return (
        order.designerId === user.id ||
        normalizedDesignerName === normalizedUserName ||
        normalizedDesignerName === normalizedUserEmail
      );
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const selectedOrder = mine.find((o) => o.id === selectedId) || mine[0];

  return (
    <AppShell title="Designer Portal" subtitle={`${mine.length} orders assigned to you`}>
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
        <p className="text-sm text-muted-foreground">Select an order to view its details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Pane: Order List */}
        <div className="flex flex-col gap-3 lg:col-span-5 xl:col-span-4">
          {mine.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedId(order.id)}
              className={`flex flex-col rounded-2xl border p-4 text-left transition-colors ${
                selectedOrder?.id === order.id
                  ? "border-primary bg-primary-soft"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold">{order.code}</p>
                  <p className="truncate text-sm text-muted-foreground">{order.title}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-3 flex w-full items-center justify-between text-xs text-muted-foreground">
                <span>Due {formatDate(order.dueDate)}</span>
                <span>{order.quote ? `Quoted ${money(quoteTotal(order.quote))}` : "No quote"}</span>
              </div>
            </button>
          ))}
          {mine.length === 0 && (
            <p className="surface-card p-12 text-center text-muted-foreground">No orders assigned yet.</p>
          )}
        </div>

        {/* Right Pane: Preview / Details */}
        <div className="lg:col-span-7 xl:col-span-8">
          {selectedOrder ? (
            <div className="surface-card sticky top-24 p-6">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="font-display text-xl font-semibold">{selectedOrder.code} - {selectedOrder.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Updated {formatDateTime(selectedOrder.updatedAt)}</p>
                </div>
                <Button asChild className="rounded-xl">
                  <Link to="/orders/$orderId" params={{ orderId: selectedOrder.id }}>
                    Open Full Order
                  </Link>
                </Button>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {/* PCB Specs */}
                <div>
                  <h4 className="flex items-center gap-2 font-display text-sm font-semibold">
                    <CircuitBoard className="size-4 text-primary" /> PCB Specs
                  </h4>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p>Layers: <span className="font-medium text-foreground">{selectedOrder.layers}</span></p>
                    <p>Quantity: <span className="font-medium text-foreground">{selectedOrder.quantity}</span></p>
                    <p>Material: <span className="font-medium text-foreground">{selectedOrder.material}</span></p>
                    <p>Thickness: <span className="font-medium text-foreground">{selectedOrder.thickness}</span></p>
                    <p>Finish: <span className="font-medium text-foreground">{selectedOrder.surfaceFinish}</span></p>
                  </div>
                </div>

                {/* Customer & Quote Status */}
                <div>
                  <h4 className="flex items-center gap-2 font-display text-sm font-semibold">
                    <UserCog className="size-4 text-primary" /> Customer & Status
                  </h4>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p>Customer: <span className="font-medium text-foreground">{selectedOrder.customer.name}</span></p>
                    <p>Status: <span className="font-medium text-foreground">{selectedOrder.status}</span></p>
                    <p>Due Date: <span className="font-medium text-foreground">{formatDate(selectedOrder.dueDate)}</span></p>
                    <p>
                      Quote Status: <span className="font-medium text-foreground">
                        {selectedOrder.quote ? selectedOrder.quote.status : "Not submitted"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Files */}
                <div className="sm:col-span-2">
                  <h4 className="flex items-center gap-2 font-display text-sm font-semibold">
                    <FileText className="size-4 text-primary" /> Project Files ({selectedOrder.files.length})
                  </h4>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedOrder.files.slice(0, 4).map((file) => (
                      <div key={file.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                        <span className="truncate flex-1">{file.name}</span>
                        <a href={file.url ?? "#"} className="text-muted-foreground hover:text-primary">
                          <Download className="size-4" />
                        </a>
                      </div>
                    ))}
                    {selectedOrder.files.length > 4 && (
                      <div className="flex items-center justify-center rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                        + {selectedOrder.files.length - 4} more files
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="surface-card flex h-64 items-center justify-center p-12 text-center text-muted-foreground">
              Select an order to view a preview.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
