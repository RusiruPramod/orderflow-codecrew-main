import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Chrome, CircuitBoard, FileText, Loader2, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleHomePath, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — CodeCrew PCB ERP" },
      {
        name: "description",
        content:
          "Secure role-based sign in for CodeCrew owners and outsourced PCB designers. Manage orders, quotes and invoices.",
      },
      { property: "og:title", content: "Sign in — CodeCrew PCB ERP" },
      {
        property: "og:description",
        content: "Role-based access for CodeCrew PCB order management.",
      },
    ],
  }),
  component: LoginPage,
});

const HIGHLIGHTS = [
  { icon: CircuitBoard, title: "Order to delivery", text: "Track all 13 workflow stages with full file history." },
  { icon: Sparkles, title: "Designer quoting", text: "Outsourced designers price jobs, you add the margin." },
  { icon: FileText, title: "Invoices in seconds", text: "Branded A4 invoices, print or export instantly." },
];

function LoginPage() {
  const { user, loading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const ownerPassword = "Rusiru764";
  const designerPassword = "Malaka581";
  const [email, setEmail] = useState("rusirupramod@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: getRoleHomePath(user.role), replace: true });
    }
  }, [loading, user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const profile = await signIn(email, password);
      toast.success(`Welcome back, ${profile.name.split(" ")[0]}`);
      void navigate({ to: getRoleHomePath(profile.role), replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    try {
      const profile = await signInWithGoogle();
      toast.success(`Welcome back, ${profile.name.split(" ")[0]}`);
      void navigate({ to: getRoleHomePath(profile.role), replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-background p-12 lg:flex">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full bg-primary/12 blur-3xl" />
        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-lg">
          <h2 className="font-display text-[42px] leading-[1.08] font-semibold">
            The control room for your <span className="text-gradient-brand">PCB business</span>.
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Create orders, ship gerbers to outsourced designers, approve their quotes, add your margin
            and invoice customers — without leaving one clean workspace.
          </p>

          <div className="mt-9 space-y-3">
            {HIGHLIGHTS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 * i, duration: 0.4 }}
                className="surface-card flex items-start gap-3 p-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <item.icon className="size-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">{item.text}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Role-based access control · Encrypted credentials · Full audit trail
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="mt-4 mb-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to website
            </Link>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold lg:mt-0">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Owners get the full system. Designers only see their assigned orders.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl pl-9"
                  placeholder="you@codecrew.dev"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="h-11 w-full rounded-xl" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="size-4" /></>}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-wide">
            <span className="h-px flex-1 bg-border" />
            <span>or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-xl border-border bg-background"
            onClick={handleGoogleSignIn}
            disabled={googleBusy}
          >
            {googleBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Chrome className="size-4" />
                Continue with Google
              </>
            )}
          </Button>

          <div className="mt-8 rounded-2xl border border-dashed border-border p-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Connected accounts
            </p>
            <div className="mt-3 grid gap-2">
              {[
                { label: "Owner", email: "rusirupramod@gmail.com", password: ownerPassword },
                { label: "Designer", email: "malakathushan@gmail.com", password: designerPassword },
              ].map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary-soft"
                >
                  <span>
                    <span className="block font-medium">{account.label}</span>
                    <span className="block text-xs text-muted-foreground">{account.email}</span>
                  </span>
                  <span className="text-xs text-primary">Sign in</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Actual passwords are stored in <strong>password.md</strong>. Google sign-in is enabled in Firebase.
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
