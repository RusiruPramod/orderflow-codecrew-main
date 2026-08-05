export type Role = "owner" | "designer";

export const ORDER_STATUSES = [
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
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type FileKind =
  | "Gerber"
  | "EasyEDA"
  | "JSON"
  | "BOM"
  | "Pick & Place"
  | "ZIP"
  | "PDF"
  | "Image"
  | "Document";

export interface OrderFile {
  id: string;
  name: string;
  kind: FileKind;
  size: number;
  url?: string;
  uploadedAt: string;
}

export interface DesignerQuote {
  designCost: number;
  printingCost: number;
  assembly: number;
  sourcing: number;
  shipping: number;
  testing: number;
  extra: number;
  notes?: string;
  submittedAt?: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "changes_requested";
  ownerFeedback?: string;
}

export interface OwnerPricing {
  serviceCharge: number;
  profitMargin: number;
  extraCharges: number;
  discount: number;
  confirmedAt?: string;
}

export interface Customer {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  country?: string;
  address?: string;
}

export interface Order {
  id: string;
  code: string;
  customer: Customer;
  title: string;
  description: string;
  requirements: string;
  layers: number;
  quantity: number;
  material: string;
  thickness: string;
  surfaceFinish: string;
  color: string;
  notes?: string;
  status: OrderStatus;
  designerId?: string;
  designerName?: string;
  files: OrderFile[];
  quote?: DesignerQuote;
  pricing?: OwnerPricing;
  paymentStatus: "Unpaid" | "Partially Paid" | "Paid";
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  specialty?: string;
  active: boolean;
  joinedAt: string;
}

export interface Notification {
  id: string;
  to: Role;
  userId?: string;
  title: string;
  body: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  userName: string;
  role: Role;
  createdAt: string;
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  category: string;
  date: string;
}

export const emptyQuote: DesignerQuote = {
  designCost: 0,
  printingCost: 0,
  assembly: 0,
  sourcing: 0,
  shipping: 0,
  testing: 0,
  extra: 0,
  status: "draft",
};

export function quoteTotal(q?: DesignerQuote | null): number {
  if (!q) return 0;
  return (
    q.designCost + q.printingCost + q.assembly + q.sourcing + q.shipping + q.testing + q.extra
  );
}

export function finalPrice(order: Order): number {
  const base = quoteTotal(order.quote);
  const p = order.pricing;
  if (!p) return base;
  return base + p.serviceCharge + p.profitMargin + p.extraCharges - p.discount;
}

export function orderProfit(order: Order): number {
  const p = order.pricing;
  if (!p) return 0;
  return p.serviceCharge + p.profitMargin + p.extraCharges - p.discount;
}

export const REVENUE_STATUSES: OrderStatus[] = [
  "Customer Confirmed",
  "Designing",
  "Printing",
  "Quality Check",
  "Completed",
  "Delivered",
];

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}
