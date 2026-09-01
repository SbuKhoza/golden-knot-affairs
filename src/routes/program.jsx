import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GuestGate } from "@/components/wedding/GuestGate";
import { GuestNav } from "@/components/wedding/GuestNav";
import { Ornament } from "@/components/wedding/Ornament";
import { downloadProgramPdf } from "@/utils/pdf";

export const Route = createFileRoute("/program")({
  head: () => ({
    meta: [
      { title: "Wedding Program — Order of the Day" },
      { name: "description", content: "The order of the day for our wedding celebration." },
      { property: "og:title", content: "Wedding Program" },
      { property: "og:description", content: "The order of the day for our wedding celebration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgramRoute,
});

function ProgramRoute() {
  return <GuestGate loadingLabel="Loading the program…">{(ctx) => <ProgramPage {...ctx} />}</GuestGate>;
}

function ProgramPage({ guest, settings, signOut }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const items = settings.programItems || [];

  async function handleDownload() {
    setError("");
    setBusy(true);
    try {
      if (settings.programPdfUrl) window.open(settings.programPdfUrl, "_blank", "noopener");
      else await downloadProgramPdf(settings);
    } catch {
      setError("We couldn't prepare that download. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-paper min-h-screen pb-20">
      <GuestNav guest={guest} onSignOut={signOut} />
      <main className="mx-auto max-w-2xl px-4">
        {!settings.programPublished ? (
          <section className="animate-rise mt-16 rounded-2xl border border-border/60 bg-card/80 p-10 text-center">
            <h1 className="font-display text-3xl">The program is on its way</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The order of the day hasn't been published yet. Please check back closer to the wedding.
            </p>
            <Link to="/invitation" className="mt-8 inline-block text-xs uppercase tracking-[0.3em] text-primary underline underline-offset-8">
              Back to invitation
            </Link>
          </section>
        ) : (
          <section className="animate-rise mt-8 rounded-2xl border border-gold/40 bg-card/85 p-1">
            <div className="rounded-xl border border-border/60 px-5 py-12 sm:px-10">
              <h1 className="text-center font-display text-3xl">Order of the Day</h1>
              <Ornament className="my-8" />

              {items.length ? (
                <ol className="space-y-6">
                  {items.map((item, index) => (
                    <li key={`${item.time}-${index}`} className="flex gap-5 border-b border-border/50 pb-5 last:border-0">
                      <span className="w-20 shrink-0 font-display text-lg text-gold">{item.time}</span>
                      <div>
                        <p className="font-display text-xl text-foreground">{item.event}</p>
                        {item.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  The full program is available as a download below.
                </p>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={busy}
                className="mt-10 w-full rounded-md bg-primary py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Preparing download…" : "Download wedding program"}
              </button>
              {error ? (
                <p role="alert" className="mt-4 text-center text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
