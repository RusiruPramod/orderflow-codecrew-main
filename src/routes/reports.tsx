import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Button } from "@/components/ui/button";
import { useExpenses, useOrders } from "@/lib/queries";
import { designerPerformance, monthlySeries, totalProfit, totalRevenue } from "@/lib/analytics";
import { finalPrice, money } from "@/lib/types";

export const Route = createFileRoute("/reports")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reports — CodeCrew PCB ERP" },
      { name: "description", content: "Revenue, expense, profit and designer performance reports with CSV export." },
      { property: "og:title", content: "Reports — CodeCrew PCB ERP" },
      { property: "og:description", content: "Revenue, profit and designer performance reporting." },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <Reports />
    </RequireRole>
  ),
});

function Reports() {
  const { data: orders = [] } = useOrders();
  const { data: expenses = [] } = useExpenses();
  const series = monthlySeries(orders, expenses, 12);
  const perf = designerPerformance(orders);

  const exportCsv = () => {
    const rows = [
      ["Order", "Customer", "Status", "Designer", "Created", "Customer price"],
      ...orders.map((o) => [
        o.code,
        o.customer.name,
        o.status,
        o.designerName ?? "",
        new Date(o.createdAt).toISOString().slice(0, 10),
        String(finalPrice(o)),
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codecrew-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Reports"
      subtitle="Revenue, expenses, profit and designer performance"
      actions={
        <Button size="sm" variant="outline" className="rounded-xl" onClick={exportCsv}>
          <Download className="size-4" /> CSV
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total revenue", money(totalRevenue(orders))],
          ["Total profit", money(totalProfit(orders))],
          ["Total expenses", money(expenses.reduce((s, e) => s + e.amount, 0))],
        ].map(([label, value]) => (
          <div key={label} className="surface-card p-5">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="surface-card mt-4 p-5">
        <h3 className="font-display text-base font-semibold">Revenue vs profit — last 12 months</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={series} margin={{ left: -20, top: 16 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
            <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
            <Tooltip
              formatter={(v: number) => money(v)}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }}
            />
            <Bar dataKey="revenue" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="profit" fill="var(--color-secondary-foreground)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="surface-card mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-5 py-3 font-medium">Designer</th>
              <th className="px-5 py-3 font-medium">Assigned</th>
              <th className="px-5 py-3 font-medium">Completed</th>
              <th className="px-5 py-3 text-right font-medium">Quoted value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {perf.map((p) => (
              <tr key={p.name}>
                <td className="px-5 py-3 font-medium">{p.name}</td>
                <td className="px-5 py-3">{p.assigned}</td>
                <td className="px-5 py-3">{p.completed}</td>
                <td className="px-5 py-3 text-right font-semibold">{money(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
