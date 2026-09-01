import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Loader } from "@/components/common/Loader";
import { defaultSettings, saveSettings, subscribeToSettings } from "@/services/settingsService";
import { uploadWeddingFile, validateFile } from "@/services/storageService";
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
            {values.invitationImageUrl ? (
              <img src={values.invitationImageUrl} alt="" className="mt-2 h-24 rounded-md object-cover" />
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
            {values.backgroundImageUrl ? (
              <img src={values.backgroundImageUrl} alt="" className="mt-2 h-24 rounded-md object-cover" />
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
            {values.invitationPdfUrl ? (
              
              <a  href={values.invitationPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-xs text-primary underline underline-offset-4"
              >
                View current PDF
              </a>
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