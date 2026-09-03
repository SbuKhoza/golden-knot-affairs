import { PDF_COLOR_SCHEMES, PDF_TEMPLATES } from "@/utils/pdfThemes";

// Tiny live mock-ups of each jsPDF layout, built purely in CSS so the couple
// can actually see the difference between templates before generating a
// PDF, rather than choosing from a plain list of labels.

function ClassicPreview({ accent, surface }) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-2 p-3"
      style={{ background: surface, border: `2px solid ${accent}`, boxShadow: `inset 0 0 0 3px ${surface}, inset 0 0 0 4px ${accent}55` }}
    >
      {["tl", "tr", "bl", "br"].map((c) => (
        <span
          key={c}
          className="absolute h-3 w-3 border-t border-l"
          style={{
            borderColor: accent,
            top: c.includes("t") ? 3 : "auto",
            bottom: c.includes("b") ? 3 : "auto",
            left: c.includes("l") ? 3 : "auto",
            right: c.includes("r") ? 3 : "auto",
            transform: c === "tr" ? "rotate(90deg)" : c === "br" ? "rotate(180deg)" : c === "bl" ? "rotate(270deg)" : "none",
          }}
        />
      ))}
      <div className="h-8 w-8 rounded-full border" style={{ borderColor: accent }} />
      <p className="font-script text-base leading-none" style={{ color: accent }}>
        Charles &amp; Nicolle
      </p>
      <div className="h-px w-10" style={{ background: accent }} />
      <p className="text-[6px] uppercase tracking-[0.2em] text-muted-foreground">Together with their families</p>
    </div>
  );
}

function ModernPreview({ accent, surface }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3" style={{ background: surface }}>
      <p className="text-[6px] uppercase tracking-[0.35em] text-muted-foreground">We're getting married</p>
      <p className="font-display text-lg font-light" style={{ color: accent }}>
        Luis &amp; Lany
      </p>
      <div className="h-px w-14" style={{ background: accent }} />
      <p className="text-[6px] uppercase tracking-[0.2em] text-muted-foreground">10 · 11 · 2050</p>
    </div>
  );
}

function BotanicalPreview({ accent, surface }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: surface }}>
      <div className="flex items-center justify-center py-2.5" style={{ background: accent }}>
        <p className="font-script text-base leading-none text-white">Amara &amp; Kea</p>
      </div>
      <div className="flex flex-1 items-center justify-center gap-3 px-2">
        <div className="flex-1 border-r pr-2 text-center" style={{ borderColor: `${accent}55` }}>
          <p className="text-[5px] uppercase tracking-[0.15em] text-muted-foreground">Ceremony</p>
          <p className="text-[6px] font-semibold" style={{ color: accent }}>
            2:00 PM
          </p>
        </div>
        <div className="flex-1 pl-2 text-center">
          <p className="text-[5px] uppercase tracking-[0.15em] text-muted-foreground">Reception</p>
          <p className="text-[6px] font-semibold" style={{ color: accent }}>
            5:00 PM
          </p>
        </div>
      </div>
    </div>
  );
}

const PREVIEWS = {
  classic: ClassicPreview,
  modern: ModernPreview,
  botanical: BotanicalPreview,
};

export function InvitationDesignPicker({ templateId, colorSchemeId, onTemplateChange, onColorSchemeChange }) {
  const accent = PDF_COLOR_SCHEMES.find((s) => s.id === colorSchemeId)?.hex.accent || PDF_COLOR_SCHEMES[0].hex.accent;
  const surface = PDF_COLOR_SCHEMES.find((s) => s.id === colorSchemeId)?.hex.surface || PDF_COLOR_SCHEMES[0].hex.surface;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Layout</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PDF_TEMPLATES.map((template) => {
            const Preview = PREVIEWS[template.id];
            const active = templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onTemplateChange(template.id)}
                className={`group overflow-hidden rounded-xl border bg-card text-left shadow-sm transition ${
                  active ? "border-gold ring-2 ring-gold/50" : "border-border hover:border-gold/60"
                }`}
              >
                <div className="aspect-[3/4] w-full">
                  <Preview accent={accent} surface={surface} />
                </div>
                <div className="border-t border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-sm text-foreground">{template.label}</p>
                    {active ? (
                      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{template.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
    </div>
  );
}