import { createFileRoute, useParams } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/lib/queries";
import { formatDate } from "@/lib/analytics";
import { finalPrice, money, quoteTotal } from "@/lib/types";

export const Route = createFileRoute("/invoices/$orderId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Invoice — CodeCrew PCB ERP" },
      { name: "description", content: "Professional branded PCB invoice ready to print, export or email." },
      { property: "og:title", content: "Invoice — CodeCrew PCB ERP" },
      { property: "og:description", content: "Branded A4 PCB invoice." },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <InvoicePage />
    </RequireRole>
  ),
});

function InvoicePage() {
  const { orderId } = useParams({ from: "/invoices/$orderId" });
  const { data: orders = [] } = useOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) return <AppShell title="Invoice">Not found.</AppShell>;

  const lines = [
    ["PCB design service", order.quote?.designCost ?? 0],
    ["PCB fabrication / printing", order.quote?.printingCost ?? 0],
    ["Assembly & sourcing", (order.quote?.assembly ?? 0) + (order.quote?.sourcing ?? 0)],
    ["Testing & shipping", (order.quote?.testing ?? 0) + (order.quote?.shipping ?? 0)],
    ["CodeCrew service charge", order.pricing?.serviceCharge ?? 0],
    ["Engineering & handling", (order.pricing?.profitMargin ?? 0) + (order.pricing?.extraCharges ?? 0)],
  ] as [string, number][];

  return (
    <AppShell
      title="Invoice"
      subtitle={`INV-${order.code.replace("CC-", "")}`}
      actions={
        <Button size="sm" className="rounded-xl" onClick={() => window.print()}>
          <Printer className="size-4" /> Print / PDF
        </Button>
      }
    >
      <div className="surface-card mx-auto max-w-3xl p-8">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <Logo />
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-display text-lg font-semibold text-foreground">INVOICE</p>
            <p>INV-{order.code.replace("CC-", "")}</p>
            <p>Order {order.code}</p>
            <p>{formatDate(order.pricing?.confirmedAt ?? order.createdAt)}</p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Billed to</p>
            <p className="mt-1 font-medium">{order.customer.name}</p>
            <p className="text-sm text-muted-foreground">{order.customer.company}</p>
            <p className="text-sm text-muted-foreground">{order.customer.email}</p>
            <p className="text-sm text-muted-foreground">{order.customer.country}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">From</p>
            <p className="mt-1 font-medium">CodeCrew Electronics</p>
            <p className="text-sm text-muted-foreground">accounts@codecrew.dev</p>
            <p className="text-sm text-muted-foreground">PCB design · fabrication · assembly</p>
          </div>
        </div>

        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{order.description}</p>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lines.map(([label, amount]) => (
              <tr key={label}>
                <td className="py-2.5">{label}</td>
                <td className="py-2.5 text-right">{money(amount)}</td>
              </tr>
            ))}
            {(order.pricing?.discount ?? 0) > 0 && (
              <tr>
                <td className="py-2.5 text-primary">Discount</td>
                <td className="py-2.5 text-right text-primary">- {money(order.pricing?.discount ?? 0)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Production cost</span>
              <span>{money(quoteTotal(order.quote))}</span>
            </div>
            <div className="flex justify-between font-display text-lg font-semibold text-primary">
              <span>Total due</span>
              <span>{money(finalPrice(order))}</span>
            </div>
            <p className="text-xs text-muted-foreground">Payment status: {order.paymentStatus}</p>
          </div>
        </div>

        <p className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Thank you for building with CodeCrew. Payment due within 14 days.
        </p>
      </div>
    </AppShell>
  );
}
