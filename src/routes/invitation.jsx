import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GuestGate } from "@/components/wedding/GuestGate";
import { GuestNav } from "@/components/wedding/GuestNav";
import { Ornament, Monogram } from "@/components/wedding/Ornament";
import { downloadInvitationPdf } from "@/utils/pdf";
import { formatWeddingDate, isPastDeadline } from "@/utils/format";

export const Route = createFileRoute("/invitation")({
  head: () => ({
    meta: [
      { title: "Your Invitation — Wedding Invitation & RSVP" },
      { name: "description", content: "Your personalised wedding invitation with all the details of the day." },
      { property: "og:title", content: "Your Invitation" },
      { property: "og:description", content: "Your personalised wedding invitation with all the details of the day." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitationRoute,
});

function InvitationRoute() {
  return <GuestGate>{(ctx) => <InvitationPage {...ctx} />}</GuestGate>;
}

function Detail({ label, children }) {
  if (!children) return null;
  return (
    <div className="text-center">
      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-xl text-foreground">{children}</p>
    </div>
  );
}

function DressCodeDetail({ label, value, imageUrl }) {
  if (!value) return null;
  return (
    <div className="text-center">
      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-xl text-foreground">{value}</p>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Dress code inspiration"
          loading="lazy"
          className="mx-auto mt-3 h-20 w-20 rounded-full border border-gold/50 object-cover shadow-sm"
        />
      ) : null}
    </div>
  );
}

function InvitationPage({ guest, settings, signOut }) {
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");
  const deadlinePassed = isPastDeadline(settings.rsvpDeadline);
  const rsvpOpen = settings.rsvpEnabled !== false && !deadlinePassed;
  const hasBackground = Boolean(settings.backgroundImageUrl);
  const mapsUrl = settings.venueAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${settings.venueName || ""} ${settings.venueAddress}`.trim(),
      )}`
    : "";

  async function handleInvitationDownload() {
    setError("");
    setDownloading("invitation");
    try {
      if (settings.invitationPdfUrl) {
        const stillExists = await fetch(settings.invitationPdfUrl, { method: "HEAD" })
          .then((res) => res.ok)
          .catch(() => false);

        if (stillExists) {
          window.open(settings.invitationPdfUrl, "_blank", "noopener");
          return;
        }
        // The uploaded PDF was removed from storage but the URL is still
        // saved in settings — fall back to generating one on the fly
        // instead of sending the guest to a 404 page.
      }
      await downloadInvitationPdf(settings, guest);
    } catch {
      setError("We couldn't prepare that download. Please try again.");
    } finally {
      setDownloading("");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-20">
      <div
        className={
          hasBackground
            ? "absolute inset-0 bg-no-repeat bg-cover bg-center bg-fixed"
            : "absolute inset-0 surface-paper"
        }
        style={hasBackground ? { backgroundImage: `url(${settings.backgroundImageUrl})` } : undefined}
        aria-hidden="true"
      />
      {hasBackground ? (
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/50 to-background/70"
          aria-hidden="true"
        />
      ) : null}

      <div className="relative">
        <GuestNav guest={guest} onSignOut={signOut} />

        <main className="mx-auto max-w-3xl px-4">
          <section className="animate-rise mt-8 rounded-2xl border border-gold/40 bg-white/85 p-1 shadow-[0_30px_80px_-35px_rgba(60,70,55,0.55)] backdrop-blur-md">
            <div className="rounded-xl border border-border/60 px-5 py-12 text-center sm:px-12 sm:py-16">
              {settings.invitationImageUrl ? (
                <img
                  src={settings.invitationImageUrl}
                  alt="Wedding invitation artwork"
                  loading="lazy"
                  className="mx-auto mb-10 max-h-72 w-full rounded-lg object-cover shadow-md"
                />
              ) : (
                <Monogram bride={settings.brideName} groom={settings.groomName} />
              )}

              <p className="mt-8 text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground">
                Dear {guest.firstName} {guest.surname}
              </p>
              <Ornament className="my-6" />
              <h1 className="font-script text-5xl leading-tight text-primary sm:text-7xl">
                {settings.brideName || "Bride"}
                <span className="mx-3 font-display text-3xl text-gold">&</span>
                {settings.groomName || "Groom"}
              </h1>
              <p className="mt-6 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Request the pleasure of your company
              </p>
              <p className="mt-6 font-display text-2xl text-foreground sm:text-3xl">
                {formatWeddingDate(settings.weddingDate) || "Date to be confirmed"}
              </p>

              {settings.weddingMessage ? (
                <p className="mx-auto mt-8 max-w-md text-balance-pretty text-sm leading-relaxed text-muted-foreground">
                  {settings.weddingMessage}
                </p>
              ) : null}

              <Ornament className="my-10" />

              <div className="grid gap-8 sm:grid-cols-2">
                <Detail label="Ceremony">{settings.ceremonyTime}</Detail>
                <Detail label="Reception">{settings.receptionTime}</Detail>
                <Detail label="Venue">{settings.venueName}</Detail>
                <DressCodeDetail
                  label="Dress code"
                  value={settings.dressCode}
                  imageUrl={settings.dressCodeImageUrl}
                />
              </div>

              <div className="mt-10 rounded-lg bg-secondary/60 px-6 py-5">
                <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Reserved for you</p>
                <p className="mt-2 font-display text-xl">
                  {guest.numberOfSeats} seat{guest.numberOfSeats > 1 ? "s" : ""}
                  {guest.plusOneAllowed ? " · plus one welcome" : ""}
                </p>
              </div>
            </div>
          </section>

          {settings.venueAddress ? (
            <section className="animate-soft mt-8 rounded-2xl border border-border/60 bg-white/85 p-8 text-center backdrop-blur-md">
              <h2 className="font-display text-2xl">Finding us</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{settings.venueAddress}</p>
              {mapsUrl ? (
                
                <a  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block rounded-md border border-gold/60 px-6 py-3 text-xs uppercase tracking-[0.3em] text-primary transition hover:bg-secondary"
                >
                  Open in maps
                </a>
              ) : null}
            </section>
          ) : null}

          <section className="animate-soft mt-8 rounded-2xl border border-border/60 bg-white/85 p-8 text-center backdrop-blur-md">
            <h2 className="font-display text-2xl">RSVP</h2>
            {rsvpOpen ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  {guest.rsvpStatus === "pending"
                    ? "Kindly let us know if you will be joining us."
                    : "Your RSVP has been received. You may still update it."}
                  {settings.rsvpDeadline ? ` Please respond by ${formatWeddingDate(settings.rsvpDeadline)}.` : ""}
                </p>
                <Link
                  to="/rsvp"
                  className="mt-6 inline-block rounded-md bg-primary px-8 py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-primary/90"
                >
                  {guest.rsvpStatus === "pending" ? "Respond now" : "Update RSVP"}
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {deadlinePassed
                  ? "The RSVP deadline has passed. Please contact the couple directly with any changes."
                  : "RSVPs are currently closed."}
              </p>
            )}
          </section>

          <section className="animate-soft mt-8 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleInvitationDownload}
              disabled={downloading === "invitation"}
              className="rounded-md border border-gold/60 bg-white/85 px-6 py-5 text-xs uppercase tracking-[0.3em] text-primary backdrop-blur-md transition hover:bg-white disabled:opacity-60"
            >
              {downloading === "invitation" ? "Preparing download…" : "Download invitation"}
            </button>
            {settings.programPublished ? (
              <Link
                to="/program"
                className="rounded-md border border-gold/60 bg-white/85 px-6 py-5 text-center text-xs uppercase tracking-[0.3em] text-primary backdrop-blur-md transition hover:bg-white"
              >
                Wedding program
              </Link>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-white/70 px-6 py-5 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground backdrop-blur-md">
                Program coming soon
              </div>
            )}
          </section>

          {error ? (
            <p role="alert" className="mt-6 text-center text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}