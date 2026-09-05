import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Loader } from "@/components/common/Loader";
import { defaultSettings, saveSettings, subscribeToSettings } from "@/services/settingsService";
import { deleteWeddingFile, uploadWeddingFile } from "@/services/storageService";
import { downloadProgramPdf } from "@/utils/pdf";
import { friendlyError } from "@/utils/format";

export const Route = createFileRoute("/admin/program")({
  head: () => ({
    meta: [
      { title: "Wedding Program — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgramAdminRoute,
});

function ProgramAdminRoute() {
  return (
    <AdminShell title="Wedding Program">
      <ProgramAdminPage />
    </AdminShell>
  );
}

const inputClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40";
const labelClass = "mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground";

const emptyItem = { time: "", event: "", description: "" };

function ProgramAdminPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [items, setItems] = useState([]);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const unsub = subscribeToSettings(
      (data) => {
        setSettings(data);
        setItems(Array.isArray(data.programItems) ? data.programItems : []);
        setPublished(Boolean(data.programPublished));
        setLoading(false);
      },
      () => {
        setError("We couldn't load the program.");
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  function updateItem(index, key, value) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function moveItem(index, direction) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave(e) {
    e?.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const cleaned = items
        .map((item) => ({
          time: (item.time || "").trim(),
          event: (item.event || "").trim(),
          description: (item.description || "").trim(),
        }))
        .filter((item) => item.time || item.event);
      await saveSettings({ programItems: cleaned, programPublished: published });
      setItems(cleaned);
      setNotice("Program saved.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file) {
    setError("");
    setNotice("");
    setUploading(true);
    try {
      const url = await uploadWeddingFile(file, "program", "pdf");
      await saveSettings({ programPdfUrl: url });
      setNotice("Program PDF uploaded. Guests will download this file.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePdf() {
    setError("");
    setNotice("");
    try {
      await deleteWeddingFile(settings.programPdfUrl);
      await saveSettings({ programPdfUrl: "" });
      setNotice("Uploaded program PDF removed.");
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function handlePreview() {
    setError("");
    setPreviewing(true);
    try {
      await downloadProgramPdf({ ...settings, programItems: items });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setPreviewing(false);
    }
  }

  if (loading) return <Loader label="Loading the program…" />;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl">Order of the day</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add each moment of the day. Guests see this list and can download it as a beautifully typeset PDF.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 accent-[var(--gold,#a08046)]"
            />
            Visible to guests
          </label>
        </div>

        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No moments added yet.
            </p>
          ) : null}

          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-border p-4">
              <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                <div>
                  <label className={labelClass} htmlFor={`time-${index}`}>
                    Time
                  </label>
                  <input
                    id={`time-${index}`}
                    className={inputClass}
                    placeholder="14:00"
                    value={item.time || ""}
                    onChange={(e) => updateItem(index, "time", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`event-${index}`}>
                    Moment
                  </label>
                  <input
                    id={`event-${index}`}
                    className={inputClass}
                    placeholder="Ceremony"
                    value={item.event || ""}
                    onChange={(e) => updateItem(index, "event", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass} htmlFor={`desc-${index}`}>
                  Details (optional)
                </label>
                <textarea
                  id={`desc-${index}`}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
                  value={item.description || ""}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <button type="button" onClick={() => moveItem(index, -1)} className="underline underline-offset-4">
                  Move up
                </button>
                <button type="button" onClick={() => moveItem(index, 1)} className="underline underline-offset-4">
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-destructive underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-5 rounded-md border border-gold px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-foreground transition hover:bg-gold/10"
        >
          Add moment
        </button>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Your own program PDF (optional)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a designed program and guests will download that instead of the generated one.
        </p>
        <div className="mt-4">
          <input
            type="file"
            accept="application/pdf"
            className="text-sm"
            disabled={uploading}
            onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
          />
          {uploading ? <p className="mt-2 text-xs text-muted-foreground">Uploading…</p> : null}
          {settings.programPdfUrl && !uploading ? (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <a
                href={settings.programPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                View uploaded PDF
              </a>
              <button
                type="button"
                onClick={handleRemovePdf}
                className="text-xs text-destructive underline underline-offset-4"
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm text-primary">{notice}</p> : null}

      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-8 py-3 text-xs uppercase tracking-[0.25em] text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save program"}
        </button>
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing}
          className="rounded-md border border-border px-8 py-3 text-xs uppercase tracking-[0.25em] text-foreground disabled:opacity-60"
        >
          {previewing ? "Preparing…" : "Preview PDF"}
        </button>
      </div>
    </form>
  );
}
