import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Loader } from "@/components/common/Loader";
import { defaultSettings, saveSettings, subscribeToSettings } from "@/services/settingsService";
import { uploadWeddingFile, validateFile } from "@/services/storageService";
import { fileToCompressedDataUrl } from "@/utils/image";
import { friendlyError } from "@/utils/format";
import { PDF_COLOR_SCHEMES, PDF_TEMPLATES } from "@/utils/pdfThemes";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Wedding Settings — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <AdminShell title="Wedding Settings">
      <SettingsPage />
    </AdminShell>
  );
}

const inputClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40";
const labelClass = "mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground";

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label className={labelClass} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

// The compressed base64 copy for an image field like "invitationImageUrl"
// must be stored as "invitationImageData" — NOT "invitationImageUrlData" —
// because that's the exact field name pdf.js reads via
// resolveImage(settings.invitationImageData, settings.invitationImageUrl, ...).
// Naively appending "Data" to the URL key (`${key}Data`) produces the wrong
// field name and silently breaks the CORS-free PDF embed.
function dataKeyFor(urlKey) {
  return urlKey.endsWith("Url") ? `${urlKey.slice(0, -3)}Data` : `${urlKey}Data`;
}

function SettingsPage() {
  const [values, setValues] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const unsub = subscribeToSettings(
      (data) => {
        setValues(data);
        setLoading(false);
      },
      () => {
        setError("We couldn't load wedding settings.");
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  function update(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUpload(key, file, kind) {
    setError("");
    setNotice("");
    const problem = validateFile(file, kind);
    if (problem) {
      setError(problem);
      return;
    }
    setUploadingKey(key);
    try {
      const folder = kind === "pdf" ? "invitation" : "images";
      const url = await uploadWeddingFile(file, folder, kind);
      update(key, url);

      // For images, also stash a compressed base64 copy alongside the URL,
      // under the correctly-derived field name. The PDF generator embeds
      // this directly, sidestepping any CORS restrictions on the storage
      // bucket when it later tries to fetch the remote URL.
      if (kind === "image") {
        try {
          const dataUrl = await fileToCompressedDataUrl(file);
          update(dataKeyFor(key), dataUrl);
        } catch {
          // Non-fatal — PDF generation falls back to the stored URL.
        }
      }
    } catch (err) {
      setError(friendlyError(err, "We couldn't upload that file."));
    } finally {
      setUploadingKey("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await saveSettings(values);
      setNotice("Wedding settings saved.");
    } catch (err) {
      setError(friendlyError(err, "We couldn't save these settings."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader label="Loading settings…" />;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8" noValidate>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Couple</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Bride name" htmlFor="ws-bride">
            <input id="ws-bride" className={inputClass} value={values.brideName} onChange={(e) => update("brideName", e.target.value)} />
          </Field>
          <Field label="Groom name" htmlFor="ws-groom">
            <input id="ws-groom" className={inputClass} value={values.groomName} onChange={(e) => update("groomName", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Event details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Wedding date" htmlFor="ws-date">
            <input id="ws-date" type="date" className={inputClass} value={values.weddingDate} onChange={(e) => update("weddingDate", e.target.value)} />
          </Field>
          <Field label="Dress code" htmlFor="ws-dress">
            <input id="ws-dress" className={inputClass} value={values.dressCode} onChange={(e) => update("dressCode", e.target.value)} />
          </Field>
          <Field label="Ceremony time" htmlFor="ws-ceremony">
            <input id="ws-ceremony" className={inputClass} placeholder="14:30" value={values.ceremonyTime} onChange={(e) => update("ceremonyTime", e.target.value)} />
          </Field>
          <Field label="Reception time" htmlFor="ws-reception">
            <input id="ws-reception" className={inputClass} placeholder="17:00" value={values.receptionTime} onChange={(e) => update("receptionTime", e.target.value)} />
          </Field>
          <Field label="Venue name" htmlFor="ws-venue">
            <input id="ws-venue" className={inputClass} value={values.venueName} onChange={(e) => update("venueName", e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Venue address" htmlFor="ws-address">
            <textarea
              id="ws-address"
              rows={2}
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
              value={values.venueAddress}
              onChange={(e) => update("venueAddress", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Venue latitude (optional)" htmlFor="ws-venue-lat">
            <input
              id="ws-venue-lat"
              inputMode="decimal"
              placeholder="e.g. -26.204103"
              className={inputClass}
              value={values.venueLat}
              onChange={(e) => update("venueLat", e.target.value)}
            />
          </Field>
          <Field label="Venue longitude (optional)" htmlFor="ws-venue-lng">
            <input
              id="ws-venue-lng"
              inputMode="decimal"
              placeholder="e.g. 28.047304"
              className={inputClass}
              value={values.venueLng}
              onChange={(e) => update("venueLng", e.target.value)}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Add coordinates to make the venue address clickable on the invitation and PDF — it will open in the
          guest's maps app. Leave blank and the address just shows as text. You can find coordinates by opening the
          location in Google Maps, right-clicking the pin, and copying the numbers shown at the top.
        </p>

        <div className="mt-6 border-t border-border pt-4">
          <h3 className="font-display text-base">Reception venue</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Only needed if the reception is at a different place from the ceremony above, or if you'd like it
            called out separately.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Reception venue name" htmlFor="ws-reception-venue">
              <input
                id="ws-reception-venue"
                className={inputClass}
                value={values.receptionVenueName}
                onChange={(e) => update("receptionVenueName", e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Reception venue address" htmlFor="ws-reception-address">
              <textarea
                id="ws-reception-address"
                rows={2}
                className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
                value={values.receptionVenueAddress}
                onChange={(e) => update("receptionVenueAddress", e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Reception latitude (optional)" htmlFor="ws-reception-lat">
              <input
                id="ws-reception-lat"
                inputMode="decimal"
                placeholder="e.g. -26.107567"
                className={inputClass}
                value={values.receptionVenueLat}
                onChange={(e) => update("receptionVenueLat", e.target.value)}
              />
            </Field>
            <Field label="Reception longitude (optional)" htmlFor="ws-reception-lng">
              <input
                id="ws-reception-lng"
                inputMode="decimal"
                placeholder="e.g. 28.056702"
                className={inputClass}
                value={values.receptionVenueLng}
                onChange={(e) => update("receptionVenueLng", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="mt-4">
          <Field label="Dress code image (optional)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleUpload("dressCodeImageUrl", e.target.files[0], "image")}
              disabled={uploadingKey === "dressCodeImageUrl"}
              className="text-sm"
            />
            {uploadingKey === "dressCodeImageUrl" ? (
              <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>
            ) : values.dressCodeImageUrl ? (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={values.dressCodeImageUrl}
                  alt=""
                  className="h-20 w-20 rounded-full border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    update("dressCodeImageUrl", "");
                    update(dataKeyFor("dressCodeImageUrl"), "");
                  }}
                  className="text-xs text-destructive underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Invitation PDF look</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the layout and color palette used for the generated invitation PDF (guests can still download it
          from the invitation page).
        </p>

        <div className="mt-5">
          <p className={labelClass}>Template</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {PDF_TEMPLATES.map((tpl) => {
              const active = (values.pdfTemplate || "classic") === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => update("pdfTemplate", tpl.id)}
                  aria-pressed={active}
                  className={`rounded-lg border p-4 text-left transition ${
                    active ? "border-gold bg-secondary/60 ring-2 ring-gold/40" : "border-border hover:border-gold/50"
                  }`}
                >
                  <p className="font-display text-sm">{tpl.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <p className={labelClass}>Color combination</p>
          <div className="flex flex-wrap gap-3">
            {PDF_COLOR_SCHEMES.map((scheme) => {
              const active = (values.pdfColorScheme || "gold-cream") === scheme.id;
              return (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => update("pdfColorScheme", scheme.id)}
                  aria-pressed={active}
                  title={scheme.label}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
                    active ? "border-gold ring-2 ring-gold/40" : "border-border hover:border-gold/50"
                  }`}
                >
                  <span
                    className="size-5 rounded-full border border-black/10"
                    style={{
                      background: `linear-gradient(135deg, ${scheme.hex.accent} 50%, ${scheme.hex.surface} 50%)`,
                    }}
                    aria-hidden="true"
                  />
                  {scheme.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Invitation</h2>
        <div className="mt-4">
          <Field label="Wedding message" htmlFor="ws-message">
            <textarea
              id="ws-message"
              rows={3}
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
              value={values.weddingMessage}
              onChange={(e) => update("weddingMessage", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Invitation image">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleUpload("invitationImageUrl", e.target.files[0], "image")}
              disabled={uploadingKey === "invitationImageUrl"}
              className="text-sm"
            />
            {uploadingKey === "invitationImageUrl" ? (
              <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>
            ) : values.invitationImageUrl ? (
              <div className="mt-2 flex items-center gap-3">
                <img src={values.invitationImageUrl} alt="" className="h-24 w-24 rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    update("invitationImageUrl", "");
                    update(dataKeyFor("invitationImageUrl"), "");
                  }}
                  className="text-xs text-destructive underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </Field>
          <Field label="Background image">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleUpload("backgroundImageUrl", e.target.files[0], "image")}
              disabled={uploadingKey === "backgroundImageUrl"}
              className="text-sm"
            />
            {uploadingKey === "backgroundImageUrl" ? (
              <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>
            ) : values.backgroundImageUrl ? (
              <div className="mt-2 flex items-center gap-3">
                <img src={values.backgroundImageUrl} alt="" className="h-24 w-24 rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    update("backgroundImageUrl", "");
                    update(dataKeyFor("backgroundImageUrl"), "");
                  }}
                  className="text-xs text-destructive underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </Field>
          <Field label="Invitation PDF (optional)">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files[0] && handleUpload("invitationPdfUrl", e.target.files[0], "pdf")}
              disabled={uploadingKey === "invitationPdfUrl"}
              className="text-sm"
            />
            {uploadingKey === "invitationPdfUrl" ? (
              <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>
            ) : values.invitationPdfUrl ? (
              <div className="mt-2 flex items-center gap-3">
                
                 <a href={values.invitationPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline underline-offset-4"
                >
                  View current PDF
                </a>
                <button
                  type="button"
                  onClick={() => update("invitationPdfUrl", "")}
                  className="text-xs text-destructive underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">RSVP</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="RSVP deadline" htmlFor="ws-deadline">
            <input id="ws-deadline" type="date" className={inputClass} value={values.rsvpDeadline} onChange={(e) => update("rsvpDeadline", e.target.value)} />
          </Field>
          <label className="mt-6 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={values.rsvpEnabled !== false}
              onChange={(e) => update("rsvpEnabled", e.target.checked)}
              className="size-4 rounded border-input"
            />
            RSVPs open
          </label>
        </div>
      </section>

      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {notice ? <p className="text-sm text-primary">{notice}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-primary px-6 py-3.5 text-xs uppercase tracking-[0.25em] text-primary-foreground transition disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}