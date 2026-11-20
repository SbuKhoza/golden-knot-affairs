import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import { Loader } from "@/components/common/Loader";
import { subscribeToGuests } from "@/services/guestService";
import { subscribeToRsvps } from "@/services/rsvpService";
import { ChartNoAxesColumnIncreasing } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <AdminShell title="Dashboard">
      <DashboardPage />
    </AdminShell>
  );
}

function DashboardPage() {
  const [guests, setGuests] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [ready, setReady] = useState({ guests: false, rsvps: false });

  useEffect(() => {
    const unsub1 = subscribeToGuests(
      (data) => {
        setGuests(data);
        setReady((prev) => ({ ...prev, guests: true }));
      },
      () => setReady((prev) => ({ ...prev, guests: true })),
    );
    const unsub2 = subscribeToRsvps(
      (data) => {
        setRsvps(data);
        setReady((prev) => ({ ...prev, rsvps: true }));
      },
      () => setReady((prev) => ({ ...prev, rsvps: true })),
    );
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const stats = useMemo(() => {
    const totalGuests = guests.length;
    const totalSeats = guests.reduce((sum, g) => sum + (Number(g.numberOfSeats) || 0), 0);
    const attending = guests.filter((g) => g.rsvpStatus === "attending").length;
    const declined = guests.filter((g) => g.rsvpStatus === "declined").length;
    const pending = Math.max(0, totalGuests - attending - declined);
    const received = attending + declined;
    const confirmedAttendees = rsvps.reduce(
      (sum, r) => sum + (r.attending ? Number(r.numberAttending) || 0 : 0),
      0,
    );
    return { totalGuests, totalSeats, attending, declined, pending, received, confirmedAttendees };
  }, [guests, rsvps]);

  const chartData = [
    { name: "Attending", value: stats.attending },
    { name: "Declined", value: stats.declined },
    { name: "Pending", value: stats.pending },
  ];

  if (!ready.guests || !ready.rsvps) return <Loader label="Loading dashboard…" />;

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total invitations" value={stats.totalGuests} />
        <StatCard label="Total seats" value={stats.totalSeats} />
        <StatCard label="RSVPs received" value={stats.received} />
        <StatCard label="Pending" value={stats.pending} tone="warn" />
        <StatCard label="Attending" value={stats.attending} tone="good" />
        <StatCard label="Declined" value={stats.declined} tone="bad" />
        <StatCard label="Confirmed attendees" value={stats.confirmedAttendees} tone="good" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <ChartNoAxesColumnIncreasing className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-primary">RSVP Breakdown</h2>
              <p className="text-sm text-muted-foreground">Invitation response overview</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary" />Attending</span>
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-gold" />Pending</span>
          </div>
        </div>
        <div className="mt-4 h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[8, 8, 0, 0]} maxBarSize={160} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}