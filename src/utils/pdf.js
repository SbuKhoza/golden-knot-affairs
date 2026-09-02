import { formatWeddingDate } from "@/utils/format";
import { loadCroppedImage } from "@/utils/image";

const GOLD = [176, 148, 96];
const GOLD_SOFT = [206, 184, 140];
const INK = [58, 54, 48];
const CREAM = [250, 246, 237];
const CREAM_DEEP = [244, 238, 222];

async function loadJsPdf() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

function centered(pdf, text, y, size, style = "normal", color = INK, tracking = 0) {
  pdf.setFont("times", style);
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
  const t = tracking ? String(text).split("").join(" ".repeat(tracking)) : String(text);
  pdf.text(t, pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
}

// A small filled diamond, used as a rule ornament.
function diamond(pdf, cx, cy, r, color = GOLD) {
  pdf.setFillColor(...color);
  pdf.setDrawColor(...color);
  pdf.lines([[r, r], [-r, r], [-r, -r]], cx, cy - r, [1, 1], "F", true);
}

// A horizontal rule with a small diamond ornament at its center.
function rule(pdf, y, width = 30) {
  const w = pdf.internal.pageSize.getWidth();
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.3);
  const half = width / 2;
  const gap = 3.2;
  pdf.line(w / 2 - half, y, w / 2 - gap, y);
  pdf.line(w / 2 + gap, y, w / 2 + half, y);
  diamond(pdf, w / 2, y, 1.3);
}

// A chain of dots along an arc, tapering in size — used as a laurel-style
// flourish flanking the portrait, and for corner ornaments.
function dotArc(pdf, cx, cy, radius, startDeg, endDeg, steps, sizeStart, sizeEnd, color = GOLD_SOFT) {
  pdf.setFillColor(...color);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const deg = startDeg + (endDeg - startDeg) * t;
    const rad = (deg * Math.PI) / 180;
    const x = cx + radius * Math.cos(rad);
    const y = cy + radius * Math.sin(rad);
    const size = sizeStart + (sizeEnd - sizeStart) * t;
    pdf.circle(x, y, Math.max(size, 0.15), "F");
  }
}

// An L-shaped ornament with a curling dot-arc, mirrored into any of the
// four inner corners of the frame.
function cornerOrnament(pdf, x, y, size, corner) {
  const fx = corner.includes("r") ? -1 : 1;
  const fy = corner.includes("b") ? -1 : 1;
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.45);
  pdf.line(x, y, x + fx * size, y);
  pdf.line(x, y, x, y + fy * size);

  const baseDeg = corner === "tl" ? 180 : corner === "tr" ? 270 : corner === "bl" ? 90 : 0;
  dotArc(pdf, x + fx * size * 0.42, y + fy * size * 0.42, size * 0.42, baseDeg, baseDeg + 90, 10, 1.1, 0.25);

  pdf.setFillColor(...GOLD);
  pdf.circle(x + fx * size * 0.14, y + fy * size * 0.14, 0.9, "F");
}

function allCornerOrnaments(pdf, size = 15) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  cornerOrnament(pdf, 16, 16, size, "tl");
  cornerOrnament(pdf, w - 16, 16, size, "tr");
  cornerOrnament(pdf, 16, h - 16, size, "bl");
  cornerOrnament(pdf, w - 16, h - 16, size, "br");
}

// Concentric ring frame around the circular portrait, plus laurel-style
// dot flourishes on either side.
function photoFrame(pdf, cx, cy, diameter) {
  const r = diameter / 2;
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.6);
  pdf.circle(cx, cy, r + 3, "S");
  pdf.setLineWidth(0.25);
  pdf.circle(cx, cy, r + 5.2, "S");

  dotArc(pdf, cx, cy, r + 9, 200, 340, 14, 0.3, 1.6);
  dotArc(pdf, cx, cy, r + 9, -20, -160, 14, 0.3, 1.6);
}

