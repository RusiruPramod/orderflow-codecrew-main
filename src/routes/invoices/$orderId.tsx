import { createFileRoute, useParams } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/lib/queries";
import { formatDate } from "@/lib/analytics";
import { invoiceTotal, money, quoteTotal } from "@/lib/types";

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
  const { orderId } = useParams({ from: "/owner/invoices/$orderId" });
  const { data: orders = [] } = useOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) return <AppShell title="Invoice">Not found.</AppShell>;

  const designerCost = quoteTotal(order.quote);
  const myPrice = order.myPrice ?? 0;
  const lines: [string, number][] = [
    ["PCB production (designer cost)", designerCost],
    ["My price / service markup", myPrice],
  ];

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
          </tbody>
        </table>

        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Designer cost</span>
              <span>{money(designerCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>My price</span>
              <span>{money(myPrice)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold text-primary">
              <span>Total due</span>
              <span>{money(invoiceTotal(order))}</span>
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
