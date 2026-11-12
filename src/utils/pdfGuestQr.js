import { rgb } from "pdf-lib";
import { guestQrPayload } from "@/utils/guestQr";

const QR_FIELD = "qrCode";
// Quiet zone (empty modules) kept inside the field box around the code.
const QUIET_MODULES = 2;

/**
 * Draws the guest's unique entry QR into the template's "qrCode" field box.
 *
 * Camouflage: no black-on-white block. The code is vector-drawn (no image box),
 * only the dark modules are painted — in a deep shade of the invitation's own
 * accent colour — and the light modules are left transparent, so the template's
 * artwork shows straight through. It uses the highest error-correction level so
 * it still scans reliably over that artwork.
 *
 * Does nothing (and never throws) when the template has no "qrCode" field or the
 * guest has no ID, so older templates keep downloading exactly as before.
 */
export async function drawGuestQr(pdfDoc, form, guest, accent = [176, 148, 96]) {
  if (!guest?.id) return;

  let field;
  try {
    field = form.getTextField(QR_FIELD);
  } catch {
    return; // template has no QR field
  }

  try {
    const widget = field.acroField.getWidgets()[0];
    const rect = widget?.getRectangle();
    if (!rect || rect.width < 10 || rect.height < 10) return;

    const page = pdfDoc.getPages().find((pg) => pg.ref === widget.P()) || pdfDoc.getPages()[0];

    const mod = await import("qrcode");
    const QRCode = mod.default ?? mod;
    const qr = QRCode.create(guestQrPayload(guest.id), { errorCorrectionLevel: "H" });
    const count = qr.modules.size;
    const data = qr.modules.data;

    const side = Math.min(rect.width, rect.height);
    const cell = side / (count + QUIET_MODULES * 2);
    const originX = rect.x + (rect.width - side) / 2 + QUIET_MODULES * cell;
    const topY = rect.y + (rect.height + side) / 2 - QUIET_MODULES * cell;

    // Deep shade of the accent colour: reads as part of the design but keeps
    // strong contrast against both the paper and the lighter artwork.
    const [r, g, b] = accent.map((c) => Math.round(c * 0.42));
    const color = rgb(r / 255, g / 255, b / 255);

    // Remove the placeholder field so nothing else (border, highlight) is drawn for it.
    form.removeField(field);

    // Soft, feathered fade of the artwork directly behind the code, so thin
    // decorative lines can't be mistaken for modules. It is white on a (mostly)
    // white page, and its edges dissolve gradually, so no box is visible.
    const veilLayers = 7;
    const veilReach = cell * 3.2;
    for (let i = 0; i < veilLayers; i += 1) {
      const grow = veilReach * (1 - i / (veilLayers - 1));
      page.drawRectangle({
        x: originX - QUIET_MODULES * cell - grow + cell * 0.5,
        y: topY - (count + QUIET_MODULES) * cell - grow + cell * 0.5,
        width: (count + QUIET_MODULES * 2) * cell + grow * 2 - cell,
        height: (count + QUIET_MODULES * 2) * cell + grow * 2 - cell,
        color: rgb(1, 1, 1),
        opacity: 0.3,
        borderWidth: 0,
      });
    }

    const overlap = cell * 0.08; // hides hairline seams between neighbouring modules
    for (let row = 0; row < count; row += 1) {
      let col = 0;
      while (col < count) {
        if (!data[row * count + col]) {
          col += 1;
          continue;
        }
        const start = col;
        while (col < count && data[row * count + col]) col += 1;
        page.drawRectangle({
          x: originX + start * cell,
          y: topY - (row + 1) * cell - overlap / 2,
          width: (col - start) * cell + overlap,
          height: cell + overlap,
          color,
          borderWidth: 0,
        });
      }
    }
  } catch {
    // Never block the guest's invitation download because of the QR.
  }
}
