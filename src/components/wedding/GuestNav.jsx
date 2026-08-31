import { Link } from "@tanstack/react-router";

const items = [
  { to: "/invitation", label: "Invitation" },
  { to: "/rsvp", label: "RSVP" },
  { to: "/program", label: "Program" },
];

export function GuestNav({ guest, onSignOut }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <nav
        aria-label="Guest navigation"
        className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3"
      >
        <span className="font-display text-sm tracking-[0.2em] text-muted-foreground">
          {guest.firstName} {guest.surname}
        </span>
        <div className="flex items-center gap-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:bg-secondary hover:text-primary"
              activeProps={{ className: "rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] bg-secondary text-primary" }}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={onSignOut}
            className="ml-1 rounded-full px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:text-destructive"
          >
            Exit
          </button>
        </div>
      </nav>
    </header>
  );
}
