/*
 * Fills the admin-uploaded fillable invitation PDF (a real AcroForm — text
 * fields placed in a tool like Adobe Acrobat on top of a decorative design
 * made in Canva or similar) with this guest's details.
 *
 * The invitation has no generated fallback design any more — this uploaded,
 * fillable template is the *only* invitation. If it isn't configured, isn't
 * reachable, or isn't an AcroForm at all, `downloadFilledInvitationTemplate`
 * throws an `InvitationTemplateError` with a `code` the caller can use to
 * show a precise, actionable message instead of silently producing a blank
 * or wrong PDF.
 */

import { rgb } from "pdf-lib";
import { downloadBlob } from "@/utils/pdf";

const WARM_CHARCOAL = rgb(65 / 255, 58 / 255, 48 / 255);
const WEDDING_DAY_CHARCOAL = rgb(45 / 255, 40 / 255, 34 / 255);

const FIELD_STYLES = {
  username: { fontSize: 6.5, minFontSize: 5.5, textColor: WARM_CHARCOAL },
  ceremonyVenueName: { fontSize: 9.5, minFontSize: 6.5, textColor: WARM_CHARCOAL },
  receptionVenueName: { fontSize: 9.5, minFontSize: 6.5, textColor: WARM_CHARCOAL },
  weddingMonth: { fontSize: 9.5, minFontSize: 6.5, textColor: WARM_CHARCOAL },
  weddingDay: { fontSize: 17, minFontSize: 14, textColor: WEDDING_DAY_CHARCOAL },
  weddingYear: { fontSize: 9.5, minFontSize: 6.5, textColor: WARM_CHARCOAL },
  ceremonyTime: { fontSize: 11.5, minFontSize: 6.5, textColor: WARM_CHARCOAL },
  receptionTime: { fontSize: 11.5, minFontSize: 6.5, textColor: WARM_CHARCOAL },
  tableNumber: { fontSize: 12.5, minFontSize: 7, textColor: WARM_CHARCOAL },
  additionalMessage: { fontSize: 9.5, minFontSize: 6.5, textColor: WARM_CHARCOAL },
};

const DEFAULT_FIELD_STYLE = {
  fontSize: 7.5,
  minFontSize: 5,
  textColor: WARM_CHARCOAL,
};

/**
 * Typed error so callers (the download button, admin previews, etc.) can
 * branch on `err.code` rather than parsing a message string.
 *
 * Codes:
 * - NO_TEMPLATE:     `settings.invitationPdfUrl` isn't set at all.
 * - FETCH_FAILED:    The URL didn't return a usable file (network/host issue).
 * - LOAD_FAILED:     The bytes fetched aren't a PDF pdf-lib can parse.
 * - NOT_FILLABLE:    The PDF loaded fine but has no AcroForm fields at all.
 */
export class InvitationTemplateError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "InvitationTemplateError";
    this.code = code;
  }
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function splitWeddingDate(value) {
  if (!value) return { weddingMonth: "", weddingDay: "", weddingYear: "" };

  // `settings.weddingDate` is a plain "YYYY-MM-DD" string from a date
  // input. Parsing with `new Date(value)` and reading local getters can
  // shift the day by one depending on the visitor's timezone offset, so
  // this reads the UTC fields the ISO string was written in instead.
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { weddingMonth: "", weddingDay: "", weddingYear: "" };

  return {
    weddingMonth: MONTH_NAMES[date.getUTCMonth()] || "",
    weddingDay: String(date.getUTCDate()),
    weddingYear: String(date.getUTCFullYear()),
  };
}

