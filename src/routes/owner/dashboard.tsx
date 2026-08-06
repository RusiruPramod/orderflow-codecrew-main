import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircuitBoard,
  Clock,
  DollarSign,
  Hourglass,
  Package,
  Printer,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useActivity, useExpenses, useOrders, useUsers } from "@/lib/queries";
import { money } from "@/lib/types";
import {
  designerPerformance,
  monthlyRevenue,
  monthlySeries,
  relativeTime,
  statusCount,
  totalDesignerCost,
  totalProfit,
  totalRevenue,
} from "@/lib/analytics";

export const Route = createFileRoute("/owner/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner Dashboard — CodeCrew PCB ERP" },
      {
        name: "description",
        content: "Live PCB order pipeline, revenue, profit and designer performance for CodeCrew owners.",
      },
      { property: "og:title", content: "Owner Dashboard — CodeCrew PCB ERP" },
      { property: "og:description", content: "Revenue, profit and PCB order pipeline at a glance." },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <Dashboard />
    </RequireRole>
  ),
});

const PIE_COLORS = [
  "var(--color-primary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-chart-5)",
  "var(--color-secondary-foreground)",
  "var(--color-destructive)",
];

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`surface-card p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
  boxShadow: "var(--shadow-lift)",
};

function Dashboard() {
  const { data: orders = [] } = useOrders();
  const { data: users = [] } = useUsers();
  const { data: expenses = [] } = useExpenses();
  const { data: activity = [] } = useActivity();

  const revenue = totalRevenue(orders);
  const profit = totalProfit(orders);
  const designerCost = totalDesignerCost(orders);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0) + designerCost;
  const series = monthlySeries(orders, expenses);
  const perf = designerPerformance(orders).slice(0, 5);

  const pipeline = [
    { label: "Total Orders", value: orders.length, icon: Package, to: "/owner/orders" },
    { label: "Pending", value: statusCount(orders, ["New", "Assigned", "Under Review"]), icon: Clock },
    { label: "Designer Assigned", value: orders.filter((o) => o.designerId).length, icon: UserCheck },
    { label: "Waiting Pricing", value: statusCount(orders, ["Waiting for Price"]), icon: Hourglass },
    { label: "Price Confirmed", value: statusCount(orders, ["Price Approved", "Customer Confirmed"]), icon: CheckCircle2 },
    { label: "In Production", value: statusCount(orders, ["Designing", "Quality Check"]), icon: CircuitBoard },
    { label: "Printing", value: statusCount(orders, ["Printing"]), icon: Printer },
    { label: "Completed", value: statusCount(orders, ["Completed"]), icon: CheckCircle2 },
    { label: "Delivered", value: statusCount(orders, ["Delivered"]), icon: Truck },
    { label: "Cancelled", value: statusCount(orders, ["Cancelled"]), icon: XCircle },
  ];

  const statusPie = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      const bucket =
        o.status === "Delivered" || o.status === "Completed"
          ? "Completed"
          : o.status === "Cancelled"
            ? "Cancelled"
            : ["Designing", "Printing", "Quality Check"].includes(o.status)
              ? "In production"
              : ["Price Submitted", "Price Approved", "Customer Confirmed"].includes(o.status)
                ? "Priced"
                : "Intake";
      acc[bucket] = (acc[bucket] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const recent = [...orders]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6);

  return (
    <AppShell
      title="Owner Dashboard"
      subtitle="Everything happening across CodeCrew right now"
      actions={
        <Button asChild size="sm" className="hidden rounded-xl sm:inline-flex">
          <Link to="/owner/orders/new">New order</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={money(revenue)} icon={DollarSign} delta={12.4} hint="all confirmed orders" accent />
        <StatCard label="Monthly Revenue" value={money(monthlyRevenue(orders))} icon={TrendingUp} delta={8.1} hint="this month" />
        <StatCard label="Total Profit" value={money(profit)} icon={Wallet} delta={5.6} hint="after designer cost" />
        <StatCard label="Total Expenses" value={money(expenseTotal)} icon={Activity} delta={-3.2} hint="incl. designer payouts" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {pipeline.map((item) => (
          <div key={item.label} className="surface-card lift-hover flex items-center gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <item.icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold">{item.value}</span>
              <span className="block truncate text-xs text-muted-foreground">{item.label}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Monthly Revenue" subtitle="Confirmed customer value" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={series} margin={{ left: -18, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Status" subtitle="Distribution across pipeline">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                {statusPie.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {statusPie.map((entry, i) => (
              <span key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {entry.name} · {entry.value}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Orders Per Month" subtitle="Intake volume">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={series} margin={{ left: -22, right: 6 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="orders" fill="var(--color-primary)" radius={[8, 8, 0, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Income vs Expenses" subtitle="Cash movement per month">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={series} margin={{ left: -22, right: 6 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="var(--color-secondary-foreground)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h3 className="font-display text-base font-semibold">Recent Orders</h3>
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link to="/owner/orders">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recent.map((order) => (
              <Link
                key={order.id}
                to="/owner/orders/$orderId"
                params={{ orderId: order.id }}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <CircuitBoard className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{order.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {order.code} · {order.customer.company ?? order.customer.name}
                  </span>
                </span>
                <StatusBadge status={order.status} className="hidden sm:inline-flex" />
                <span className="hidden w-20 text-right text-sm font-semibold md:block">
                  {order.pricing ? money(order.pricing.serviceCharge + order.pricing.profitMargin) : "—"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-card p-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h3 className="font-display text-base font-semibold">Active Designers</h3>
              <span className="ml-auto font-display text-lg font-semibold">
                {users.filter((u) => u.role === "designer" && u.active).length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {perf.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {d.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{d.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {d.completed}/{d.assigned} completed
                    </span>
                  </span>
                  <span className="text-sm font-semibold">{money(d.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <h3 className="font-display text-base font-semibold">Activity Timeline</h3>
            <ol className="mt-4 space-y-4 border-l border-border pl-4">
              {activity.slice(0, 6).map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm font-medium">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">{entry.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {entry.userName} · {relativeTime(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
