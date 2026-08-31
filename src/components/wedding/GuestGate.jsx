import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useGuestSession } from "@/hooks/useGuestSession";
import { getSettings } from "@/services/settingsService";
import { Loader } from "@/components/common/Loader";

/** Renders children only for a guest whose session has been re-validated. */
export function GuestGate({ children, loadingLabel = "Loading your invitation…" }) {
  const { guest, loading, reload, signOut } = useGuestSession();
  const [settings, setSettings] = useState(null);
  const [settingsError, setSettingsError] = useState("");

  useEffect(() => {
    if (!guest) return;
    getSettings({ asGuest: true })
      .then(setSettings)
      .catch(() => setSettingsError("We couldn't load the wedding details right now."));
  }, [guest]);

  if (loading || (guest && !settings && !settingsError)) {
    return (
      <main className="surface-paper min-h-screen">
        <Loader full label={loadingLabel} />
      </main>
    );
  }

  if (!guest) {
    return (
      <main className="surface-paper flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="font-display text-2xl">Your session has expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please enter your name and surname again.</p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-xs uppercase tracking-[0.3em] text-primary-foreground">
            Back to start
          </Link>
        </div>
      </main>
    );
  }

  if (settingsError) {
    return (
      <main className="surface-paper flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-sm text-destructive">{settingsError}</p>
      </main>
    );
  }

  return children({ guest, settings, reload, signOut });
}
