import { useState } from "react";

const emptyGuest = {
  firstName: "",
  surname: "",
  email: "",
  phone: "",
  invitationType: "individual",
  numberOfSeats: 1,
  plusOneAllowed: false,
  plusOneName: "",
  notes: "",
};

const fieldClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40";
const labelClass = "mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground";

export function GuestForm({ initial, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState({ ...emptyGuest, ...initial });
  const [error, setError] = useState("");

  function update(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!values.firstName.trim() || !values.surname.trim()) {
      setError("First name and surname are required.");
      return;
    }
    if (Number(values.numberOfSeats) < 1) {
      setError("Number of seats must be at least 1.");
      return;
    }
    setError("");
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="gf-firstName">First name</label>
          <input
            id="gf-firstName"
            className={fieldClass}
            value={values.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="gf-surname">Surname</label>
          <input
            id="gf-surname"
            className={fieldClass}
            value={values.surname}
            onChange={(e) => update("surname", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="gf-email">Email</label>
          <input
            id="gf-email"
            type="email"
            className={fieldClass}
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="gf-phone">Phone</label>
          <input
            id="gf-phone"
            className={fieldClass}
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="gf-type">Invitation type</label>
          <select
            id="gf-type"
            className={fieldClass}
            value={values.invitationType}
            onChange={(e) => update("invitationType", e.target.value)}
          >
            <option value="individual">Individual</option>
            <option value="couple">Couple</option>
            <option value="family">Family / household</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="gf-seats">Number of seats</label>
          <input
            id="gf-seats"
            type="number"
            min={1}
            className={fieldClass}
            value={values.numberOfSeats}
            onChange={(e) => update("numberOfSeats", e.target.value)}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={values.plusOneAllowed}
          onChange={(e) => update("plusOneAllowed", e.target.checked)}
          className="size-4 rounded border-input"
        />
        Plus-one allowed
      </label>

      {values.plusOneAllowed ? (
        <div>
          <label className={labelClass} htmlFor="gf-plusone">Plus-one name (if known)</label>
          <input
            id="gf-plusone"
            className={fieldClass}
            value={values.plusOneName}
            onChange={(e) => update("plusOneName", e.target.value)}
          />
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="gf-notes">Notes</label>
        <textarea
          id="gf-notes"
          rows={2}
          className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/40"
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </div>

      {values.invitationCode ? (
        <p className="text-xs text-muted-foreground">
          Invitation code: <span className="font-medium tracking-[0.2em]">{values.invitationCode}</span>
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save guest"}
        </button>
      </div>
    </form>
  );
}