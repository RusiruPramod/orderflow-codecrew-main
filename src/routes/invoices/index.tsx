import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { PaymentBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/lib/queries";
import { formatDate } from "@/lib/analytics";
import { finalPrice, money } from "@/lib/types";

export const Route = createFileRoute("/invoices/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Invoices — CodeCrew PCB ERP" },
      { name: "description", content: "Generate and track professional PCB invoices for every confirmed order." },
      { property: "og:title", content: "Invoices — CodeCrew PCB ERP" },
      { property: "og:description", content: "Branded invoices for confirmed PCB orders." },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <Invoices />
    </RequireRole>
  ),
});

function Invoices() {
  const { data: orders = [] } = useOrders();
  const billable = orders.filter((o) => o.pricing);

  return (
    <AppShell title="Invoices" subtitle={`${billable.length} invoiceable orders`}>
      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-5 py-3 font-medium">Invoice</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {billable.map((order) => (
              <tr key={order.id} className="hover:bg-muted">
                <td className="px-5 py-3.5 font-medium">INV-{order.code.replace("CC-", "")}</td>
                <td className="px-5 py-3.5">{order.customer.company ?? order.customer.name}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{formatDate(order.pricing?.confirmedAt)}</td>
                <td className="px-5 py-3.5">
                  <PaymentBadge status={order.paymentStatus} />
                </td>
                <td className="px-5 py-3.5 text-right font-semibold">{money(finalPrice(order))}</td>
                <td className="px-5 py-3.5 text-right">
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link to="/invoices/$orderId" params={{ orderId: order.id }}>
                      <Receipt className="size-4" /> Open
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
