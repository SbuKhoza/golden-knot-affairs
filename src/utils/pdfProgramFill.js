// src/utils/pdfProgramFill.js
//
// Fills the fillable wedding-program template (wedding-program-template-floral.pdf)
// with the admin's settings (floral navy/white design). Field names are the contract between the PDF and
// this file:
//
//   programTime_1..10, programEvent_1..10, programDescription_1..10,
//   additionalMessage   (closing note; falls back to a default thank-you)

import { rgb, setFillingColor, setFontAndSize } from "pdf-lib";
import { downloadBlob } from "@/utils/pdf";

export const PROGRAM_SLOTS = 10;

// Template: "Blue & White Romantic Floral" (navy text, sans-serif body).
const NAVY = rgb(11 / 255, 55 / 255, 106 / 255);
const DEFAULT_THANKS = "Thank you for sharing our joy and love.";

// size = preferred size, min = smallest it may shrink to when text is long.
const STYLE = {
  additionalMessage: { size: 18, min: 11, multiline: true },
};
for (let i = 1; i <= PROGRAM_SLOTS; i++) {
  STYLE[`programTime_${i}`]        = { size: 16.8, min: 11 };
  STYLE[`programEvent_${i}`]       = { size: 15.7, min: 10 };
  STYLE[`programDescription_${i}`] = { size: 9.5,  min: 6.5 };
}

export function programFieldValues(settings) {
  const values = {
    additionalMessage: settings.weddingMessage || DEFAULT_THANKS,
  };
  const items = settings.programItems || [];
  for (let i = 1; i <= PROGRAM_SLOTS; i++) {
    const item = items[i - 1] || {};
    values[`programTime_${i}`] = item.time || "";
    values[`programEvent_${i}`] = item.event || "";
    values[`programDescription_${i}`] = item.description || "";
  }
  return values;
}

// Shrinks a wrapped message until it fits the box height (2-line closing note).
function fitMultiline(field, value, font, size, min) {
  try {
    const { width, height } = field.acroField.getWidgets()[0].getRectangle();
    for (let sz = size; sz >= min; sz -= 0.5) {
      const words = value.split(/\s+/); let lines = 1, line = "";
      for (const w of words) {
        const t = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(t, sz) > width - 6 && line) { lines++; line = w; } else line = t;
      }
      if (lines * sz * 1.2 <= height) return sz;
    }
  } catch { /* fall through */ }
  return min;
}

function fit(field, value, font, size, min) {
  try {
    const widths = field.acroField.getWidgets().map((w) => w.getRectangle().width);
    const avail = Math.max(1, Math.min(...widths) - 6);
    const w = font.widthOfTextAtSize(value, size);
    return w <= avail ? size : Math.max(min, size * (avail / w));
  } catch {
    return size;
  }
}

export class ProgramTemplateError extends Error {
  constructor(code, message) { super(message); this.name = "ProgramTemplateError"; this.code = code; }
}

export async function buildFilledProgramPdf(settings, templateBytes) {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  let pdfDoc;
  try { pdfDoc = await PDFDocument.load(templateBytes); }
  catch (e) { throw new ProgramTemplateError("LOAD_FAILED", `Invalid program template: ${e.message}`); }

  const form = pdfDoc.getForm();
  if (!form.getFields().length)
    throw new ProgramTemplateError("NOT_FILLABLE", "The program template has no fillable fields.");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const [name, value] of Object.entries(programFieldValues(settings))) {
    let field;
    try { field = form.getTextField(name); } catch { continue; }
    if (!value) { field.setText(""); continue; }   // unused slot stays blank
    const s = STYLE[name] || { size: 10, min: 8 };
    const size = s.multiline ? fitMultiline(field, value, font, s.size, s.min)
                             : fit(field, value, font, s.size, s.min);
    field.setText(value);
    field.acroField.setDefaultAppearance(
      [setFillingColor(NAVY).toString(), setFontAndSize(font.name, size).toString()].join("\n"),
    );
    field.updateAppearances(font);
  }

  form.flatten();
  return pdfDoc.save({ useObjectStreams: false });
}

const BUNDLED_TEMPLATE = "/templates/wedding-program-template-floral.pdf";

async function fetchBytes(url, viaProxy) {
  const target = viaProxy ? `/api/public/invitation-template?url=${encodeURIComponent(url)}` : url;
  const res = await fetch(target);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Fills the program template and downloads it.
 * Uses the admin-uploaded template (settings.programPdfUrl) first; if that is
 * missing, unreachable or not a fillable form, falls back to the template
 * shipped in /public/templates.
 */
export async function downloadFilledProgramTemplate(settings) {
  const candidates = [];
  if (settings.programPdfUrl) candidates.push({ url: settings.programPdfUrl, proxy: true });
  candidates.push({ url: BUNDLED_TEMPLATE, proxy: false });

  let lastError;
  for (const { url, proxy } of candidates) {
    try {
      const bytes = await buildFilledProgramPdf(settings, await fetchBytes(url, proxy));
      downloadBlob(new Blob([bytes], { type: "application/pdf" }), "wedding-program.pdf");
      return;
    } catch (e) {
      console.warn("[program] template failed:", url, e);
      lastError = e;
    }
  }
  throw lastError instanceof ProgramTemplateError
    ? lastError
    : new ProgramTemplateError("FETCH_FAILED", `Couldn't prepare the program: ${lastError?.message}`);
}