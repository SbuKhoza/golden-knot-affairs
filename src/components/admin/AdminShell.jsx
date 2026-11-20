import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarCheck2,
  ChartNoAxesColumnIncreasing,
  Clock3,
  Flower2,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  QrCode,
  Settings2,
  ScrollText,
  UserRoundCheck,
  UsersRound,
  X,
  CircleX,
} from "lucide-react";
import { Loader } from "@/components/common/Loader";
import { adminSignOut } from "@/services/authService";
import floralSpray from "@/assets/admin-floral-spray.png";

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/guests", label: "Guests", icon: UsersRound },
  { to: "/admin/check-in", label: "Entrance check-in", icon: QrCode },
  { to: "/admin/rsvps", label: "RSVPs", icon: ChartNoAxesColumnIncreasing },
  { to: "/admin/program", label: "Program", icon: ScrollText },
  { to: "/admin/settings", label: "Wedding Settings", icon: Settings2 },
];

const statIcons = {
  "Total invitations": Mail,
  "Total seats": UsersRound,
  "RSVPs received": CalendarCheck2,
  Invited: Mail,
  Seats: UsersRound,
  Attending: CalendarCheck2,
  Declined: CircleX,
  Pending: Clock3,
  "Confirmed attendees": UserRoundCheck,
};

export function AdminShell({ title, children }) {
  const { loading, user, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) return <Loader full label="Checking your access…" />;

  if (!user || !isAdmin) {
    return (
      <main className="admin-portal flex min-h-screen items-center justify-center px-4 text-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
          <Flower2 className="mx-auto size-9 text-primary" aria-hidden="true" />
          <h1 className="mt-4 font-display text-3xl">Administrator access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please sign in with an administrator account.</p>
          <Link
            to="/admin/login"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-105"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const sidebar = (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-5 py-7 text-sidebar-foreground shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="relative z-10 flex items-center gap-3 px-2">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-card text-gold shadow-sm">
          <Flower2 className="size-8" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-2xl leading-none tracking-[0.12em] text-foreground">WEDDING</p>
          <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-primary">A D M I N</p>
        </div>
      </div>

      <div className="relative z-10 my-6 flex items-center gap-3 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        <span className="h-px flex-1 bg-gold/60" />
        Wedding portal
        <span className="h-px flex-1 bg-gold/60" />
      </div>

      <nav aria-label="Admin navigation" className="relative z-10 flex-1 space-y-2">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className="admin-nav-link group flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "admin-nav-link admin-nav-link-active group flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-sidebar-primary transition-colors" }}
          >
            <Icon className="size-5 shrink-0 text-primary/80 transition-colors group-hover:text-primary" strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="relative z-10 mb-44 mt-6 px-2 text-center lg:mb-48">
        <p className="font-script text-3xl text-primary">Our Special Day</p>
        <Heart className="mx-auto mt-1 size-6 fill-blush text-primary" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <img
        src={floralSpray}
        alt=""
        loading="lazy"
        width={1024}
        height={1024}
        className="pointer-events-none absolute bottom-0 left-0 z-0 w-full select-none opacity-80"
        aria-hidden="true"
      />
    </aside>
  );

  return (
    <div className="admin-portal flex min-h-screen">
      {sidebar}
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/35 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="relative flex min-h-[6.75rem] items-center justify-between gap-4 overflow-hidden border-b border-border bg-card/90 px-4 py-4 sm:px-7 lg:px-10">
          <img
            src={floralSpray}
            alt=""
            loading="lazy"
            width={1024}
            height={1024}
            className="pointer-events-none absolute -right-8 -top-20 z-0 h-52 w-72 select-none object-contain object-right opacity-60 sm:right-40 sm:h-60 sm:w-80"
            aria-hidden="true"
          />
          <div className="relative z-10 flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition hover:bg-secondary lg:hidden"
            >
              <Flower2 className="size-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-3xl font-semibold leading-none text-foreground sm:text-4xl">{title}</h1>
              <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">Wedding Invitation Admin</p>
            </div>
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-3 sm:gap-5">
            <span className="hidden max-w-56 items-center gap-2 truncate text-sm text-foreground md:flex">
              <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{user.email}</span>
            </span>
            <button
              type="button"
              onClick={async () => {
                await adminSignOut();
                navigate({ to: "/admin/login" });
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/70 bg-card px-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground shadow-sm transition hover:bg-secondary sm:px-5"
            >
              <span>Logout</span>
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </header>
        <main className="min-h-[calc(100vh-6.75rem)] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, tone = "default" }) {
  const Icon = statIcons[label] || CalendarCheck2;
  const tones = {
    default: "border-border/80 bg-card text-primary",
    good: "border-primary/20 bg-primary/5 text-primary",
    warn: "border-gold/35 bg-gold/10 text-foreground",
    bad: "border-destructive/20 bg-destructive/5 text-destructive",
  };
  const iconTones = {
    default: "bg-blush/70 text-primary",
    good: "bg-primary/10 text-primary",
    warn: "bg-gold/20 text-foreground",
    bad: "bg-destructive/10 text-destructive",
  };

  return (
    <div className={`group flex min-h-[7.5rem] items-center gap-4 rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${tones[tone]}`}>
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-full shadow-inner ${iconTones[tone]}`}>
        <Icon className="size-7" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-4xl leading-none text-foreground">{value}</p>
      </div>
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