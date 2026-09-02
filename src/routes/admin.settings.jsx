import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Loader } from "@/components/common/Loader";
import { defaultSettings, saveSettings, subscribeToSettings } from "@/services/settingsService";
import { deleteWeddingFile, uploadWeddingFile, validateFile } from "@/services/storageService";
import { fileToCompressedDataUrl } from "@/utils/image";
import { friendlyError } from "@/utils/format";

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
  const [removingKey, setRemovingKey] = useState("");
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

  // Removing a file must (a) delete the object from Storage so it's really
  // gone, and (b) persist the cleared field(s) to Firestore right away —
  // not just local state — otherwise a refresh re-loads the old URL from
  // the still-unsaved document and the "removed" file appears to come back.
  async function handleRemove(urlKey) {
    setError("");
    setNotice("");
    const url = values[urlKey];
    const isImageUrlField = urlKey.endsWith("Url") && Object.prototype.hasOwnProperty.call(defaultSettings, dataKeyFor(urlKey));
    const dataKey = isImageUrlField ? dataKeyFor(urlKey) : null;
    const clearedFields = dataKey ? { [urlKey]: "", [dataKey]: "" } : { [urlKey]: "" };

    setRemovingKey(urlKey);
    setValues((prev) => ({ ...prev, ...clearedFields }));
    try {
      await deleteWeddingFile(url);
      await saveSettings(clearedFields);
    } catch (err) {
      setError(friendlyError(err, "We couldn't remove that file. Please try again."));
    } finally {
      setRemovingKey("");
    }
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
        </div>

        <div className="mt-6 rounded-lg border border-border/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ceremony</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Ceremony time" htmlFor="ws-ceremony">
              <input id="ws-ceremony" className={inputClass} placeholder="14:30" value={values.ceremonyTime} onChange={(e) => update("ceremonyTime", e.target.value)} />
            </Field>
            <Field label="Ceremony venue name" htmlFor="ws-ceremony-venue">
              <input id="ws-ceremony-venue" className={inputClass} value={values.ceremonyVenueName} onChange={(e) => update("ceremonyVenueName", e.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Ceremony venue address" htmlFor="ws-ceremony-address">
              <textarea
                id="ws-ceremony-address"
                rows={2}
                className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
                value={values.ceremonyVenueAddress}
                onChange={(e) => update("ceremonyVenueAddress", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border/60 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reception</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Reception time" htmlFor="ws-reception">
              <input id="ws-reception" className={inputClass} placeholder="17:00" value={values.receptionTime} onChange={(e) => update("receptionTime", e.target.value)} />
            </Field>
            <Field label="Reception venue name" htmlFor="ws-reception-venue">
              <input id="ws-reception-venue" className={inputClass} value={values.receptionVenueName} onChange={(e) => update("receptionVenueName", e.target.value)} />
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
                  onClick={() => handleRemove("dressCodeImageUrl")}
                  disabled={removingKey === "dressCodeImageUrl"}
                  className="text-xs text-destructive underline underline-offset-4 disabled:opacity-60"
                >
                  {removingKey === "dressCodeImageUrl" ? "Removing…" : "Remove"}
                </button>
              </div>
            ) : null}
          </Field>
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
                  onClick={() => handleRemove("invitationImageUrl")}
                  disabled={removingKey === "invitationImageUrl"}
                  className="text-xs text-destructive underline underline-offset-4 disabled:opacity-60"
                >
                  {removingKey === "invitationImageUrl" ? "Removing…" : "Remove"}
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
                  onClick={() => handleRemove("backgroundImageUrl")}
                  disabled={removingKey === "backgroundImageUrl"}
                  className="text-xs text-destructive underline underline-offset-4 disabled:opacity-60"
                >
                  {removingKey === "backgroundImageUrl" ? "Removing…" : "Remove"}
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
                  onClick={() => handleRemove("invitationPdfUrl")}
                  disabled={removingKey === "invitationPdfUrl"}
                  className="text-xs text-destructive underline underline-offset-4 disabled:opacity-60"
                >
                  {removingKey === "invitationPdfUrl" ? "Removing…" : "Remove"}
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