/*
 * Fills the admin-uploaded fillable invitation PDF (a real AcroForm — text
 * fields placed in a tool like Adobe Acrobat on top of a decorative design
 * made in Canva or similar) with this guest's details, instead of building
 * the invitation from scratch in HTML/CSS like `pdf.js` does.
 *
 * This only runs when `settings.invitationPdfUrl` points at a PDF that
 * actually has AcroForm fields. If it doesn't (e.g. the admin uploaded a
 * plain decorative PDF with no fields at all), `fillInvitationTemplate`
 * returns `null` so the caller can fall back to the HTML-rendered
 * invitation in `pdf.js`.
 */

import { downloadBlob } from "@/utils/pdf";

// Every field name this app knows how to fill, and where its value comes
// from. Unknown/missing fields in the uploaded template are simply skipped
// — the template doesn't have to use every one of these, and older
// templates without the newer fields still work.
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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
 * Fetches the admin-uploaded template, fills every field it recognises,
 * flattens the form so the guest gets a normal (non-editable) PDF, and
 * triggers a download.
 *
 * Returns `true` if it filled and downloaded a template PDF, or `false` if
 * `settings.invitationPdfUrl` isn't set, isn't reachable, or isn't an
 * AcroForm at all — the caller should fall back to the HTML-rendered
 * invitation in that case.
 */
export async function downloadFilledInvitationTemplate(settings, guest) {
  const templateUrl = settings.invitationPdfUrl;
  if (!templateUrl) return false;

  const { PDFDocument, StandardFonts } = await import("pdf-lib");

  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Couldn't fetch invitation template (${response.status})`);
  }
  const bytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  // Not actually a fillable form — nothing to fill in, so let the caller
  // fall back to the generated invitation instead of downloading a blank
  // decorative PDF with the guest's name missing.
  if (fields.length === 0) return false;

  // pdf-lib doesn't read each field's own /DA font when it regenerates an
  // appearance stream for flattening — left unset, it silently falls back
  // to plain Helvetica, which looks out of place next to a template
  // designed around an elegant serif. Every field on this template's own
  // default appearance specifies Times Roman ("TiRo"), so that's embedded
  // explicitly and applied to each field as it's filled.
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const values = fieldValues(settings, guest);

  for (const [name, value] of Object.entries(values)) {
    if (!value) continue;
    try {
      const field = form.getTextField(name);
      field.setText(value);
      field.updateAppearances(font);
    } catch {
      // Field doesn't exist on this template, or isn't a text field —
      // skip it rather than failing the whole download.
    }
  }

  // Bakes the entered text into the page content and removes the
  // interactive form, so the guest downloads a normal finished PDF rather
  // than one that still looks like an editable form.
  form.flatten();

  const filledBytes = await pdfDoc.save();
  const blob = new Blob([filledBytes], { type: "application/pdf" });

  const guestName = fullGuestName(guest) || "guest";
  downloadBlob(blob, `invitation-${guestName.replace(/\s+/g, "-").toLowerCase()}.pdf`);

  return true;
}