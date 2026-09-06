import { PDF_COLOR_SCHEMES } from "@/utils/pdfThemes";

// Lets the couple pick the accent palette used purely for the generated
// wedding *program* PDF. The invitation used to share this same picker (plus
// a layout choice) for its own generated design, but the invitation is now
// always the admin's uploaded fillable PDF template, so only the program's
// color choice remains here.

export function ProgramColorPicker({ colorSchemeId, onColorSchemeChange }) {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Color palette</p>
      <div className="flex flex-wrap gap-3">
        {PDF_COLOR_SCHEMES.map((scheme) => {
          const active = colorSchemeId === scheme.id;
          return (
            <button
              key={scheme.id}
              type="button"
              onClick={() => onColorSchemeChange(scheme.id)}
              className={`flex items-center gap-2.5 rounded-full border bg-card py-1.5 pl-1.5 pr-4 text-sm transition ${
                active ? "border-gold ring-2 ring-gold/50" : "border-border hover:border-gold/60"
              }`}
            >
              <span className="flex h-7 w-7 overflow-hidden rounded-full border border-border/60">
                <span className="h-full w-1/2" style={{ background: scheme.hex.accent }} />
                <span className="h-full w-1/2" style={{ background: scheme.hex.surface }} />
              </span>
              <span className="text-foreground">{scheme.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}