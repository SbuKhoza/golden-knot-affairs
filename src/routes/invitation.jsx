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

function InvitationPage({ guest, settings, signOut }) {
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");
  const deadlinePassed = isPastDeadline(settings.rsvpDeadline);
  const rsvpOpen = settings.rsvpEnabled !== false && !deadlinePassed;

  const venues = [
    {
      key: "ceremony",
      label: "Ceremony",
      time: settings.ceremonyTime,
      name: settings.ceremonyVenueName || settings.venueName || "",
      address: settings.ceremonyVenueAddress || settings.venueAddress || "",
    },
    {
      key: "reception",
      label: "Reception",
      time: settings.receptionTime,
      name: settings.receptionVenueName || "",
      address: settings.receptionVenueAddress || "",
    },
  ].filter((v) => v.name || v.address);

  const mapsFor = (venue) =>
    venue.address || venue.name
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${venue.name} ${venue.address}`.trim(),
        )}`
      : "";

  async function handleInvitationDownload() {
    setError("");
    setDownloading("invitation");
    try {
      if (settings.invitationPdfUrl) {
        window.open(settings.invitationPdfUrl, "_blank", "noopener");
      } else {
        await downloadInvitationPdf(settings, guest);
      }
    } catch {
      setError("We couldn't prepare that download. Please try again.");
    } finally {
      setDownloading("");
    }
  }

  return (
    <div className="surface-paper min-h-screen pb-20">
      <GuestNav guest={guest} onSignOut={signOut} />

      <main className="mx-auto max-w-3xl px-4">
        <section className="animate-rise mt-8 rounded-2xl border border-gold/40 bg-card/85 p-1 shadow-[0_30px_80px_-45px_rgba(60,70,55,0.55)]">
          <div className="rounded-xl border border-border/60 px-5 py-12 text-center sm:px-12 sm:py-16">
            {settings.invitationImageUrl ? (
              <img
                src={settings.invitationImageUrl}
                alt="Wedding invitation artwork"
                loading="lazy"
                className="mx-auto mb-10 max-h-72 w-full rounded-lg object-cover"
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
              <Detail label="Ceremony venue">
                {settings.ceremonyVenueName || settings.venueName}
              </Detail>
              <Detail label="Reception venue">{settings.receptionVenueName}</Detail>
              <Detail label="Dress code">{settings.dressCode}</Detail>
              <Detail label="Your table">{guest.tableNumber ? `Table ${guest.tableNumber}` : ""}</Detail>
            </div>

            <div className="mt-10 rounded-lg bg-secondary/60 px-6 py-5">
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Reserved for you</p>
              <p className="mt-2 font-display text-xl">
                {guest.numberOfSeats} seat{guest.numberOfSeats > 1 ? "s" : ""}
                {guest.plusOneAllowed ? " · plus one welcome" : ""}
              </p>
              {guest.tableNumber ? (
                <p className="mt-1 font-display text-lg text-primary">Table {guest.tableNumber}</p>
              ) : null}
            </div>
          </div>
        </section>

        {venues.length ? (
          <section className="animate-soft mt-8 grid gap-4 sm:grid-cols-2">
            {venues.map((venue) => (
              <div
                key={venue.key}
                className="rounded-2xl border border-border/60 bg-card/70 p-8 text-center"
              >
                <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">{venue.label}</p>
                <h2 className="mt-2 font-display text-2xl">{venue.name || venue.label}</h2>
                {venue.time ? <p className="mt-1 text-sm text-muted-foreground">{venue.time}</p> : null}
                {venue.address ? (
                  <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{venue.address}</p>
                ) : null}
                <a
                  href={mapsFor(venue)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block rounded-md border border-gold/60 px-6 py-3 text-xs uppercase tracking-[0.3em] text-primary transition hover:bg-secondary"
                >
                  Open in maps
                </a>
              </div>
            ))}
          </section>
        ) : null}

        <section className="animate-soft mt-8 rounded-2xl border border-border/60 bg-card/70 p-8 text-center">
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
            className="rounded-md border border-gold/60 bg-card px-6 py-5 text-xs uppercase tracking-[0.3em] text-primary transition hover:bg-secondary disabled:opacity-60"
          >
            {downloading === "invitation" ? "Preparing download…" : "Download invitation"}
          </button>
          {settings.programPublished ? (
            <Link
              to="/program"
              className="rounded-md border border-gold/60 bg-card px-6 py-5 text-center text-xs uppercase tracking-[0.3em] text-primary transition hover:bg-secondary"
            >
              Wedding program
            </Link>
          ) : (
            <div className="rounded-md border border-dashed border-border px-6 py-5 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
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
  );
}