function fullGuestName(guest) {
  return [guest?.firstName, guest?.surname]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

// Every field name this app knows how to fill, and where its value comes
// from. Unknown/missing fields in the uploaded template are simply skipped
// — the template doesn't have to use every one of these, and older
// templates without the newer fields still work.
function fieldValues(settings, guest) {
  const { weddingMonth, weddingDay, weddingYear } = splitWeddingDate(settings.weddingDate);

  return {
    username: fullGuestName(guest),
    ceremonyVenueName: settings.ceremonyVenueName || "",
    receptionVenueName: settings.receptionVenueName || "",
    weddingMonth,
    weddingDay,
    weddingYear,
    ceremonyTime: settings.ceremonyTime || "",
    receptionTime: settings.receptionTime || "",
    tableNumber: guest?.tableNumber ? String(guest.tableNumber) : "",
    additionalMessage: settings.weddingMessage || "",
    // These two fields sit in a 1x1pt box on the template (invisible on
    // the page) — they're filled with the plain URL as ordinary form data,
    // not shown anywhere, per how the template was designed.
    ceremonyVenueMapUrl: settings.ceremonyVenueMapUrl || "",
    receptionVenueMapUrl: settings.receptionVenueMapUrl || "",
  };
}

/**
 * Sets a text field's value and regenerates its appearance so the value is
 * actually visible (rather than only stored as form data).
 *
 * pdf-lib doesn't read each field's own /DA font when it regenerates an
 * appearance stream — left unset, it silently falls back to plain
 * Helvetica, which looks out of place next to a template designed around an
 * elegant serif. This app's templates use Times Roman ("TiRo") in their own
 * default appearance, so that's what's tried first.
 *
 * `StandardFonts.TimesRoman` only supports WinAnsi encoding (Latin-1), so a
 * value containing characters outside that range (e.g. some Central/Eastern
 * European names, or non-Latin scripts) would otherwise throw and cause the
 * whole field to be silently skipped, leaving it blank on the guest's PDF.
 * Instead, this falls back to a Unicode-capable embedded font for just that
 * field, so the guest's actual name always ends up on the page even if the
 * font doesn't perfectly match the template's design in that edge case.
 */
function fittedFontSize(field, value, font, fontSize, minFontSize) {
  try {
    const widths = field.acroField
      .getWidgets()
      .map((widget) => widget.getRectangle().width)
      .filter((width) => Number.isFinite(width) && width > 0);

    if (widths.length === 0) return fontSize;

    // Leave a little horizontal inset so glyphs never touch the field edge.
    const availableWidth = Math.max(1, Math.min(...widths) - 4);
    const longestLineWidth = String(value)
      .split(/\r?\n/)
      .reduce((largest, line) => Math.max(largest, font.widthOfTextAtSize(line, fontSize)), 0);

    if (longestLineWidth <= availableWidth) return fontSize;

    return Math.max(minFontSize, fontSize * (availableWidth / longestLineWidth));
  } catch {
    // If a template exposes an unusual widget structure, retain its requested
    // field-specific size rather than preventing the invitation download.
    return fontSize;
  }
}

function applyFieldAppearance(field, value, font, { fontSize, minFontSize, textColor }) {
  const resolvedFontSize = fittedFontSize(field, value, font, fontSize, minFontSize);
  field.setText(value);
  field.setFontSize(resolvedFontSize);
  field.setTextColor(textColor);
  field.updateAppearances(font);
}

async function setFieldText(field, value, preferredFont, fallbackFontPromise, style) {
  try {
    applyFieldAppearance(field, value, preferredFont, style);
    return;
  } catch {
    // Preferred font couldn't encode this value — fall back below.
  }

  try {
    const fallbackFont = await fallbackFontPromise();
    applyFieldAppearance(field, value, fallbackFont, style);
  } catch {
    // Even the fallback failed (e.g. field isn't actually a text field) —
    // leave this one field blank rather than failing the whole download.
  }
}

/**
 * Fetches the admin-uploaded template, fills every field it recognises,
 * flattens the form so the guest gets a normal (non-editable) PDF, and
 * triggers a download.
 *
 * Throws `InvitationTemplateError` (see codes above) if the template isn't
 * usable; resolves with no return value on a successful download.
 */
export async function downloadFilledInvitationTemplate(settings, guest) {
  const templateUrl = settings.invitationPdfUrl;
  if (!templateUrl) {
    throw new InvitationTemplateError(
      "NO_TEMPLATE",
      "No invitation template has been uploaded yet.",
    );
  }

  const { PDFDocument, StandardFonts } = await import("pdf-lib");

  let bytes;
  try {
    // Firebase Storage doesn't allow direct browser fetches (no CORS headers),
    // so the bytes come through our own same-origin proxy instead. If that
    // ever fails we still try the direct URL as a last resort.
    let response = await fetch(
      `/api/public/invitation-template?url=${encodeURIComponent(templateUrl)}`,
    );
    if (!response.ok) {
      response = await fetch(templateUrl);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    bytes = await response.arrayBuffer();
  } catch (err) {
    throw new InvitationTemplateError(
      "FETCH_FAILED",
      `Couldn't fetch the invitation template: ${err.message}`,
    );
  }

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(bytes);
  } catch (err) {
    throw new InvitationTemplateError(
      "LOAD_FAILED",
      `The uploaded invitation template isn't a valid PDF: ${err.message}`,
    );
  }

  const form = pdfDoc.getForm();
  const fields = form.getFields();

  // Not actually a fillable form — there's nothing to fill in, and this app
  // no longer has a generated design to fall back to.
  if (fields.length === 0) {
    throw new InvitationTemplateError(
      "NOT_FILLABLE",
      "The uploaded invitation template has no fillable fields.",
    );
  }

  const preferredFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  // Embedded lazily, and only once, if some value actually needs it.
  let fallbackFont = null;
  const getFallbackFont = async () => {
    if (!fallbackFont) {
      fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    return fallbackFont;
  };

  const values = fieldValues(settings, guest);

  for (const [name, value] of Object.entries(values)) {
    if (!value) continue;

    let field;
    try {
      field = form.getTextField(name);
    } catch {
      // Field doesn't exist on this template, or isn't a text field —
      // skip it rather than failing the whole download.
      continue;
    }

    await setFieldText(
      field,
      value,
      preferredFont,
      getFallbackFont,
      FIELD_STYLES[name] || DEFAULT_FIELD_STYLE,
    );
  }

  // Bakes the entered text into the page content and removes the
  // interactive form, so the guest downloads a normal finished PDF rather
  // than one that still looks like an editable form.
  form.flatten();

  const filledBytes = await pdfDoc.save();
  const blob = new Blob([filledBytes], { type: "application/pdf" });

  const guestName = fullGuestName(guest) || "guest";
  downloadBlob(blob, `invitation-${guestName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
