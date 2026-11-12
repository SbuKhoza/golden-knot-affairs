import { PDFArray, PDFDict, PDFName, PDFString } from "pdf-lib";

const LINK = PDFName.of("Link");
const SUBTYPE = PDFName.of("Subtype");

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** An existing /Link annotation on the page, matched by its name or by sitting on the same spot. */
function findExistingLink(page, linkName, rect) {
  const annots = page.node.Annots();
  if (!annots) return null;

  let overlapping = null;
  for (let i = 0; i < annots.size(); i += 1) {
    const dict = annots.lookupMaybe(i, PDFDict);
    if (!dict || dict.get(SUBTYPE) !== LINK) continue;

    const nm = dict.lookupMaybe(PDFName.of("NM"), PDFString) ?? dict.get(PDFName.of("NM"));
    let name = "";
    try {
      name = nm?.decodeText?.() ?? "";
    } catch {
      name = "";
    }
    if (linkName && name === linkName) return dict;

    const r = dict.lookupMaybe(PDFName.of("Rect"), PDFArray);
    if (!overlapping && r) {
      try {
        if (rectsOverlap(r.asRectangle(), rect)) overlapping = dict;
      } catch {
        /* malformed rect — ignore */
      }
    }
  }
  return overlapping;
}

/**
 * Makes the venue box clickable.
 *
 * Templates usually ship with their own (empty) link over the venue name. If a
 * second link were simply stacked on top, desktop viewers would use the top one
 * but phone viewers use the first one they find — the empty one — so nothing
 * would open. So the template's own link is filled in, and a new one is only
 * created when the template has none.
 */
export function applyVenueLink(pdfDoc, page, rect, linkName, href) {
  const action = pdfDoc.context.obj({ Type: "Action", S: "URI", URI: PDFString.of(href) });

  const existing = findExistingLink(page, linkName, rect);
  if (existing) {
    existing.set(PDFName.of("A"), action);
    existing.set(PDFName.of("F"), pdfDoc.context.obj(4)); // printable, so every viewer treats it as a real link
    return;
  }

  const annot = pdfDoc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
    Border: [0, 0, 0],
    F: 4,
    A: action,
  });
  page.node.addAnnot(pdfDoc.context.register(annot));
}
