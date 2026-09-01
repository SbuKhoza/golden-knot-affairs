import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GuestGate } from "@/components/wedding/GuestGate";
import { GuestNav } from "@/components/wedding/GuestNav";
import { Ornament } from "@/components/wedding/Ornament";
import { Loader } from "@/components/common/Loader";
import { getRsvpForGuest, submitRsvp } from "@/services/rsvpService";
import { formatWeddingDate, friendlyError, isPastDeadline } from "@/utils/format";

export const Route = createFileRoute("/rsvp")({
  head: () => ({
    meta: [
      { title: "RSVP — Will You Be Joining Us?" },
      { name: "description", content: "Let the couple know whether you'll be celebrating with them." },
      { property: "og:title", content: "RSVP" },
      { property: "og:description", content: "Let the couple know whether you'll be celebrating with them." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RsvpRoute,
});

function RsvpRoute() {
  return <GuestGate loadingLabel="Loading your RSVP…">{(ctx) => <RsvpPage {...ctx} />}</GuestGate>;
}

const inputClass =
  "h-12 w-full rounded-md border border-input bg-background px-4 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40";

function RsvpPage({ guest, settings, reload, signOut }) {
  const seats = Math.max(1, Number(guest.numberOfSeats) || 1);
  const deadlinePassed = isPastDeadline(settings.rsvpDeadline);
  const rsvpOpen = settings.rsvpEnabled !== false && !deadlinePassed;

  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [attending, setAttending] = useState(null);
  const [numberAttending, setNumberAttending] = useState(seats);
  const [guestNames, setGuestNames] = useState(() => Array.from({ length: seats }, () => ""));
  const [dietary, setDietary] = useState("");
  const [special, setSpecial] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getRsvpForGuest(guest.id)
      .then((found) => {
        if (!active) return;
        if (found) {
          setExisting(found);
          setAttending(found.attending);
          setNumberAttending(found.numberAttending || (found.attending ? 1 : 0));
          setGuestNames(
            Array.from({ length: seats }, (_, i) => (found.guestNames || [])[i] || ""),
          );
          setDietary(found.dietaryRequirements || "");
          setSpecial(found.specialRequirements || "");
          setMessage(found.message || "");
        } else {
          setGuestNames(
            Array.from({ length: seats }, (_, i) =>
              i === 0 ? `${guest.firstName} ${guest.surname}` : i === 1 ? guest.plusOneName || "" : "",
            ),
          );
        }
      })
      .catch(() => setError("We couldn't load your RSVP right now."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [guest, seats]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (attending === null) {
      setError("Please let us know whether you'll be joining us.");
      return;
    }
    if (attending && (numberAttending < 1 || numberAttending > seats)) {
      setError(`You can RSVP for between 1 and ${seats} guest${seats > 1 ? "s" : ""}.`);
      return;
    }
    setSubmitting(true);
    try {
      const saved = await submitRsvp(guest, {
        attending,
        numberAttending,
        guestNames: attending ? guestNames.slice(0, numberAttending) : [],
        dietaryRequirements: dietary,
        specialRequirements: special,
        message,
      });
      setExisting(saved);
      setConfirmation(saved);
      setEditing(false);
      reload();
    } catch (err) {
      setError(friendlyError(err, "Your RSVP couldn't be submitted. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const shell = (children) => (
    <div className="surface-paper min-h-screen pb-20">
      <GuestNav guest={guest} onSignOut={signOut} />
      <main className="mx-auto max-w-2xl px-4">{children}</main>
    </div>
  );

  if (loading) return shell(<Loader label="Loading your RSVP…" />);

  if (confirmation) {
    return shell(
      <section className="animate-rise mt-12 rounded-2xl border border-gold/40 bg-card/85 p-10 text-center">
        <Ornament className="mb-8" />
        <h1 className="font-script text-4xl text-primary sm:text-5xl">
          {confirmation.attending ? "We can't wait to celebrate with you!" : "Thank you for letting us know."}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {confirmation.attending
            ? `We have reserved ${confirmation.numberAttending} seat${confirmation.numberAttending > 1 ? "s" : ""} in your name.`
            : "You will be missed."}
        </p>
        <Ornament className="mt-8" />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/invitation"
            className="rounded-md bg-primary px-8 py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground"
          >
            Back to invitation
          </Link>
          <button
            type="button"
            onClick={() => {
              setConfirmation(null);
              setEditing(true);
            }}
            className="rounded-md border border-gold/60 px-8 py-4 text-xs uppercase tracking-[0.3em] text-primary"
          >
            Update RSVP
          </button>
        </div>
      </section>,
    );
  }

  if (!rsvpOpen) {
    return shell(
      <section className="animate-rise mt-16 rounded-2xl border border-border/60 bg-card/80 p-10 text-center">
        <h1 className="font-display text-3xl">RSVPs are closed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {deadlinePassed
            ? `The RSVP deadline (${formatWeddingDate(settings.rsvpDeadline)}) has passed. Please contact the couple directly.`
            : "The couple has paused RSVPs for now."}
        </p>
        {existing ? (
          <p className="mt-6 text-sm">
            Your response: <strong>{existing.attending ? "Attending" : "Not attending"}</strong>
            {existing.attending ? ` · ${existing.numberAttending} guest(s)` : ""}
          </p>
        ) : null}
        <Link to="/invitation" className="mt-8 inline-block text-xs uppercase tracking-[0.3em] text-primary underline underline-offset-8">
          Back to invitation
        </Link>
      </section>,
    );
  }

  if (existing && !editing) {
    return shell(
      <section className="animate-rise mt-12 rounded-2xl border border-gold/40 bg-card/85 p-10 text-center">
        <h1 className="font-display text-3xl">Your RSVP has been received.</h1>
        <Ornament className="my-8" />
        <p className="text-sm text-muted-foreground">
          {existing.attending
            ? `Joyfully accepting for ${existing.numberAttending} guest${existing.numberAttending > 1 ? "s" : ""}.`
            : "Regretfully declining."}
        </p>
        {existing.attending && (existing.guestNames || []).length ? (
          <p className="mt-2 text-sm text-muted-foreground">{existing.guestNames.join(", ")}</p>
        ) : null}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md bg-primary px-8 py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground"
          >
            Update RSVP
          </button>
          <Link
            to="/invitation"
            className="rounded-md border border-gold/60 px-8 py-4 text-xs uppercase tracking-[0.3em] text-primary"
          >
            Back to invitation
          </Link>
        </div>
      </section>,
    );
  }

  return shell(
    <section className="animate-rise mt-8 rounded-2xl border border-gold/40 bg-card/85 p-1">
      <form onSubmit={handleSubmit} className="rounded-xl border border-border/60 px-5 py-10 sm:px-10" noValidate>
        <h1 className="text-center font-display text-3xl">Will you be joining us?</h1>
        <Ornament className="my-8" />

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Attendance</legend>
          {[
            { value: true, label: "Joyfully accepts" },
            { value: false, label: "Regretfully declines" },
          ].map((option) => (
            <label
              key={String(option.value)}
              className={`cursor-pointer rounded-md border px-6 py-5 text-center text-xs uppercase tracking-[0.25em] transition ${
                attending === option.value
                  ? "border-gold bg-secondary text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <input
                type="radio"
                name="attending"
                className="sr-only"
                checked={attending === option.value}
                onChange={() => {
                  setAttending(option.value);
                  if (!option.value) setNumberAttending(0);
                  else setNumberAttending((n) => Math.min(seats, Math.max(1, n || 1)));
                }}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        {attending ? (
          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="count" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Number of guests attending (max {seats})
              </label>
              <select
                id="count"
                value={numberAttending}
                onChange={(e) => setNumberAttending(Number(e.target.value))}
                className={inputClass}
              >
                {Array.from({ length: seats }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {Array.from({ length: numberAttending }, (_, i) => (
              <div key={i}>
                <label htmlFor={`guest-${i}`} className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Guest {i + 1} name
                </label>
                <input
                  id={`guest-${i}`}
                  value={guestNames[i] || ""}
                  onChange={(e) =>
                    setGuestNames((prev) => {
                      const next = [...prev];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  className={inputClass}
                />
              </div>
            ))}

            <div>
              <label htmlFor="dietary" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Dietary requirements
              </label>
              <textarea
                id="dietary"
                rows={2}
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-4 text-base outline-none focus:border-gold focus:ring-2 focus:ring-ring/40"
              />
            </div>

            <div>
              <label htmlFor="special" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Special requirements
              </label>
              <textarea
                id="special"
                rows={2}
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-4 text-base outline-none focus:border-gold focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <label htmlFor="message" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
            A message to the couple (optional)
          </label>
          <textarea
            id="message"
            rows={3}
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border border-input bg-background p-4 text-base outline-none focus:border-gold focus:ring-2 focus:ring-ring/40"
          />
        </div>

        {error ? (
          <p role="alert" className="mt-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-8 w-full rounded-md bg-primary py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Submitting RSVP…" : existing ? "Update my RSVP" : "Send my RSVP"}
        </button>
      </form>
    </section>,
  );
}
