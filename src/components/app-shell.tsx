import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChartNoAxesCombined,
  CircuitBoard,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["owner"] },
  { label: "Orders", to: "/orders", icon: CircuitBoard, roles: ["owner"] },
  { label: "New Order", to: "/orders/new", icon: Plus, roles: ["owner"] },
  { label: "Designers", to: "/designers", icon: Users, roles: ["owner"] },
  { label: "Invoices", to: "/invoices", icon: FileText, roles: ["owner"] },
  { label: "Reports", to: "/reports", icon: ChartNoAxesCombined, roles: ["owner"] },
  { label: "Activity", to: "/activity", icon: FolderOpen, roles: ["owner"] },
  { label: "My Workspace", to: "/designer", icon: LayoutDashboard, roles: ["designer"] },
  { label: "Notifications", to: "/notifications", icon: Bell, roles: ["owner", "designer"] },
  { label: "Settings", to: "/settings", icon: Settings, roles: ["owner", "designer"] },
];

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: notifications = [] } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  const items = useMemo(() => NAV.filter((i) => user && i.roles.includes(user.role)), [user]);
  const unread = notifications.filter(
    (n) => !n.read && user && (n.to === user.role) && (!n.userId || n.userId === user.id),
  ).length;

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/", replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-6 bg-sidebar px-4 py-5">
      <div className="flex items-center justify-between">
        <Logo compact={collapsed} />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="text-muted-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(`${item.to}/`));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-secondary",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                />
              )}
              <item.icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.label === "Notifications" && unread > 0 && (
                <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="rounded-2xl border border-border bg-primary-soft p-4">
          <p className="font-display text-sm font-semibold">Need a fast quote?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign a designer and pricing lands in your inbox.
          </p>
          <Button asChild size="sm" className="mt-3 w-full">
            <Link to="/orders/new">Create order</Link>
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-[18px]" />
        {!collapsed && "Sign out"}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border lg:block",
          collapsed ? "w-[84px]" : "w-[264px]",
        )}
      >
        {sidebar}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="h-full w-[268px] border-r border-sidebar-border"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:block"
              aria-label="Toggle sidebar"
            >
              <PanelLeftClose className={cn("size-5 transition-transform", collapsed && "rotate-180")} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground md:flex">
              <Search className="size-4" />
              <input
                placeholder="Search orders, customers…"
                className="w-44 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>

            {actions}

            <Link
              to="/notifications"
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unread}
                </span>
              )}
            </Link>

            <Link to="/settings" className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-secondary">
              <span className="grid size-9 place-items-center rounded-full bg-secondary font-display text-sm font-semibold">
                {user?.name.slice(0, 1)}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-sm font-medium">{user?.name}</span>
                <span className="block text-[11px] text-muted-foreground capitalize">{user?.role}</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[1400px]"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
