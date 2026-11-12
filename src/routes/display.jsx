import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader } from "@/components/common/Loader";
import { Ornament } from "@/components/wedding/Ornament";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { staffSignIn } from "@/services/authService";
import { getSettings } from "@/services/settingsService";
import { startWelcomeFeed } from "@/services/welcomeService";
import { useWelcomeState, welcomeStore } from "@/stores/welcomeStore";
import { formatWeddingDate, friendlyError } from "@/utils/format";

export const Route = createFileRoute("/display")({
  head: () => ({
    meta: [
      { title: "Guest Welcome Screen" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DisplayRoute,
});

/** Secondary screen (TV / projector): shows each guest as they are approved at the entrance. */
function DisplayRoute() {
  const { loading, user, role } = useAdminAuth();

  if (loading) return <Loader full label="Starting the welcome screen…" />;
  if (!user || !role) return <StaffSignIn />;
  return <WelcomeScreen />;
}

function StaffSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await staffSignIn(email, password);
    } catch (err) {
      setError(
        err?.code === "not-admin"
          ? "That account doesn't have admin or scanner access."
          : friendlyError(err, "We couldn't sign you in. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8" noValidate>
        <h1 className="text-center font-display text-2xl">Welcome screen sign in</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Sign in once on this screen.</p>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-md border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring/40"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-md border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        {error ? (
          <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-md bg-primary py-3.5 text-xs uppercase tracking-[0.25em] text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

const DISPLAY_MS = 7000;

function WelcomeScreen() {
  const { current } = useWelcomeState();
  const [settings, setSettings] = useState(null);
  const [feedError, setFeedError] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  // Live feed of approvals -> store.
  useEffect(() => {
    welcomeStore.reset();
    return startWelcomeFeed(() => setFeedError(true));
  }, []);

  // Every guest (and the Test guest) is shown for exactly one slot, then the
  // screen moves on to the next waiting guest or back to the live idle screen.
  // The timer is tied to the guest on screen, so new arrivals joining the queue
  // never restart or stretch it.
  const currentKey = current?.key;
  useEffect(() => {
    if (!currentKey) return undefined;
    const waiting = welcomeStore.getState().queue.length;
    const timer = window.setTimeout(() => welcomeStore.next(), waiting > 2 ? 4000 : DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [currentKey]);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  }

  function sendTest() {
    // One test at a time, so pressing Test repeatedly can't pile up a queue.
    const state = welcomeStore.getState();
    if (String(state.current?.key).startsWith("test-") || state.queue.some((a) => String(a.key).startsWith("test-"))) {
      return;
    }
    welcomeStore.enqueue({
      key: `test-${Date.now()}`,
      firstName: "Test",
      surname: "Guest",
      numberOfSeats: 2,
      tableNumber: "1",
    });
  }

  const couple =
    settings && (settings.brideName || settings.groomName) ? `${settings.brideName} & ${settings.groomName}` : "";

  return (
    <main className="surface-paper group relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 text-center">
      <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={sendTest}
          className="rounded-md border border-border bg-card/80 px-4 py-2 text-xs uppercase tracking-[0.2em] backdrop-blur"
        >
          Test
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-md border border-border bg-card/80 px-4 py-2 text-xs uppercase tracking-[0.2em] backdrop-blur"
        >
          Fullscreen
        </button>
      </div>

      {feedError ? (
        <p role="alert" className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          Live connection lost — check the internet connection and reload this page.
        </p>
      ) : null}

      {current ? (
        <section key={current.key} className="animate-rise w-full max-w-6xl" aria-live="assertive">
          <p className="text-[clamp(0.9rem,1.6vw,1.5rem)] uppercase tracking-[0.5em] text-muted-foreground">Welcome</p>
          <Ornament className="my-[clamp(1rem,3vw,2.5rem)]" />
          <h1 className="font-script text-[clamp(3.5rem,11vw,10rem)] leading-[1.15] text-primary">
            {current.firstName} {current.surname}
          </h1>
          <Ornament className="my-[clamp(1rem,3vw,2.5rem)]" />
          <p className="font-display text-[clamp(1.25rem,2.8vw,2.75rem)] text-foreground">
            We are so glad you are celebrating with us
          </p>
          {current.tableNumber ? (
            <p className="mt-[clamp(1rem,2.5vw,2rem)] text-[clamp(0.9rem,1.6vw,1.5rem)] uppercase tracking-[0.35em] text-muted-foreground">
              Table {current.tableNumber}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="animate-soft w-full max-w-6xl">
          <p className="text-[clamp(0.9rem,1.6vw,1.5rem)] uppercase tracking-[0.5em] text-muted-foreground">
            Welcome to the wedding of
          </p>
          <Ornament className="my-[clamp(1rem,3vw,2.5rem)]" />
          <h1 className="font-script text-[clamp(3.5rem,10vw,9rem)] leading-[1.15] text-primary">
            {couple || "Our Wedding"}
          </h1>
          {settings?.weddingDate ? (
            <p className="mt-6 text-[clamp(0.9rem,1.6vw,1.5rem)] uppercase tracking-[0.35em] text-muted-foreground">
              {formatWeddingDate(settings.weddingDate)}
            </p>
          ) : null}
        </section>
      )}
    </main>
  );
}