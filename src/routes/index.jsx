import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ornament } from "@/components/wedding/Ornament";
import { verifyGuest } from "@/services/guestService";
import { getSettings } from "@/services/settingsService";
import { saveGuestSession } from "@/hooks/useGuestSession";
import { formatWeddingDate, friendlyError } from "@/utils/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "You Are Invited — Wedding Invitation & RSVP" },
      {
        name: "description",
        content:
          "Enter your name and surname to open your personalised wedding invitation, RSVP and download the program.",
      },
      { property: "og:title", content: "You Are Invited — Wedding Invitation & RSVP" },
      {
        property: "og:description",
        content: "Open your personalised wedding invitation and RSVP.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings({ asGuest: true })
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!firstName.trim() || !surname.trim()) {
      setError("Please enter both your name and surname.");
      return;
    }
    setStatus("verifying");
    try {
      const guest = await verifyGuest({ firstName, surname, invitationCode });
      if (!guest) {
        setStatus("idle");
        setError(
          "We couldn't find an invitation matching those details. Please check the spelling of your name and surname and try again.",
        );
        return;
      }
      saveGuestSession(guest.id);
      navigate({ to: "/invitation" });
    } catch (err) {
      setStatus("idle");
      setError(friendlyError(err, "We couldn't check your invitation right now. Please try again."));
    }
  }

  const couple =
    settings && (settings.brideName || settings.groomName)
      ? `${settings.brideName} & ${settings.groomName}`
      : "";

  return (
    <main className="surface-paper flex min-h-screen items-center justify-center px-4 py-12">
      <section className="animate-rise w-full max-w-lg">
        <div className="relative rounded-2xl border border-gold/40 bg-card/80 p-1 shadow-[0_30px_80px_-40px_rgba(60,70,55,0.5)] backdrop-blur">
          <div className="rounded-xl border border-border/60 px-6 py-12 text-center sm:px-12">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Together with their families</p>
            <Ornament className="my-6" />
            <h1 className="font-script text-5xl leading-tight text-primary sm:text-6xl">
              {couple || "You Are Invited"}
            </h1>
            {couple ? (
              <p className="mt-3 font-display text-xl text-muted-foreground">You Are Invited</p>
            ) : null}
            {settings?.weddingDate ? (
              <p className="mt-4 text-sm uppercase tracking-[0.25em] text-muted-foreground">
                {formatWeddingDate(settings.weddingDate)}
              </p>
            ) : null}

            <p className="mx-auto mt-8 max-w-sm text-balance-pretty text-sm leading-relaxed text-muted-foreground">
              Please enter your name and surname to access your invitation.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left" noValidate>
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 w-full rounded-md border border-input bg-background px-4 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
                  required
                />
              </div>
              <div>
                <label htmlFor="surname" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Surname
                </label>
                <input
                  id="surname"
                  name="surname"
                  autoComplete="family-name"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="h-12 w-full rounded-md border border-input bg-background px-4 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
                  required
                />
              </div>

              {showCode ? (
                <div>
                  <label htmlFor="code" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Invitation code (optional)
                  </label>
                  <input
                    id="code"
                    name="code"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                    className="h-12 w-full rounded-md border border-input bg-background px-4 text-base uppercase tracking-[0.2em] outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCode(true)}
                  className="text-xs text-muted-foreground underline underline-offset-4 transition hover:text-primary"
                >
                  I have an invitation code
                </button>
              )}

              {error ? (
                <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "verifying"}
                className="h-13 mt-2 w-full rounded-md bg-primary py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {status === "verifying" ? "Verifying invitation…" : "View My Invitation"}
              </button>
            </form>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your details are only used to find your invitation.
        </p>
      </section>
    </main>
  );
}
