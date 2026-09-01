import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import { Loader } from "@/components/common/Loader";
import { subscribeToGuests } from "@/services/guestService";
import { subscribeToRsvps } from "@/services/rsvpService";

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
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total invitations" value={stats.totalGuests} />
        <StatCard label="Total seats" value={stats.totalSeats} />
        <StatCard label="RSVPs received" value={stats.received} />
        <StatCard label="Pending" value={stats.pending} tone="warn" />
        <StatCard label="Attending" value={stats.attending} tone="good" />
        <StatCard label="Declined" value={stats.declined} tone="bad" />
        <StatCard label="Confirmed attendees" value={stats.confirmedAttendees} tone="good" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">RSVP breakdown</h2>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}