// Fallback ornamental monogram, used when no invitation photo is uploaded.
function monogram(pdf, cx, cy, diameter, brideName, groomName) {
  const r = diameter / 2;
  pdf.setFillColor(...CREAM_DEEP);
  pdf.circle(cx, cy, r, "F");
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.6);
  pdf.circle(cx, cy, r, "S");
  pdf.setLineWidth(0.25);
  pdf.circle(cx, cy, r - 4, "S");

  const initials = `${(brideName || "B").trim()[0] || "B"}${(groomName || "G").trim()[0] || "G"}`.toUpperCase();
  pdf.setFont("times", "bolditalic");
  pdf.setFontSize(diameter * 0.42);
  pdf.setTextColor(...GOLD);
  pdf.text(initials, cx, cy + diameter * 0.13, { align: "center" });

  photoFrame(pdf, cx, cy, diameter);
}

// Prefer the locally-stored base64 copy (no CORS risk); fall back to the
// remote URL if the settings document predates that feature.
async function resolveImage(dataField, urlField, crop) {
  if (dataField) return loadCroppedImage(dataField, crop);
  if (urlField) return loadCroppedImage(urlField, crop);
  return null;
}

function paperBackground(pdf) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(...CREAM);
  pdf.rect(0, 0, w, h, "F");

  // Soft corner washes, echoing the site's "surface-paper" texture.
  pdf.setFillColor(...CREAM_DEEP);
  pdf.circle(-10, -10, 55, "F");
  pdf.circle(w + 10, h + 10, 60, "F");

  // Decorative double border frame.
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.6);
  pdf.rect(10, 10, w - 20, h - 20);
  pdf.setLineWidth(0.2);
  pdf.rect(14, 14, w - 28, h - 28);

  allCornerOrnaments(pdf);
}

