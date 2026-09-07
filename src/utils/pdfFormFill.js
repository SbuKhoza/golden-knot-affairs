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

import { rgb, setFillingColor, setFontAndSize, PDFString } from "pdf-lib";
import { downloadBlob } from "@/utils/pdf";
import { googleMapsUrl } from "@/utils/format";
import { getColorScheme } from "@/utils/pdfThemes";

// Font sizes per field are fixed, but text *color* now follows the admin's
// chosen color scheme (see `themeTextColors` below) instead of a single
// hardcoded charcoal, so the "Wedding program design" picker also styles
// the filled-in invitation text.
const FIELD_SIZES = {
  username: { fontSize: 8.5, minFontSize: 7.5 },
  ceremonyVenueName: { fontSize: 9.5, minFontSize: 8.8 },
  receptionVenueName: { fontSize: 9.5, minFontSize: 7.5 },
  weddingMonth: { fontSize: 9.5, minFontSize: 7.5 },
  weddingDay: { fontSize: 17, minFontSize: 14, emphasis: true },
  weddingYear: { fontSize: 9.5, minFontSize: 7.5 },
  ceremonyTime: { fontSize: 11.5, minFontSize: 7.5 },
  receptionTime: { fontSize: 11.5, minFontSize: 7.5 },
  tableNumber: { fontSize: 12.5, minFontSize: 9 },
  additionalMessage: { fontSize: 9.5, minFontSize: 7.5 },
};

const DEFAULT_FIELD_SIZE = { fontSize: 7.5, minFontSize: 7 };

function clampByte(value) {
  return Math.max(0, Math.min(255, value));
}

// A slightly deeper shade of the scheme's ink color, used only for the
// large wedding-day number so it still reads as the emphasised element on
// the page regardless of which color scheme is active.
function darken([r, g, b], factor = 0.72) {
  return [clampByte(r * factor), clampByte(g * factor), clampByte(b * factor)];
}

/**
 * Resolves the two text colors used across the filled invitation — the
 * regular ink color and a deeper "emphasis" color for the wedding-day
 * number — from the admin's chosen color scheme (`settings.colorSchemeId`),
 * the same palette used for the wedding program PDF.
 */
function themeTextColors(colorSchemeId) {
  const scheme = getColorScheme(colorSchemeId);
  const [r, g, b] = scheme.colors.ink;
  const [dr, dg, db] = darken(scheme.colors.ink);
  return {
    textColor: rgb(r / 255, g / 255, b / 255),
    emphasisColor: rgb(dr / 255, dg / 255, db / 255),
  };
}

function fieldStyleFor(name, themeColors) {
  const size = FIELD_SIZES[name] || DEFAULT_FIELD_SIZE;
  return {
    fontSize: size.fontSize,
    minFontSize: size.minFontSize,
    textColor: size.emphasis ? themeColors.emphasisColor : themeColors.textColor,
  };
}

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
    // These two fields sit in a 1x1pt invisible box on the template — still
    // filled with the plain URL as ordinary form data for backwards
    // compatibility — but the actual clickable link guests can tap comes
    // from `embedMapLink` below, which lays a real Link annotation over the
    // visible venue-name field instead.
    ceremonyVenueMapUrl: googleMapsUrl(
      settings.ceremonyVenueMapUrl,
      settings.ceremonyVenueName,
      settings.ceremonyVenueAddress,
    ),
    receptionVenueMapUrl: googleMapsUrl(
      settings.receptionVenueMapUrl,
      settings.receptionVenueName,
      settings.receptionVenueAddress,
    ),
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

  // `PDFTextField` has no `setTextColor` method in pdf-lib — calling one
  // (as this used to) throws and is silently swallowed by the caller's
  // try/catch, leaving the field blank. The correct way to set color is to
  // write it into the field's own `/DA` (default appearance) string
  // alongside the font/size, in the same format pdf-lib's own appearance
  // provider reads back — then `updateAppearances` picks it up from there.
  const da = [
    setFillingColor(textColor).toString(),
    setFontAndSize(font.name, resolvedFontSize).toString(),
  ].join("\n");
  field.acroField.setDefaultAppearance(da);
  field.updateAppearances(font);
}

// Finds which page a text field's widget actually sits on, so a Link
// annotation can be added to that same page's /Annots array. Most templates
// (this one included) set the widget's own /P entry to its parent page, but
// that isn't strictly guaranteed by the PDF spec, so this falls back to
// scanning every page's annotations for the widget itself.
function findWidgetPage(pdfDoc, pages, widget) {
  const pageRef = widget.P();
  if (pageRef) {
    const direct = pages.find((page) => page.ref === pageRef);
    if (direct) return direct;
  }

  for (const page of pages) {
    const annots = page.node.Annots();
    if (!annots) continue;
    for (let i = 0; i < annots.size(); i += 1) {
      if (pdfDoc.context.lookup(annots.get(i)) === widget.dict) return page;
    }
  }

  return null;
}

/**
 * Embeds a real, clickable PDF link (a `/Link` annotation with a `/URI`
 * action) over the visible `anchorFieldName` field — e.g. the ceremony or
 * reception venue name — so tapping that text on the finished PDF opens the
 * maps link in the guest's browser or maps app.
 *
 * This is separate from filling `ceremonyVenueMapUrl`/`receptionVenueMapUrl`
 * as plain text: those two fields are an invisible 1x1pt box on the
 * template and were never wired up to anything clickable, so the map link
 * effectively wasn't "embedded" anywhere a guest could use it. Link
 * annotations aren't part of the AcroForm field tree, so they survive
 * `form.flatten()` untouched.
 */
function embedMapLink(pdfDoc, form, anchorFieldName, url) {
  if (!url) return;

  let anchorField;
  try {
    anchorField = form.getTextField(anchorFieldName);
  } catch {
    // Template doesn't have this field — nothing to anchor the link to.
    return;
  }

  const pages = pdfDoc.getPages();
  for (const widget of anchorField.acroField.getWidgets()) {
    const page = findWidgetPage(pdfDoc, pages, widget);
    if (!page) continue;

    const { x, y, width, height } = widget.getRectangle();
    const linkDict = pdfDoc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, y, x + width, y + height],
      Border: [0, 0, 0],
      A: {
        Type: "Action",
        S: "URI",
        URI: PDFString.of(url),
      },
    });
    page.node.addAnnot(pdfDoc.context.register(linkDict));
  }
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
  const themeColors = themeTextColors(settings.colorSchemeId);

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
      fieldStyleFor(name, themeColors),
    );
  }

  // Lay real, clickable links over the venue names so guests can tap
  // straight through to maps — see `embedMapLink` for why this is separate
  // from the (invisible) ceremonyVenueMapUrl/receptionVenueMapUrl fields.
  embedMapLink(pdfDoc, form, "ceremonyVenueName", values.ceremonyVenueMapUrl);
  embedMapLink(pdfDoc, form, "receptionVenueName", values.receptionVenueMapUrl);

  // Bakes the entered text into the page content and removes the
  // interactive form, so the guest downloads a normal finished PDF rather
  // than one that still looks like an editable form. Link annotations added
  // above aren't part of the AcroForm field tree, so they aren't touched.
  form.flatten();

  const filledBytes = await pdfDoc.save();
  const blob = new Blob([filledBytes], { type: "application/pdf" });

  const guestName = fullGuestName(guest) || "guest";
  downloadBlob(blob, `invitation-${guestName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}