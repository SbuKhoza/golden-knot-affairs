import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, Loader } from "@/components/common/Loader";
import { approveGuest, isGuestApproved, sortGuestsAlphabetically, subscribeToGuests } from "@/services/guestService";
import { announceWelcome } from "@/services/welcomeService";
import { guestIdFromQr } from "@/utils/guestQr";
import { friendlyError } from "@/utils/format";

const FILTERS = [
  ["all", "All"],
  ["waiting", "Not yet approved"],
  ["approved", "Approved"],
];

function fullName(g) {
  return [g.firstName, g.surname].filter(Boolean).join(" ");
}

function timeOf(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  return date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

/**
 * Entrance check-in: scan a guest's QR or tap Approve in the list.
 * Read-only apart from approving — it never edits or creates guests.
 */
export function CheckInPanel() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("scan");
  const [lastApproved, setLastApproved] = useState(null);

  useEffect(
    () =>
      subscribeToGuests(
        (data) => {
          setGuests(sortGuestsAlphabetically(data));
          setLoading(false);
        },
        () => {
          setLoadError("We couldn't load the guest list right now.");
          setLoading(false);
        },
      ),
    [],
  );

  const approvedCount = guests.filter(isGuestApproved).length;

  // Every new approval (scan or button) goes to the secondary welcome screen too.
  function handleApproved(guest) {
    setLastApproved(guest);
    announceWelcome(guest);
  }

  if (loading) return <Loader label="Loading guests…" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-2 rounded-md border border-border bg-card p-1 sm:inline-grid sm:w-auto">
          {[
            ["scan", "Scan QR"],
            ["list", "Guest list"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`rounded px-5 py-3 text-xs uppercase tracking-[0.2em] transition sm:py-2 ${
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground sm:text-right">
          <span className="font-display text-xl text-foreground">{approvedCount}</span> of {guests.length} invitations approved
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground sm:text-right">
        <a href="/display" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
          Open the guest welcome screen ↗
        </a>{" "}
        on the TV or second monitor.
      </p>

      {loadError ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {tab === "scan" ? (
        <Scanner lastApproved={lastApproved} onResult={handleApproved} />
      ) : (
        <GuestList guests={guests} onApproved={handleApproved} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scanner                                                             */
/* ------------------------------------------------------------------ */

function Scanner({ onResult }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const busyRef = useRef(false);
  const lastScanRef = useRef({ id: "", at: 0 });
  const [running, setRunning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [result, setResult] = useState(null);

  const stop = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* already stopped */
    }
    controlsRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const handleScan = useCallback(
    async (text) => {
      const id = guestIdFromQr(text);
      const now = Date.now();
      // Ignore the same code being re-read by the camera for a few seconds.
      if (id && lastScanRef.current.id === id && now - lastScanRef.current.at < 4000) return;
      if (busyRef.current) return;
      busyRef.current = true;
      lastScanRef.current = { id: id || String(text), at: now };

      try {
        if (!id) {
          setResult({ kind: "invalid" });
          return;
        }
        const outcome = await approveGuest(id, "qr");
        if (!outcome) {
          setResult({ kind: "unknown" });
          return;
        }
        setResult({ kind: outcome.alreadyApproved ? "already" : "approved", guest: outcome.guest });
        if (!outcome.alreadyApproved) onResult?.(outcome.guest);
        if (navigator.vibrate) navigator.vibrate(outcome.alreadyApproved ? [80, 60, 80] : 120);
      } catch (err) {
        setResult({ kind: "error", message: friendlyError(err, "We couldn't check that code. Please try again.") });
      } finally {
        busyRef.current = false;
      }
    },
    [onResult],
  );

  async function start() {
    setCameraError("");
    setResult(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("unsupported");
      }
      // Loaded on demand: the camera library only exists in the browser.
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoRef.current,
        (scan) => {
          if (scan) handleScan(scan.getText());
        },
      );
      setRunning(true);
    } catch (err) {
      const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      setCameraError(
        denied
          ? "Camera access was blocked. Allow camera permission for this site in your browser settings, then try again."
          : "We couldn't start the camera. Make sure this page is opened over https and that no other app is using the camera.",
      );
    }
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <video ref={videoRef} muted playsInline className={`size-full object-cover ${running ? "" : "invisible"}`} />
          {running ? (
            <div aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-gold/80" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
              Camera is off
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {running ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-md border border-border px-6 py-3 text-xs uppercase tracking-[0.25em] transition hover:bg-secondary"
          >
            Stop camera
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className="rounded-md bg-primary px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-primary-foreground transition hover:bg-primary/90"
          >
            Start scanning
          </button>
        )}
      </div>

      {cameraError ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {cameraError}
        </p>
      ) : null}

      <ScanResult result={result} />
    </section>
  );
}

function ScanResult({ result }) {
  if (!result) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Point the camera at a guest’s entry QR. Valid guests are approved automatically.
      </p>
    );
  }

  const tones = {
    approved: ["border-primary/50 bg-primary/10", "Approved — welcome in"],
    already: ["border-gold/60 bg-gold/15", "Already approved"],
    unknown: ["border-destructive/40 bg-destructive/10", "Guest not found"],
    invalid: ["border-destructive/40 bg-destructive/10", "Not a wedding entry QR"],
    error: ["border-destructive/40 bg-destructive/10", "Something went wrong"],
  };
  const [tone, title] = tones[result.kind];
  const guest = result.guest;

  return (
    <div role="status" aria-live="assertive" className={`rounded-2xl border p-6 text-center ${tone}`}>
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
      {guest ? (
        <>
          <p className="mt-3 font-display text-3xl">{fullName(guest)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {guest.numberOfSeats ?? 1} seat{(guest.numberOfSeats ?? 1) > 1 ? "s" : ""}
            {guest.tableNumber ? ` · Table ${guest.tableNumber}` : ""}
            {guest.rsvpStatus ? ` · RSVP ${guest.rsvpStatus}` : ""}
          </p>
          {result.kind === "already" && timeOf(guest.approvedAt || guest.checkedInAt) ? (
            <p className="mt-2 text-sm">First approved at {timeOf(guest.approvedAt || guest.checkedInAt)}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm">
          {result.kind === "unknown" && "This code doesn’t match anyone on the guest list."}
          {result.kind === "invalid" && "This QR wasn’t issued by the invitation site."}
          {result.kind === "error" && result.message}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Guest list (read-only + Approve)                                    */
/* ------------------------------------------------------------------ */

function GuestList({ guests, onApproved }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    let list = sortGuestsAlphabetically(guests);
    if (filter === "approved") list = list.filter(isGuestApproved);
    if (filter === "waiting") list = list.filter((g) => !isGuestApproved(g));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((g) => `${g.firstName} ${g.surname} ${g.tableNumber || ""}`.toLowerCase().includes(q));
    return list;
  }, [guests, filter, search]);

  async function handleApprove(guest) {
    setError("");
    setPendingId(guest.id);
    try {
      const outcome = await approveGuest(guest.id, "manual");
      if (outcome && !outcome.alreadyApproved) onApproved?.(outcome.guest);
    } catch (err) {
      setError(friendlyError(err, "We couldn't approve that guest. Please try again."));
    } finally {
      setPendingId("");
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or table…"
          aria-label="Search guests"
          className="h-14 w-full rounded-md border border-input bg-background px-4 text-base outline-none focus:ring-2 focus:ring-ring/40 sm:h-12"
        />
        <div className="grid grid-cols-3 gap-2">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`h-11 rounded-md border px-2 text-center text-xs leading-tight transition ${
                filter === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState title="No guests found" description="Try a different search or filter." />
      ) : (
        <>
          {/* Phones: one card per guest */}
          <ul className="space-y-3 md:hidden">
            {visible.map((g) => {
              const approved = isGuestApproved(g);
              const needs = [g.dietaryRequirements, g.specialRequirements].filter(Boolean).join(" · ");
              const seats = g.numberOfSeats ?? 1;
              return (
                <li key={g.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-display text-lg leading-snug">{fullName(g)}</p>
                    {approved ? (
                      <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">
                        ✓ {timeOf(g.approvedAt || g.checkedInAt) || "Approved"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {seats} seat{seats > 1 ? "s" : ""}
                    {g.tableNumber ? ` · Table ${g.tableNumber}` : ""}
                    {` · RSVP ${g.rsvpStatus || "pending"}`}
                  </p>
                  {needs ? <p className="mt-1 break-words text-sm text-muted-foreground">{needs}</p> : null}
                  {!approved ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(g)}
                      disabled={pendingId === g.id}
                      className="mt-4 h-12 w-full rounded-md bg-primary text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                    >
                      {pendingId === g.id ? "Approving…" : "Approve"}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* Tablets and desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Seats</th>
                  <th className="px-4 py-3 font-medium">Table</th>
                  <th className="px-4 py-3 font-medium">RSVP</th>
                  <th className="px-4 py-3 font-medium">Diet / needs</th>
                  <th className="px-4 py-3 text-right font-medium">Approved</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => {
                  const approved = isGuestApproved(g);
                  const needs = [g.dietaryRequirements, g.specialRequirements].filter(Boolean).join(" · ");
                  return (
                    <tr key={g.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-medium">{fullName(g)}</td>
                      <td className="px-4 py-3">{g.numberOfSeats ?? 1}</td>
                      <td className="px-4 py-3">{g.tableNumber || "—"}</td>
                      <td className="px-4 py-3 capitalize">{g.rsvpStatus || "pending"}</td>
                      <td className="max-w-[14rem] px-4 py-3 text-muted-foreground">{needs || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {approved ? (
                          <span className="inline-flex items-center gap-2 text-primary">
                            <span aria-hidden="true">✓</span>
                            <span>{timeOf(g.approvedAt || g.checkedInAt) || "Approved"}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApprove(g)}
                            disabled={pendingId === g.id}
                            className="rounded-md bg-primary px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                          >
                            {pendingId === g.id ? "Approving…" : "Approve"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
