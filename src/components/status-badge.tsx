import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const TONES: Record<OrderStatus, string> = {
  New: "bg-secondary text-secondary-foreground border-border",
  Assigned: "bg-info/10 text-info border-info/25",
  "Under Review": "bg-info/10 text-info border-info/25",
  "Waiting for Price": "bg-warning/15 text-warning-foreground border-warning/30",
  "Price Submitted": "bg-primary/10 text-primary border-primary/25",
  "Price Approved": "bg-primary/15 text-primary border-primary/30",
  "Customer Confirmed": "bg-success/12 text-success border-success/30",
  Designing: "bg-primary/10 text-primary border-primary/25",
  Printing: "bg-primary/15 text-primary border-primary/30",
  "Quality Check": "bg-info/10 text-info border-info/25",
  Completed: "bg-success/15 text-success border-success/30",
  Delivered: "bg-success/20 text-success border-success/35",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/25",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        TONES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function PaymentBadge({ status }: { status: "Unpaid" | "Partially Paid" | "Paid" }) {
  const tone =
    status === "Paid"
      ? "bg-success/15 text-success border-success/30"
      : status === "Partially Paid"
        ? "bg-warning/15 text-warning-foreground border-warning/30"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>
  );
}
