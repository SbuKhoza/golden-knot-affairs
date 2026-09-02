import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell, Badge } from "@/components/admin/AdminShell";
import { GuestForm } from "@/components/admin/GuestForm";
import { Modal } from "@/components/common/Modal";
import { EmptyState, Loader } from "@/components/common/Loader";
import { createGuest, deleteGuest, subscribeToGuests, updateGuest } from "@/services/guestService";
import { parseGuestImportCsv } from "@/utils/guestImport";
import { friendlyError } from "@/utils/format";

export const Route = createFileRoute("/admin/guests")({
  head: () => ({
    meta: [
      { title: "Guests — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuestsRoute,
});

function GuestsRoute() {
  return (
    <AdminShell title="Invited Guests">
      <GuestsPage />
    </AdminShell>
  );
}

const FILTERS = ["all", "pending", "attending", "declined"];
const COLUMNS = [
  ["firstName", "Name"],
  ["surname", "Surname"],
  ["numberOfSeats", "Seats"],
  ["tableNumber", "Table"],
  ["rsvpStatus", "RSVP"],
];

function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState({ key: "surname", dir: "asc" });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToGuests(
      (data) => {
        setGuests(data);
        setLoading(false);
      },
      () => {
        setError("We couldn't load guests right now.");
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    let list = guests;
    if (filter !== "all") list = list.filter((g) => (g.rsvpStatus || "pending") === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((g) => `${g.firstName} ${g.surname} ${g.email}`.toLowerCase().includes(q));
    }
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = String(a[sort.key] ?? "").toLowerCase();
      const bv = String(b[sort.key] ?? "").toLowerCase();
      if (av === bv) return 0;
      return av < bv ? -dir : dir;
    });
  }, [guests, filter, search, sort]);

  function toggleSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  async function handleSave(values) {
    setSaving(true);
    setError("");
    try {
      if (editing) await updateGuest(editing.id, values);
      else await createGuest(values);
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setError(friendlyError(err, "We couldn't save that guest."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteGuest(deleting.id);
      setDeleting(null);
    } catch (err) {
      setError(friendlyError(err, "We couldn't remove that guest."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader label="Loading guests…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests…"
            aria-label="Search guests"
            className="h-10 w-48 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="rounded-md border border-border px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary"
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="rounded-md bg-primary px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90"
          >
            Add guest
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="No guests yet" description="Add your first guest or import a CSV list." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                {COLUMNS.map(([key, label]) => (
                  <th key={key} className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort(key)}>
                    {label} {sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : ""}
                  </th>
                ))}
                <th className="px-4 py-3">Dietary</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((guest) => (
                <tr key={guest.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">{guest.firstName}</td>
                  <td className="px-4 py-3">{guest.surname}</td>
                  <td className="px-4 py-3">{guest.numberOfSeats}</td>
                  <td className="px-4 py-3">{guest.tableNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge status={guest.rsvpStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{guest.dietaryRequirements || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(guest);
                          setFormOpen(true);
                        }}
                        className="text-xs uppercase tracking-[0.15em] text-primary underline underline-offset-4"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(guest)}
                        className="text-xs uppercase tracking-[0.15em] text-destructive underline underline-offset-4"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit guest" : "Add guest"}
        wide
      >
        <GuestForm
          initial={editing || {}}
          submitting={saving}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSave}
        />
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Remove guest">
        <p className="text-sm text-muted-foreground">
          Remove {deleting?.firstName} {deleting?.surname} from the guest list? This can't be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="rounded-md border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-md bg-destructive px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-destructive-foreground transition disabled:opacity-60"
          >
            {saving ? "Removing…" : "Remove"}
          </button>
        </div>
      </Modal>

      <ImportGuestsModal open={importOpen} onClose={() => setImportOpen(false)} existingGuests={guests} />
    </div>
  );
}

function ImportGuestsModal({ open, onClose, existingGuests }) {
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    setDone(null);
    const reader = new FileReader();
    reader.onload = () => setResult(parseGuestImportCsv(String(reader.result), existingGuests));
    reader.onerror = () => setError("We couldn't read that file.");
    reader.readAsText(file);
  }

  async function handleConfirm() {
    if (!result?.valid.length) return;
    setImporting(true);
    setError("");
    let created = 0;
    for (const row of result.valid) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await createGuest(row);
        created += 1;
      } catch {
        /* keep importing the remaining valid rows */
      }
    }
    setDone(created);
    setImporting(false);
  }

  function handleClose() {
    setFileName("");
    setResult(null);
    setDone(null);
    setError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import guests from CSV" wide>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Expected columns: First Name, Surname, Email, Phone, Seats, Plus One Allowed.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />
        {fileName ? <p className="text-xs text-muted-foreground">Selected: {fileName}</p> : null}

        {error ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {result ? (
          result.errors.length ? (
            <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {result.errors[0]}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-md border border-primary/30 bg-primary/5 py-3">
                  <p className="font-display text-2xl">{result.valid.length}</p>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Valid</p>
                </div>
                <div className="rounded-md border border-gold/40 bg-gold/10 py-3">
                  <p className="font-display text-2xl">{result.duplicates.length}</p>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Duplicates</p>
                </div>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 py-3">
                  <p className="font-display text-2xl">{result.invalid.length}</p>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Invalid</p>
                </div>
              </div>

              {done === null ? (
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-md border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={importing || !result.valid.length}
                    className="rounded-md bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition disabled:opacity-60"
                  >
                    {importing
                      ? "Importing…"
                      : `Import ${result.valid.length} guest${result.valid.length === 1 ? "" : "s"}`}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-foreground">
                    Imported {done} guest{done === 1 ? "" : "s"}.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-4 rounded-md bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary-foreground"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )
        ) : null}
      </div>
    </Modal>
  );
}