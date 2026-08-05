import { finalPrice, orderProfit, quoteTotal, REVENUE_STATUSES } from "./types";
import type { Expense, Order, OrderStatus } from "./types";

export interface MonthPoint {
  month: string;
  revenue: number;
  orders: number;
  profit: number;
  expenses: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isRevenueOrder(order: Order) {
  return REVENUE_STATUSES.includes(order.status);
}

export function totalRevenue(orders: Order[]) {
  return orders.filter(isRevenueOrder).reduce((sum, o) => sum + finalPrice(o), 0);
}

export function totalProfit(orders: Order[]) {
  return orders.filter(isRevenueOrder).reduce((sum, o) => sum + orderProfit(o), 0);
}

export function totalDesignerCost(orders: Order[]) {
  return orders.filter(isRevenueOrder).reduce((sum, o) => sum + quoteTotal(o.quote), 0);
}

export function monthlyRevenue(orders: Order[]) {
  const now = new Date();
  return orders
    .filter(isRevenueOrder)
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + finalPrice(o), 0);
}

export function countByStatus(orders: Order[]) {
  return orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
}

export function statusCount(orders: Order[], statuses: OrderStatus[]) {
  return orders.filter((o) => statuses.includes(o.status)).length;
}

export function monthlySeries(orders: Order[], expenses: Expense[], months = 8): MonthPoint[] {
  const now = new Date();
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const inMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
    };
    const monthOrders = orders.filter((o) => inMonth(o.createdAt));
    const revenueOrders = monthOrders.filter(isRevenueOrder);
    points.push({
      month: MONTHS[ref.getMonth()] ?? "",
      orders: monthOrders.length,
      revenue: Math.round(revenueOrders.reduce((s, o) => s + finalPrice(o), 0)),
      profit: Math.round(revenueOrders.reduce((s, o) => s + orderProfit(o), 0)),
      expenses: Math.round(
        expenses.filter((e) => inMonth(e.date)).reduce((s, e) => s + e.amount, 0),
      ),
    });
  }
  return points;
}

export function designerPerformance(orders: Order[]) {
  const map = new Map<string, { name: string; assigned: number; completed: number; value: number }>();
  for (const order of orders) {
    if (!order.designerId || !order.designerName) continue;
    const entry = map.get(order.designerId) ?? {
      name: order.designerName,
      assigned: 0,
      completed: 0,
      value: 0,
    };
    entry.assigned += 1;
    if (["Completed", "Delivered"].includes(order.status)) entry.completed += 1;
    entry.value += quoteTotal(order.quote);
    map.set(order.designerId, entry);
  }
  return [...map.values()].sort((a, b) => b.assigned - a.assigned);
}

export function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
