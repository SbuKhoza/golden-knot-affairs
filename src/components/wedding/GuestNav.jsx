import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3"
      >
        <span className="truncate font-display text-sm tracking-[0.2em] text-muted-foreground">
          {guest.firstName} {guest.surname}
        </span>

        {/* Desktop / tablet: full horizontal menu */}
        <div className="hidden items-center gap-1 sm:flex">
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

        {/* Mobile: collapse the menu items into a dropdown */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-secondary hover:text-primary"
              >
                <Menu className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {items.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link
                    to={item.to}
                    className="w-full text-xs uppercase tracking-[0.2em]"
                    activeProps={{ className: "w-full text-xs uppercase tracking-[0.2em] text-primary" }}
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onSignOut}
                className="text-xs uppercase tracking-[0.2em] text-destructive focus:text-destructive"
              >
                Exit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}