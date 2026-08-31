export function Ornament({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="gold-rule h-px w-16 sm:w-24" />
      <svg viewBox="0 0 48 24" className="h-5 w-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M24 3c4 5 4 13 0 18-4-5-4-13 0-18Z" />
        <path d="M24 12c5-4 12-4 16 0-4 4-11 4-16 0Z" />
        <path d="M24 12c-5-4-12-4-16 0 4 4 11 4 16 0Z" />
      </svg>
      <span className="gold-rule h-px w-16 sm:w-24" />
    </div>
  );
}

export function Monogram({ bride = "", groom = "" }) {
  const initials = `${(bride[0] || "").toUpperCase()} & ${(groom[0] || "").toUpperCase()}`;
  return (
    <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-gold/50 text-lg tracking-[0.2em] text-primary">
      {initials.trim() === "&" ? "♥" : initials}
    </div>
  );
}
