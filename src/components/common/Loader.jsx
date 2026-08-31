export function Loader({ label = "Loading…", full = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${full ? "min-h-screen" : "py-16"}`}
    >
      <span className="size-8 animate-spin rounded-full border border-gold border-t-transparent" />
      <p className="font-display text-lg text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
