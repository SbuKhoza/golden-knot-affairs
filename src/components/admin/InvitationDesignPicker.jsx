import { PDF_COLOR_SCHEMES, PDF_TEMPLATES } from "@/utils/pdfThemes";

// Tiny live mock-ups of each PDF layout, built purely in CSS so the couple
// can actually see the difference between templates before generating a
// PDF, rather than choosing from a plain list of labels.

function KeepsakePreview({ accent, surface }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-2" style={{ background: surface }}>
      <div
        className="flex h-full w-full flex-col items-center gap-1.5 p-2"
        style={{ background: "#fff", border: `1px solid ${accent}` }}
      >
        <div className="h-8 w-full rounded-[2px]" style={{ background: `${accent}33` }} />
        <p className="text-[5px] uppercase tracking-[0.2em] text-muted-foreground">Dear Guest</p>
        <div className="h-px w-8" style={{ background: accent }} />
        <p className="font-script text-sm leading-none" style={{ color: accent }}>
          Charles
        </p>
        <p className="font-script text-sm leading-none" style={{ color: accent }}>
          Nicolle
        </p>
        <p className="text-[5px] uppercase tracking-[0.15em] text-muted-foreground">17 December 2026</p>
        <div className="mt-auto w-full rounded-[2px] border py-1 text-center" style={{ borderColor: accent }}>
          <p className="text-[5px] uppercase tracking-[0.15em] text-muted-foreground">Reserved for</p>
        </div>
      </div>
    </div>
  );
}

function EditorialPreview({ accent, surface }) {
  return (
    <div className="relative h-full w-full p-2" style={{ background: surface }}>
      <div className="absolute inset-1.5 border" style={{ borderColor: `${accent}88` }} />
      <div className="relative flex h-full w-full flex-col items-center gap-1.5 px-2 py-2.5">
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full border text-[5px]"
          style={{ borderColor: accent, color: accent }}
        >
          CN
        </div>
        <p className="font-script text-sm leading-none" style={{ color: accent }}>
          Charles
        </p>
        <p className="font-script text-sm leading-none" style={{ color: accent }}>
          Nicolle
        </p>
        <div className="h-px w-10" style={{ background: accent }} />
        <div className="h-8 w-full border" style={{ background: `${accent}22`, borderColor: `${accent}55` }} />
        <p className="text-[5px] uppercase tracking-[0.15em] text-muted-foreground">Ceremony · Reception</p>
      </div>
    </div>
  );
}

const PREVIEWS = {
  keepsake: KeepsakePreview,
  editorial: EditorialPreview,
};


export function InvitationDesignPicker({ templateId, colorSchemeId, onTemplateChange, onColorSchemeChange }) {
  const accent = PDF_COLOR_SCHEMES.find((s) => s.id === colorSchemeId)?.hex.accent || PDF_COLOR_SCHEMES[0].hex.accent;
  const surface = PDF_COLOR_SCHEMES.find((s) => s.id === colorSchemeId)?.hex.surface || PDF_COLOR_SCHEMES[0].hex.surface;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Layout</p>
        <div className="grid gap-4 sm:grid-cols-2">
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