export async function generateInvitationPdf(settings, guest) {
  const JsPDF = await loadJsPdf();
  const pdf = new JsPDF({ unit: "mm", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();

  paperBackground(pdf);

  const [invitationImage, dressCodeImage] = await Promise.all([
    resolveImage(settings.invitationImageData, settings.invitationImageUrl, "circle"),
    resolveImage(settings.dressCodeImageData, settings.dressCodeImageUrl, "square"),
  ]);

  let y = 40;

  // Top flourish
  dotArc(pdf, w / 2, y - 8, 14, 200, 340, 16, 0.3, 1.2);
  diamond(pdf, w / 2, y - 8, 1.6);

  // Names
  centered(pdf, `${settings.brideName || "Bride"}  &  ${settings.groomName || "Groom"}`, y + 8, 29, "bolditalic");
  y += 16;
  rule(pdf, y, 34);
  y += 11;
  centered(pdf, "T O G E T H E R   W I T H   T H E I R   F A M I L I E S", y, 8.5, "normal", GOLD);
  y += 4;
  centered(pdf, "REQUEST THE PLEASURE OF YOUR COMPANY", y + 6, 10.5, "normal", GOLD, 2.2);
  y += 20;

  // Portrait — uploaded photo if present, otherwise an ornamental monogram
  const diameter = 78;
  const cx = w / 2;
  const cy = y + diameter / 2;
  if (invitationImage) {
    pdf.setFillColor(...CREAM_DEEP);
    pdf.circle(cx, cy, diameter / 2 + 1.5, "F");
    pdf.addImage(invitationImage, "PNG", cx - diameter / 2, y, diameter, diameter);
    photoFrame(pdf, cx, cy, diameter);
  } else {
    monogram(pdf, cx, cy, diameter, settings.brideName, settings.groomName);
  }
  y += diameter + 16;

  // Date & time
  const dateLine = [formatWeddingDate(settings.weddingDate), settings.ceremonyTime]
    .filter(Boolean)
    .join(" · ");
  centered(pdf, dateLine || "Date to be confirmed", y, 18, "bolditalic");
  y += 9;
  rule(pdf, y, 34);
  y += 13;

  // Venue
  if (settings.venueName) {
    centered(pdf, settings.venueName.toUpperCase(), y, 13, "bold", INK, 0.6);
    y += 8;
  }
  if (settings.venueAddress) {
    pdf.setFont("times", "normal");
    pdf.setFontSize(11.5);
    pdf.setTextColor(...INK);
    const lines = pdf.splitTextToSize(settings.venueAddress, w - 74);
    pdf.text(lines, w / 2, y, { align: "center" });
    y += lines.length * 5.8 + 4;
  }

  // Reception (if present, as a secondary line)
  if (settings.receptionTime) {
    y += 5;
    centered(pdf, `Reception to follow at ${settings.receptionTime}`, y, 11, "italic");
    y += 2;
  }

  // Dress code
  if (settings.dressCode) {
    y += 12;
    rule(pdf, y, 18);
    y += 8;
    centered(pdf, `DRESS CODE`, y, 8.5, "normal", GOLD, 2);
    y += 6;
    centered(pdf, settings.dressCode, y, 12, "italic");
    if (dressCodeImage) {
      y += 6;
      const size = 24;
      const dcx = w / 2;
      const dcy = y + size / 2;
      pdf.setDrawColor(...GOLD);
      pdf.setLineWidth(0.35);
      pdf.roundedRect(dcx - size / 2 - 1, y - 1, size + 2, size + 2, 3, 3, "S");
      pdf.addImage(dressCodeImage, "PNG", dcx - size / 2, y, size, size);
      y += size + 4;
    }
  }

  // Reserved-for footer — ornamental panel
  if (guest) {
    const panelY = h - 40;
    const panelH = 22;
    pdf.setFillColor(...CREAM_DEEP);
    pdf.roundedRect(w / 2 - 55, panelY, 110, panelH, 3, 3, "F");
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(w / 2 - 55, panelY, 110, panelH, 3, 3, "S");
    diamond(pdf, w / 2 - 55, panelY, 1.1);
    diamond(pdf, w / 2 + 55, panelY, 1.1);
    diamond(pdf, w / 2 - 55, panelY + panelH, 1.1);
    diamond(pdf, w / 2 + 55, panelY + panelH, 1.1);

    centered(pdf, "RESERVED FOR", panelY + 8, 8.5, "normal", GOLD, 2);
    centered(
      pdf,
      `${guest.firstName} ${guest.surname} · ${guest.numberOfSeats} seat${guest.numberOfSeats > 1 ? "s" : ""}`,
      panelY + 17,
      12.5,
      "bold",
    );
  }

  return pdf;
}

export async function downloadInvitationPdf(settings, guest) {
  const pdf = await generateInvitationPdf(settings, guest);
  pdf.save(`wedding-invitation-${(guest?.surname || "guest").toLowerCase()}.pdf`);
}

export async function generateProgramPdf(settings) {
  const JsPDF = await loadJsPdf();
  const pdf = new JsPDF({ unit: "mm", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();

  paperBackground(pdf);

  centered(pdf, "ORDER OF THE DAY", 34, 10.5, "normal", GOLD, 3);
  diamond(pdf, w / 2, 40, 1.4);
  centered(pdf, `${settings.brideName || "Bride"} & ${settings.groomName || "Groom"}`, 53, 23, "bolditalic");
  centered(pdf, formatWeddingDate(settings.weddingDate), 63, 11.5, "italic");
  rule(pdf, 71, 34);

  let y = 90;
  const items = settings.programItems || [];
  items.forEach((item, i) => {
    // Gold medallion with the item's ordinal number.
    const medY = y - 3.4;
    pdf.setFillColor(...CREAM_DEEP);
    pdf.circle(24, medY, 5, "F");
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.35);
    pdf.circle(24, medY, 5, "S");
    pdf.setFont("times", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...GOLD);
    pdf.text(String(i + 1), 24, medY + 1.4, { align: "center" });

    pdf.setFont("times", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(...INK);
    pdf.text(String(item.time || ""), 35, y - 5.5);

    pdf.setFont("times", "bold");
    pdf.setFontSize(13);
    pdf.text(String(item.event || ""), 35, y);

    if (item.description) {
      y += 6;
      pdf.setFont("times", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...INK);
      const lines = pdf.splitTextToSize(item.description, w - 65);
      pdf.text(lines, 35, y);
      y += (lines.length - 1) * 5;
    }

    y += 8;
    if (i < items.length - 1) {
      pdf.setDrawColor(...GOLD_SOFT);
      pdf.setLineWidth(0.15);
      pdf.line(35, y, w - 24, y);
      y += 8;
    }
  });

  return pdf;
}

export async function downloadProgramPdf(settings) {
  const pdf = await generateProgramPdf(settings);
  pdf.save("wedding-program.pdf");
}

export async function programPdfBlob(settings) {
  const pdf = await generateProgramPdf(settings);
  return pdf.output("blob");
}