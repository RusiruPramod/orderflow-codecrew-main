import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, getRoleHomePath, useAuth } from "../lib/auth";
import { useDataSync } from "../lib/queries";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CodeCrew PCB ERP — Order & Production Management" },
      {
        name: "description",
        content:
          "CodeCrew PCB ERP: manage PCB orders, designer quotations, pricing, invoices and production tracking in one workspace.",
      },
      { name: "author", content: "CodeCrew" },
      { property: "og:title", content: "CodeCrew PCB ERP" },
      {
        property: "og:description",
        content: "PCB order management, designer quoting, invoicing and production analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function DataSyncBridge() {
  useDataSync();
  return null;
}

function RouteGuard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname !== "/") {
        void navigate({ to: "/", replace: true });
      }
      return;
    }

    const ownerOnlyPaths = [
      "/owner/dashboard",
      "/owner/activity",
      "/owner/designers",
      "/owner/reports",
      "/owner/invoices",
      "/owner/invoices/",
      "/owner/orders",
      "/owner/orders/",
      "/owner/orders/new",
    ];
    const designerOnlyPaths = ["/designer/designer", "/designer", "/designer/"];
    const sharedPrefixes = ["/notifications", "/settings"];

    const isOwnerOnlyPath = ownerOnlyPaths.includes(pathname);
    const isDesignerOnlyPath = designerOnlyPaths.includes(pathname) || pathname.startsWith("/designer/");
    const isSharedPath = sharedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    const isOrderDetailsPath = pathname.startsWith("/orders/") && pathname !== "/orders/new";
    const isRoleHomePath = pathname === getRoleHomePath(user.role);

    if (pathname === "/") {
      void navigate({ to: getRoleHomePath(user.role), replace: true });
      return;
    }

    if (user.role === "designer" && (isOwnerOnlyPath || (pathname.startsWith("/orders/") && pathname !== "/orders/new" && !isOrderDetailsPath))) {
      void navigate({ to: getRoleHomePath(user.role), replace: true });
      return;
    }

    if (user.role === "owner" && isDesignerOnlyPath) {
      void navigate({ to: getRoleHomePath(user.role), replace: true });
      return;
    }

    if (!isSharedPath && !isOrderDetailsPath && !isOwnerOnlyPath && !isDesignerOnlyPath && !isRoleHomePath) {
      void navigate({ to: getRoleHomePath(user.role), replace: true });
    }
  }, [loading, navigate, pathname, user]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataSyncBridge />
        <RouteGuard />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

