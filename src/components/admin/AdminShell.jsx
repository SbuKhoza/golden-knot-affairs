import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminSignOut } from "@/services/authService";
import { Loader } from "@/components/common/Loader";

const nav = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/guests", label: "Guests" },
  { to: "/admin/rsvps", label: "RSVPs" },
  { to: "/admin/program", label: "Program" },
  { to: "/admin/settings", label: "Wedding Settings" },
];

export function AdminShell({ title, children }) {
  const { loading, user, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) return <Loader full label="Checking your access…" />;

  if (!user || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl">Administrator access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please sign in with an administrator account.</p>
          <Link
            to="/admin/login"
            className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-xs uppercase tracking-[0.25em] text-primary-foreground"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar p-6 text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <p className="font-display text-xl tracking-[0.2em] text-sidebar-primary">WEDDING</p>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] opacity-70">Admin</p>
        <nav aria-label="Admin navigation" className="mt-10 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-4 py-3 text-sm transition hover:bg-sidebar-accent"
              activeProps={{ className: "block rounded-md px-4 py-3 text-sm bg-sidebar-accent text-sidebar-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="rounded-md border border-border px-3 py-2 text-sm lg:hidden"
            >
              ☰
            </button>
            <h1 className="font-display text-xl sm:text-2xl">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={async () => {
                await adminSignOut();
                navigate({ to: "/admin/login" });
              }}
              className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, tone = "default" }) {
  const tones = {
    default: "border-border",
    good: "border-primary/40 bg-primary/5",
    warn: "border-gold/50 bg-gold/10",
    bad: "border-destructive/30 bg-destructive/5",
  };
  return (
    <div className={`rounded-xl border p-5 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    pending: "bg-gold/20 text-foreground",
    attending: "bg-primary/15 text-primary",
    declined: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs capitalize ${map[status] || map.pending}`}>
      {status || "pending"}
    </span>
  );
}
