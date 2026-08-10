import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CircuitBoard,
  Download,
  FileText,
  Layers,
  Mail,
  MapPin,
  Phone,
  Receipt,
  RotateCcw,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { PaymentBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { logActivity, notify, remove, upsert } from "@/lib/db";
import { useOrders, useUsers } from "@/lib/queries";
import { formatDate, formatDateTime } from "@/lib/analytics";
import {
  finalPrice,
  emptyQuote,
  money,
  ORDER_STATUSES,
  quoteTotal,
  type Order,
  type OrderStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/$orderId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Order detail — CodeCrew PCB ERP" },
      { name: "description", content: "Review PCB files, designer quotations, pricing and production status." },
      { property: "og:title", content: "Order detail — CodeCrew PCB ERP" },
      { property: "og:description", content: "Files, quotes, margin and status for a single PCB order." },
    ],
  }),
  component: () => (
    <RequireRole role={["owner", "designer"]}>
      <OrderDetail />
    </RequireRole>
  ),
});

const WORKFLOW: OrderStatus[] = [
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

function OrderDetail() {
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const { data: orders = [] } = useOrders();
  const { data: users = [] } = useUsers();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const order = orders.find((o) => o.id === orderId);
  const isOwner = user?.role === "owner";
  const isDesigner = user?.role === "designer";

  const [pricing, setPricing] = useState({ serviceCharge: 0, profitMargin: 0, extraCharges: 0, discount: 0 });
  const [quoteDraft, setQuoteDraft] = useState(emptyQuote);

  useEffect(() => {
    if (order?.pricing) setPricing({ ...order.pricing });
  }, [order?.id, order?.pricing]);

  useEffect(() => {
    if (order?.quote) setQuoteDraft({ ...order.quote });
    else setQuoteDraft(emptyQuote);
  }, [order?.id, order?.quote]);

  if (!order) {
    return (
      <AppShell title="Order not found">
        <div className="surface-card p-12 text-center">
          <p className="text-muted-foreground">This order no longer exists.</p>
          <Button asChild className="mt-4 rounded-xl">
            <Link to="/owner/orders">Back to orders</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const designers = users.filter((u) => u.role === "designer" && u.active);
  const designerCost = quoteTotal(order.quote);
  const preview = { ...order, pricing: { ...pricing } } as Order;

  const save = async (patch: Partial<Order>, activity?: string, actorRole: "owner" | "designer" = isDesigner ? "designer" : "owner") => {
    const updated = { ...order, ...patch, updatedAt: new Date().toISOString() } as Order;
    await upsert<Order>("orders", updated);
    if (activity) {
      await logActivity({
        action: activity,
        detail: `${order.code} — ${activity.toLowerCase()}`,
        userName: user?.name ?? "Owner",
        role: actorRole,
      });
    }
    await queryClient.invalidateQueries();
    if (updated.designerId) {
      await notify({
        to: "designer",
        userId: updated.designerId,
        title: actorRole === "owner" ? "Order updated" : "Quote updated",
        body: `${updated.code} — ${updated.title} was updated.`,
        orderId: updated.id,
      });
    }
  };

  const assign = async (designerId: string) => {
    const designer = designers.find((d) => d.id === designerId);
    if (!designer) return;
    await save(
      {
        designerId: designer.id,
        designerName: designer.name,
        status: order.status === "New" ? "Assigned" : order.status,
      },
      "Order Updated",
    );
    toast.success(`Assigned to ${designer.name}`);
  };

  const decideQuote = async (decision: "approved" | "rejected" | "changes_requested") => {
    if (!order.quote) return;
    const status: OrderStatus =
      decision === "approved" ? "Price Approved" : decision === "rejected" ? "Under Review" : "Waiting for Price";
    await save(
      { quote: { ...order.quote, status: decision }, status } as Partial<Order>,
      decision === "approved" ? "Price Approved" : "Order Updated",
    );
    await notify({
      to: "designer",
      userId: order.designerId ?? "",
      title:
        decision === "approved"
          ? "Pricing approved"
          : decision === "rejected"
            ? "Pricing rejected"
            : "Revision requested",
      body: `${order.code} — the owner ${decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "requested changes to"} your quotation.`,
      orderId: order.id,
    });
    toast.success("Designer notified");
  };

  const savePricing = async () => {
    await save(
      { pricing: { ...pricing, confirmedAt: new Date().toISOString() } } as Partial<Order>,
      "Order Updated",
    );
    toast.success("Customer price saved");
  };

  const deleteOrder = async () => {
    if (!order || !window.confirm(`Delete order ${order.code}? This action cannot be undone.`)) return;
    try {
      await remove("orders", order.id);
      await logActivity({
        action: "Order Deleted",
        detail: `${order.code} deleted`,
        userName: user?.name ?? "Owner",
        role: "owner",
      });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted");
      void navigate({ to: "/owner/orders" });
    } catch {
      toast.error("Could not delete the order");
    }
  };

  const submitQuote = async () => {
    if (!isDesigner) return;
    const submitted = {
      ...quoteDraft,
      status: "submitted" as const,
      submittedAt: new Date().toISOString(),
    };
    await save(
      {
        quote: submitted,
        status: order.status === "New" ? "Assigned" : order.status,
      } as Partial<Order>,
      "Price Submitted",
      "designer",
    );
    await notify({
      to: "owner",
      title: "Designer submitted pricing",
      body: `${order.code} — ${order.title} has a new quote ready for review.`,
      orderId: order.id,
    });
    toast.success("Quote submitted to owner");
  };

  const stageIndex = WORKFLOW.indexOf(order.status);

  return (
    <AppShell
      title={order.title}
      subtitle={`${order.code} · created ${formatDate(order.createdAt)}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="hidden rounded-xl sm:inline-flex">
            <Link to="/invoices/$orderId" params={{ orderId: order.id }}>
              <Receipt className="size-4" /> Invoice
            </Link>
          </Button>
          {isOwner && (
            <Button size="sm" variant="destructive" className="hidden rounded-xl sm:inline-flex" onClick={deleteOrder}>
              <X className="size-4" /> Delete order
            </Button>
          )}
        </div>
      }
    >
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <Link to="/owner/orders">
          <ArrowLeft className="size-4" /> All orders
        </Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="surface-card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} />
              <span className="ml-auto text-xs text-muted-foreground">
                Updated {formatDateTime(order.updatedAt)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
              {WORKFLOW.map((stage, i) => (
                <span
                  key={stage}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    i <= stageIndex ? "font-medium text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 place-items-center rounded-full border",
                      i <= stageIndex ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {i <= stageIndex && <Check className="size-2.5" />}
                  </span>
                  {stage}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Label className="text-xs text-muted-foreground">Move status</Label>
              <select
                value={order.status}
                onChange={(e) => {
                  void save({ status: e.target.value as OrderStatus }, "Order Updated");
                  toast.success("Status updated");
                }}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={order.paymentStatus}
                onChange={(e) => {
                  void save({ paymentStatus: e.target.value as Order["paymentStatus"] }, "Order Updated");
                }}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
              >
                {["Unpaid", "Partially Paid", "Paid"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="surface-card p-5">
            <h3 className="font-display text-base font-semibold">PCB requirements</h3>
            <p className="mt-2 text-sm text-muted-foreground">{order.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">{order.requirements}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Layers", `${order.layers}`],
                ["Quantity", `${order.quantity} pcs`],
                ["Material", order.material],
                ["Thickness", order.thickness],
                ["Finish", order.surfaceFinish],
                ["Mask colour", order.color],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border px-3 py-2">
                  <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{k}</dt>
                  <dd className="text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Project files</h3>
              <span className="text-xs text-muted-foreground">{order.files.length} files</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {order.files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{file.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {file.kind} · {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </span>
                  <a
                    href={file.url ?? "#"}
                    onClick={(e) => {
                      if (!file.url) {
                        e.preventDefault();
                        toast.info("File download will stream from Firebase Storage once uploaded.");
                      }
                    }}
                    className="text-muted-foreground hover:text-primary"
                    aria-label={`Download ${file.name}`}
                  >
                    <Download className="size-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            {isOwner ? (
              <>
                <h3 className="font-display text-base font-semibold">Designer quotation</h3>
                {order.quote ? (
                  <>
                    <div className="mt-4 space-y-2 text-sm">
                      {[
                        ["PCB design", order.quote.designCost],
                        ["PCB printing", order.quote.printingCost],
                        ["Assembly", order.quote.assembly],
                        ["Component sourcing", order.quote.sourcing],
                        ["Shipping", order.quote.shipping],
                        ["Testing", order.quote.testing],
                        ["Additional", order.quote.extra],
                      ].map(([label, value]) => (
                        <div key={label as string} className="flex justify-between">
                          <span className="text-muted-foreground">{label as string}</span>
                          <span className="font-medium">{money(value as number)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-border pt-2 font-display text-base font-semibold">
                        <span>Designer total</span>
                        <span>{money(designerCost)}</span>
                      </div>
                    </div>
                    {order.quote.notes && (
                      <p className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">{order.quote.notes}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" className="rounded-xl" onClick={() => decideQuote("approved")}>
                        <Check className="size-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => decideQuote("changes_requested")}>
                        <RotateCcw className="size-4" /> Request changes
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-xl text-destructive" onClick={() => decideQuote("rejected")}>
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Waiting for the assigned designer to submit pricing.
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="font-display text-base font-semibold">Submit quotation</h3>
                <p className="mt-1 text-xs text-muted-foreground">Send your pricing back to the owner.</p>
                <div className="mt-4 space-y-3">
                  {(
                    [
                      ["PCB design", "designCost"],
                      ["PCB printing", "printingCost"],
                      ["Assembly", "assembly"],
                      ["Component sourcing", "sourcing"],
                      ["Shipping", "shipping"],
                      ["Testing", "testing"],
                      ["Additional", "extra"],
                    ] as const
                  ).map(([label, key]) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="number"
                        value={quoteDraft[key]}
                        onChange={(e) =>
                          setQuoteDraft((current) => ({
                            ...current,
                            [key]: Number(e.target.value) || 0,
                          }))
                        }
                        className="h-10 rounded-xl"
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Input
                      value={quoteDraft.notes ?? ""}
                      onChange={(e) => setQuoteDraft((current) => ({ ...current, notes: e.target.value }))}
                      className="h-10 rounded-xl"
                      placeholder="Timeline, assumptions, revision notes"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 rounded-xl bg-muted p-3 text-sm">
                  <Row label="Quote total" value={money(quoteTotal(quoteDraft))} />
                  <Row label="Status" value={quoteDraft.status} />
                </div>
                <Button className="mt-4 w-full rounded-xl" onClick={submitQuote}>
                  Submit quotation
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-card p-5">
            <h3 className="font-display text-base font-semibold">Customer</h3>
            <p className="mt-3 text-sm font-medium">{order.customer.name}</p>
            <p className="text-xs text-muted-foreground">{order.customer.company}</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="size-4" /> {order.customer.email}
              </p>
              {order.customer.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-4" /> {order.customer.phone}
                </p>
              )}
              {order.customer.country && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-4" /> {order.customer.country}
                </p>
              )}
            </div>
          </div>

          <div className="surface-card p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold">
              <UserCog className="size-4 text-primary" /> Designer
            </h3>
            <p className="mt-2 text-sm">{order.designerName ?? "Unassigned"}</p>
            <select
              value={order.designerId ?? ""}
              onChange={(e) => void assign(e.target.value)}
              className="mt-3 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="">Select designer…</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {isOwner && (
            <div className="surface-card border-primary/30 p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <ShieldCheck className="size-4 text-primary" /> Owner pricing
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Visible to owners only — never shown to designers.</p>

              <div className="mt-4 space-y-3">
                {(
                  [
                    ["Company service charge", "serviceCharge"],
                    ["Profit margin", "profitMargin"],
                    ["Extra charges", "extraCharges"],
                    ["Discount", "discount"],
                  ] as const
                ).map(([label, key]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      value={pricing[key]}
                      onChange={(e) => setPricing((p) => ({ ...p, [key]: Number(e.target.value) || 0 }))}
                      className="h-10 rounded-xl"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1.5 rounded-xl bg-muted p-3 text-sm">
                <Row label="Designer total" value={money(designerCost)} />
                <Row label="Service + profit" value={money(pricing.serviceCharge + pricing.profitMargin)} />
                <Row label="Extra" value={money(pricing.extraCharges)} />
                <Row label="Discount" value={`- ${money(pricing.discount)}`} />
                <div className="flex justify-between border-t border-border pt-2 font-display text-base font-semibold text-primary">
                  <span>Final customer price</span>
                  <span>{money(finalPrice(preview))}</span>
                </div>
              </div>

              <Button className="mt-4 w-full rounded-xl" onClick={savePricing}>
                Save customer price
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full rounded-xl">
                <Link to="/invoices/$orderId" params={{ orderId: order.id }}>
                  <Receipt className="size-4" /> Generate invoice
                </Link>
              </Button>
            </div>
          )}

          <div className="surface-card p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold">
              <Layers className="size-4 text-primary" /> Quick facts
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Order ID" value={order.code} />
              <Row label="Created" value={formatDate(order.createdAt)} />
              <Row label="Due" value={formatDate(order.dueDate)} />
              <Row label="Files" value={`${order.files.length}`} />
              <Row label="Board" value={`${order.layers}L · ${order.quantity} pcs`} />
            </div>
            <CircuitBoard className="mt-4 size-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
