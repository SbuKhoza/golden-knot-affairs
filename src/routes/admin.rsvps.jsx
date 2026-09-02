import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell, Badge, StatCard } from "@/components/admin/AdminShell";
import { EmptyState, Loader } from "@/components/common/Loader";
import { subscribeToGuests } from "@/services/guestService";
import { subscribeToRsvps } from "@/services/rsvpService";
import { downloadCsv, toCsv } from "@/utils/csv";
import { formatWeddingDate } from "@/utils/format";

export const Route = createFileRoute("/admin/rsvps")({
  head: () => ({
    meta: [
      { title: "RSVPs — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RsvpsRoute,
});

function RsvpsRoute() {
  return (
    <AdminShell title="RSVPs">
      <RsvpsPage />
    </AdminShell>
  );
}

const FILTERS = ["all", "pending", "attending", "declined"];

function RsvpsPage() {
  const [guests, setGuests] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [ready, setReady] = useState({ guests: false, rsvps: false });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

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

  const rows = useMemo(() => {
    const rsvpByGuest = new Map(rsvps.map((r) => [r.guestId, r]));
    return guests.map((guest) => {
      const rsvp = rsvpByGuest.get(guest.id);
      return {
        id: guest.id,
        name: `${guest.firstName} ${guest.surname}`,
        seats: guest.numberOfSeats,
        tableNumber: guest.tableNumber || "",
        status: guest.rsvpStatus || "pending",
        numberAttending: rsvp?.numberAttending ?? "—",
        guestNames: (rsvp?.guestNames || []).join(", "),
        dietary: rsvp?.dietaryRequirements || guest.dietaryRequirements || "",
        special: rsvp?.specialRequirements || guest.specialRequirements || "",
        message: rsvp?.message || "",
        submittedAt: rsvp?.submittedAt,
      };
    });
  }, [guests, rsvps]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    return list;
  }, [rows, filter, search]);

  const summary = useMemo(() => {
    const invited = guests.length;
    const seats = guests.reduce((sum, g) => sum + (Number(g.numberOfSeats) || 0), 0);
    const attending = guests.filter((g) => g.rsvpStatus === "attending").length;
    const declined = guests.filter((g) => g.rsvpStatus === "declined").length;
    const pending = Math.max(0, invited - attending - declined);
    const confirmedAttendees = rsvps.reduce(
      (sum, r) => sum + (r.attending ? Number(r.numberAttending) || 0 : 0),
      0,
    );
    return { invited, seats, attending, declined, pending, confirmedAttendees };
  }, [guests, rsvps]);

  function handleExport() {
    const headers = ["Guest", "Seats", "Table", "Status", "Attending", "Guest Names", "Dietary", "Special", "Message", "Submitted"];
    const csvRows = filtered.map((r) => [
      r.name,
      r.seats,
      r.tableNumber,
      r.status,
      r.numberAttending,
      r.guestNames,
      r.dietary,
      r.special,
      r.message,
      r.submittedAt?.toDate ? r.submittedAt.toDate().toISOString() : "",
    ]);
    downloadCsv("rsvps.csv", toCsv(headers, csvRows));
  }

  if (!ready.guests || !ready.rsvps) return <Loader label="Loading RSVPs…" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Invited" value={summary.invited} />
        <StatCard label="Seats" value={summary.seats} />
        <StatCard label="Attending" value={summary.attending} tone="good" />
        <StatCard label="Declined" value={summary.declined} tone="bad" />
        <StatCard label="Pending" value={summary.pending} tone="warn" />
        <StatCard label="Confirmed attendees" value={summary.confirmedAttendees} tone="good" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            aria-label="Search RSVPs"
            className="h-10 w-48 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-border px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary"
          >
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No RSVPs found" description="Responses will appear here as guests reply." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attending</th>
                <th className="px-4 py-3">Names</th>
                <th className="px-4 py-3">Dietary</th>
                <th className="px-4 py-3">Special</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.seats}</td>
                  <td className="px-4 py-3">{r.tableNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge status={r.status} />
                  </td>
                  <td className="px-4 py-3">{r.numberAttending}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.guestNames || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.dietary || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.special || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.submittedAt?.toDate ? formatWeddingDate(r.submittedAt.toDate().toISOString()) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}