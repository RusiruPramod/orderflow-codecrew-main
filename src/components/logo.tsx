import { cn } from "@/lib/utils";
import { CircuitBoard } from "lucide-react";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
        <CircuitBoard className="size-5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-semibold tracking-tight">
            Code<span className="text-primary">Crew</span>
          </span>
          <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            PCB ERP
          </span>
        </span>
      )}
    </div>
  );
}
