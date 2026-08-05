import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  accent?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, delta, hint, accent, className }: StatCardProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "surface-card lift-hover relative overflow-hidden p-5",
        accent && "bg-primary text-primary-foreground border-primary",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "text-xs font-medium tracking-wide uppercase",
              accent ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          <p className="mt-2 truncate font-display text-2xl font-semibold">{value}</p>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            accent ? "bg-primary-foreground/15 text-primary-foreground" : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              accent
                ? "bg-primary-foreground/15 text-primary-foreground"
                : up
                  ? "bg-success/12 text-success"
                  : "bg-destructive/10 text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && (
          <span className={accent ? "text-primary-foreground/80" : "text-muted-foreground"}>{hint}</span>
        )}
      </div>
    </div>
  );
}
