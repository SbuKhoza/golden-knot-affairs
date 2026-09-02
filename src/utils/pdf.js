import { formatWeddingDate } from "@/utils/format";
import { loadCroppedImage } from "@/utils/image";
import { getColorScheme, DEFAULT_TEMPLATE_ID } from "@/utils/pdfThemes";

async function loadJsPdf() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

function centered(pdf, text, y, size, style = "normal", color, tracking = 0) {
  pdf.setFont("times", style);
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
  const t = tracking ? String(text).split("").join(" ".repeat(tracking)) : String(text);
  pdf.text(t, pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
}

// Same as `centered`, but aligned around an arbitrary x (for multi-column
// layouts) instead of the full page's horizontal center.
function centeredAt(pdf, text, x, y, size, style = "normal", color, tracking = 0) {
  pdf.setFont("times", style);
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
  const t = tracking ? String(text).split("").join(" ".repeat(tracking)) : String(text);
  pdf.text(t, x, y, { align: "center" });
}

// A small filled diamond, used as a rule ornament.
function diamond(pdf, cx, cy, r, color) {
  pdf.setFillColor(...color);
  pdf.setDrawColor(...color);
  pdf.lines(
    [
      [r, r],
      [-r, r],
      [-r, -r],
    ],
    cx,
    cy - r,
    [1, 1],
    "F",
    true,
  );
}

// A horizontal rule with a small diamond ornament at its center.
function rule(pdf, y, color, width = 30) {
  const w = pdf.internal.pageSize.getWidth();
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.3);
  const half = width / 2;
  const gap = 3.2;
  pdf.line(w / 2 - half, y, w / 2 - gap, y);
  pdf.line(w / 2 + gap, y, w / 2 + half, y);
  diamond(pdf, w / 2, y, 1.3, color);
}

// A chain of dots along an arc, tapering in size — used as a laurel-style
// flourish flanking the portrait, and for corner ornaments.
function dotArc(pdf, cx, cy, radius, startDeg, endDeg, steps, sizeStart, sizeEnd, color) {
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
function cornerOrnament(pdf, x, y, size, corner, c) {
  const fx = corner.includes("r") ? -1 : 1;
  const fy = corner.includes("b") ? -1 : 1;
  pdf.setDrawColor(...c.gold);
  pdf.setLineWidth(0.45);
  pdf.line(x, y, x + fx * size, y);
  pdf.line(x, y, x, y + fy * size);

  const baseDeg = corner === "tl" ? 180 : corner === "tr" ? 270 : corner === "bl" ? 90 : 0;
  dotArc(
    pdf,
    x + fx * size * 0.42,
    y + fy * size * 0.42,
    size * 0.42,
    baseDeg,
    baseDeg + 90,
    10,
    1.1,
    0.25,
    c.goldSoft,
  );

  pdf.setFillColor(...c.gold);
  pdf.circle(x + fx * size * 0.14, y + fy * size * 0.14, 0.9, "F");
}

function allCornerOrnaments(pdf, c, size = 15) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  cornerOrnament(pdf, 16, 16, size, "tl", c);
  cornerOrnament(pdf, w - 16, 16, size, "tr", c);
  cornerOrnament(pdf, 16, h - 16, size, "bl", c);
  cornerOrnament(pdf, w - 16, h - 16, size, "br", c);
}

// Concentric ring frame around the circular portrait, plus laurel-style
// dot flourishes on either side.
function photoFrame(pdf, cx, cy, diameter, c) {
  const r = diameter / 2;
  pdf.setDrawColor(...c.gold);
  pdf.setLineWidth(0.6);
  pdf.circle(cx, cy, r + 3, "S");
  pdf.setLineWidth(0.25);
  pdf.circle(cx, cy, r + 5.2, "S");

  dotArc(pdf, cx, cy, r + 9, 200, 340, 14, 0.3, 1.6, c.goldSoft);
  dotArc(pdf, cx, cy, r + 9, -20, -160, 14, 0.3, 1.6, c.goldSoft);
}

// Fallback ornamental monogram, used when no invitation photo is uploaded.
function monogram(pdf, cx, cy, diameter, brideName, groomName, c, { framed = true } = {}) {
  const r = diameter / 2;
  pdf.setFillColor(...c.creamDeep);
  pdf.circle(cx, cy, r, "F");
  pdf.setDrawColor(...c.gold);
  pdf.setLineWidth(0.6);
  pdf.circle(cx, cy, r, "S");
  pdf.setLineWidth(0.25);
  pdf.circle(cx, cy, r - 4, "S");

  const initials =
    `${(brideName || "B").trim()[0] || "B"}${(groomName || "G").trim()[0] || "G"}`.toUpperCase();
  pdf.setFont("times", "bolditalic");
  pdf.setFontSize(diameter * 0.42);
  pdf.setTextColor(...c.gold);
  pdf.text(initials, cx, cy + diameter * 0.13, { align: "center" });

  if (framed) photoFrame(pdf, cx, cy, diameter, c);
}

// Prefer the locally-stored base64 copy (no CORS risk); fall back to the
// remote URL if the settings document predates that feature.
async function resolveImage(dataField, urlField, crop) {
  if (dataField) return loadCroppedImage(dataField, crop);
  if (urlField) return loadCroppedImage(urlField, crop);
  return null;
}

function paperBackground(pdf, c, { bordered = true, ornamented = true } = {}) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(...c.cream);
  pdf.rect(0, 0, w, h, "F");

  // Soft corner washes, echoing the site's "surface-paper" texture.
  pdf.setFillColor(...c.creamDeep);
  pdf.circle(-10, -10, 55, "F");
  pdf.circle(w + 10, h + 10, 60, "F");

  if (bordered) {
    // Decorative double border frame.
    pdf.setDrawColor(...c.gold);
    pdf.setLineWidth(0.6);
    pdf.rect(10, 10, w - 20, h - 20);
    pdf.setLineWidth(0.2);
    pdf.rect(14, 14, w - 28, h - 28);
  }

  if (ornamented) allCornerOrnaments(pdf, c);
}

// Whether a lat/lng pair is present and usable for a maps deep-link.
function hasCoords(lat, lng) {
  return (
    lat !== "" &&
    lat != null &&
    lng !== "" &&
    lng != null &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng))
  );
}

function mapsUrlForCoords(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

// Renders a word-wrapped address centered around `x`. If coordinates were
// supplied by the admin, the whole block becomes a clickable link (opens the
// device's maps app) with a thin gold underline as a visual affordance;
// otherwise it's rendered as plain static text. Returns the height consumed.
function addressBlock(pdf, { text, x, y, c, lat, lng, maxWidth, fontSize = 11.5 }) {
  if (!text) return 0;
  pdf.setFont("times", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...c.ink);
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y, { align: "center" });

  const lineHeight = fontSize * 0.51;
  if (hasCoords(lat, lng)) {
    const url = mapsUrlForCoords(lat, lng);
    const blockWidth = Math.min(maxWidth + 8, maxWidth * 1.2);
    pdf.link(
      x - blockWidth / 2,
      y - fontSize * 0.42 - 1,
      blockWidth,
      lines.length * lineHeight + 2,
      { url },
    );

    const lastLine = lines[lines.length - 1];
    const lastLineWidth = pdf.getTextWidth(lastLine);
    const underlineY = y + (lines.length - 1) * lineHeight + fontSize * 0.16;
    pdf.setDrawColor(...c.gold);
    pdf.setLineWidth(0.2);
    pdf.line(x - lastLineWidth / 2, underlineY, x + lastLineWidth / 2, underlineY);
  }

  return lines.length * lineHeight;
}

// ---------------------------------------------------------------------------
// Template: Classic Ornamental — the original framed, corner-flourished look.
// ---------------------------------------------------------------------------
function renderClassicInvitation({ pdf, settings, guest, c, invitationImage, dressCodeImage }) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  paperBackground(pdf, c);

  let y = 34;

  dotArc(pdf, w / 2, y - 7, 13, 200, 340, 16, 0.3, 1.2, c.goldSoft);
  diamond(pdf, w / 2, y - 7, 1.6, c.gold);

  centered(
    pdf,
    `${settings.brideName || "Bride"}  &  ${settings.groomName || "Groom"}`,
    y + 7,
    27,
    "bolditalic",
    c.ink,
  );
  y += 14;
  rule(pdf, y, c.gold, 32);
  y += 9;
  centered(pdf, "T O G E T H E R   W I T H   T H E I R   F A M I L I E S", y, 8, "normal", c.gold);
  y += 4;
  centered(pdf, "REQUEST THE PLEASURE OF YOUR COMPANY", y + 5.5, 10, "normal", c.gold, 2.2);
  y += 16;

  const diameter = 62;
  const cx = w / 2;
  const cy = y + diameter / 2;
  if (invitationImage) {
    pdf.setFillColor(...c.creamDeep);
    pdf.circle(cx, cy, diameter / 2 + 1.5, "F");
    pdf.addImage(invitationImage, "PNG", cx - diameter / 2, y, diameter, diameter);
    photoFrame(pdf, cx, cy, diameter, c);
  } else {
    monogram(pdf, cx, cy, diameter, settings.brideName, settings.groomName, c);
  }
  y += diameter + 12;

  const dateLine = [formatWeddingDate(settings.weddingDate), settings.ceremonyTime]
    .filter(Boolean)
    .join(" · ");
  centered(pdf, dateLine || "Date to be confirmed", y, 16, "bolditalic", c.ink);
  y += 8;
  rule(pdf, y, c.gold, 32);
  y += 10;

  // Ceremony venue
  if (settings.venueName) {
    centered(pdf, settings.venueName.toUpperCase(), y, 11.5, "bold", c.ink, 0.6);
    y += 6.5;
  }
  if (settings.venueAddress) {
    y += addressBlock(pdf, {
      text: settings.venueAddress,
      x: w / 2,
      y,
      c,
      lat: settings.venueLat,
      lng: settings.venueLng,
      maxWidth: w - 80,
      fontSize: 10.5,
    });
    y += 3;
  }

  // Reception — its own venue block, shown whenever any reception detail exists.
  const hasReception =
    settings.receptionTime || settings.receptionVenueName || settings.receptionVenueAddress;
  if (hasReception) {
    y += 5;
    rule(pdf, y, c.goldSoft, 16);
    y += 6.5;
    centered(pdf, "RECEPTION", y, 8, "normal", c.gold, 2);
    y += 6;
    if (settings.receptionTime) {
      centered(pdf, settings.receptionTime, y, 11.5, "italic", c.ink);
      y += 6;
    }
    if (settings.receptionVenueName) {
      centered(pdf, settings.receptionVenueName.toUpperCase(), y, 10.5, "bold", c.ink, 0.5);
      y += 6;
    }
    if (settings.receptionVenueAddress) {
      y += addressBlock(pdf, {
        text: settings.receptionVenueAddress,
        x: w / 2,
        y,
        c,
        lat: settings.receptionVenueLat,
        lng: settings.receptionVenueLng,
        maxWidth: w - 80,
        fontSize: 10,
      });
      y += 2;
    }
  }

  // Dress code
  if (settings.dressCode) {
    y += 8;
    rule(pdf, y, c.gold, 16);
    y += 6.5;
    centered(pdf, "DRESS CODE", y, 8, "normal", c.gold, 2);
    y += 5.5;
    centered(pdf, settings.dressCode, y, 11.5, "italic", c.ink);
    if (dressCodeImage) {
      y += 5.5;
      const size = 20;
      const dcx = w / 2;
      pdf.setDrawColor(...c.gold);
      pdf.setLineWidth(0.35);
      pdf.roundedRect(dcx - size / 2 - 1, y - 1, size + 2, size + 2, 3, 3, "S");
      pdf.addImage(dressCodeImage, "PNG", dcx - size / 2, y, size, size);
      y += size + 3;
    }
  }

  // Reserved-for footer — ornamental panel, pinned near the bottom.
  if (guest) {
    const panelY = Math.max(y + 8, h - 34);
    const panelH = 20;
    pdf.setFillColor(...c.creamDeep);
    pdf.roundedRect(w / 2 - 55, panelY, 110, panelH, 3, 3, "F");
    pdf.setDrawColor(...c.gold);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(w / 2 - 55, panelY, 110, panelH, 3, 3, "S");
    diamond(pdf, w / 2 - 55, panelY, 1.1, c.gold);
    diamond(pdf, w / 2 + 55, panelY, 1.1, c.gold);
    diamond(pdf, w / 2 - 55, panelY + panelH, 1.1, c.gold);
    diamond(pdf, w / 2 + 55, panelY + panelH, 1.1, c.gold);

    centered(pdf, "RESERVED FOR", panelY + 7.5, 8, "normal", c.gold, 2);
    centered(
      pdf,
      `${guest.firstName} ${guest.surname} · ${guest.numberOfSeats} seat${guest.numberOfSeats > 1 ? "s" : ""}`,
      panelY + 15.5,
      12,
      "bold",
      c.ink,
    );
  }
}

// ---------------------------------------------------------------------------
// Template: Modern Minimal — no border/corners, compact two-column body.
// ---------------------------------------------------------------------------
function renderModernInvitation({ pdf, settings, guest, c, invitationImage, dressCodeImage }) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  paperBackground(pdf, c, { bordered: false, ornamented: false });

  // Thin top rule as the only ornament.
  pdf.setDrawColor(...c.gold);
  pdf.setLineWidth(0.5);
  pdf.line(w / 2 - 16, 22, w / 2 + 16, 22);

  let y = 42;
  centered(pdf, "YOU ARE INVITED TO CELEBRATE", y, 9, "normal", c.gold, 2.4);
  y += 14;
  centered(
    pdf,
    `${settings.brideName || "Bride"} & ${settings.groomName || "Groom"}`,
    y,
    30,
    "bold",
    c.ink,
  );
  y += 14;

  const diameter = 48;
  const cx = w / 2;
  const cy = y + diameter / 2;
  if (invitationImage) {
    pdf.setDrawColor(...c.gold);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(cx - diameter / 2 - 1.5, y - 1.5, diameter + 3, diameter + 3, 4, 4, "S");
    pdf.addImage(invitationImage, "PNG", cx - diameter / 2, y, diameter, diameter);
  } else {
    monogram(pdf, cx, cy, diameter, settings.brideName, settings.groomName, c, { framed: false });
  }
  y += diameter + 14;

  const dateLine = [formatWeddingDate(settings.weddingDate), settings.ceremonyTime]
    .filter(Boolean)
    .join(" · ");
  centered(pdf, dateLine || "Date to be confirmed", y, 14, "bold", c.ink);
  y += 12;

  // Two-column compact detail grid — keeps the page from running out of
  // things to say on one side while the other half sits empty.
  const colGap = 10;
  const colWidth = (w - 60 - colGap) / 2;
  const leftX = 30;
  const rightX = 30 + colWidth + colGap;
  let leftY = y;
  let rightY = y;

  function columnHeading(x, yy, label) {
    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...c.gold);
    pdf.text(label.toUpperCase(), x, yy, { align: "left", charSpace: 1.4 });
  }

  // Left column — ceremony
  columnHeading(leftX, leftY, "Ceremony");
  leftY += 6;
  if (settings.venueName) {
    pdf.setFont("times", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...c.ink);
    const nameLines = pdf.splitTextToSize(settings.venueName, colWidth);
    pdf.text(nameLines, leftX, leftY);
    leftY += nameLines.length * 5.2;
  }
  if (settings.venueAddress) {
    pdf.setFont("times", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...c.ink);
    const lines = pdf.splitTextToSize(settings.venueAddress, colWidth);
    pdf.text(lines, leftX, leftY);
    if (hasCoords(settings.venueLat, settings.venueLng)) {
      pdf.link(leftX - 1, leftY - 4.5, colWidth + 2, lines.length * 4.6 + 3, {
        url: mapsUrlForCoords(settings.venueLat, settings.venueLng),
      });
      pdf.setDrawColor(...c.gold);
      pdf.setLineWidth(0.2);
      const lastW = pdf.getTextWidth(lines[lines.length - 1]);
      pdf.line(
        leftX,
        leftY + (lines.length - 1) * 4.6 + 1.4,
        leftX + lastW,
        leftY + (lines.length - 1) * 4.6 + 1.4,
      );
    }
    leftY += lines.length * 4.6;
  }

  // Right column — reception
  const hasReception =
    settings.receptionTime || settings.receptionVenueName || settings.receptionVenueAddress;
  if (hasReception) {
    columnHeading(rightX, rightY, "Reception");
    rightY += 6;
    if (settings.receptionTime) {
      pdf.setFont("times", "italic");
      pdf.setFontSize(11);
      pdf.setTextColor(...c.ink);
      pdf.text(settings.receptionTime, rightX, rightY);
      rightY += 5.2;
    }
    if (settings.receptionVenueName) {
      pdf.setFont("times", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...c.ink);
      const nameLines = pdf.splitTextToSize(settings.receptionVenueName, colWidth);
      pdf.text(nameLines, rightX, rightY);
      rightY += nameLines.length * 5.2;
    }
    if (settings.receptionVenueAddress) {
      pdf.setFont("times", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(...c.ink);
      const lines = pdf.splitTextToSize(settings.receptionVenueAddress, colWidth);
      pdf.text(lines, rightX, rightY);
      if (hasCoords(settings.receptionVenueLat, settings.receptionVenueLng)) {
        pdf.link(rightX - 1, rightY - 4.5, colWidth + 2, lines.length * 4.6 + 3, {
          url: mapsUrlForCoords(settings.receptionVenueLat, settings.receptionVenueLng),
        });
        pdf.setDrawColor(...c.gold);
        pdf.setLineWidth(0.2);
        const lastW = pdf.getTextWidth(lines[lines.length - 1]);
        pdf.line(
          rightX,
          rightY + (lines.length - 1) * 4.6 + 1.4,
          rightX + lastW,
          rightY + (lines.length - 1) * 4.6 + 1.4,
        );
      }
      rightY += lines.length * 4.6;
    }
  }

  y = Math.max(leftY, rightY) + 10;

  if (settings.dressCode) {
    pdf.setDrawColor(...c.goldSoft);
    pdf.setLineWidth(0.3);
    pdf.line(30, y, w - 30, y);
    y += 8;
    columnHeading(30, y, "Dress code");
    pdf.setFont("times", "italic");
    pdf.setFontSize(11);
    pdf.setTextColor(...c.ink);
    pdf.text(settings.dressCode, 30, y + 6);
    if (dressCodeImage) {
      const size = 16;
      pdf.addImage(dressCodeImage, "PNG", w - 30 - size, y - 4, size, size);
    }
    y += 14;
  }

  if (settings.weddingMessage) {
    pdf.setDrawColor(...c.goldSoft);
    pdf.setLineWidth(0.3);
    pdf.line(30, y, w - 30, y);
    y += 8;
    pdf.setFont("times", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(...c.ink);
    const lines = pdf.splitTextToSize(settings.weddingMessage, w - 60);
    pdf.text(lines, 30, y);
    y += lines.length * 5;
  }

  if (guest) {
    const panelY = Math.max(y + 6, h - 30);
    pdf.setDrawColor(...c.gold);
    pdf.setLineWidth(0.4);
    pdf.line(30, panelY, w - 30, panelY);
    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...c.gold);
    pdf.text("RESERVED FOR", 30, panelY + 7, { charSpace: 1.4 });
    pdf.setFont("times", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...c.ink);
    pdf.text(
      `${guest.firstName} ${guest.surname} · ${guest.numberOfSeats} seat${guest.numberOfSeats > 1 ? "s" : ""}`,
      30,
      panelY + 14,
    );
  }
}

// ---------------------------------------------------------------------------
// Template: Botanical Panel — soft banded header, compact two-column cards.
// ---------------------------------------------------------------------------
function renderBotanicalInvitation({ pdf, settings, guest, c, invitationImage, dressCodeImage }) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  paperBackground(pdf, c, { bordered: false, ornamented: false });

  // Soft banded header panel.
  const bandH = 78;
  pdf.setFillColor(...c.creamDeep);
  pdf.rect(0, 0, w, bandH, "F");
  pdf.setDrawColor(...c.gold);
  pdf.setLineWidth(0.4);
  pdf.line(0, bandH, w, bandH);

  const diameter = 46;
  const cx = w / 2;
  const cy = 16 + diameter / 2;
  if (invitationImage) {
    pdf.setFillColor(...c.cream);
    pdf.circle(cx, cy, diameter / 2 + 1.5, "F");
    pdf.addImage(invitationImage, "PNG", cx - diameter / 2, 16, diameter, diameter);
    photoFrame(pdf, cx, cy, diameter, c);
  } else {
    monogram(pdf, cx, cy, diameter, settings.brideName, settings.groomName, c);
  }

  centered(
    pdf,
    `${settings.brideName || "Bride"}  &  ${settings.groomName || "Groom"}`,
    bandH - 6,
    15,
    "bolditalic",
    c.ink,
  );

  let y = bandH + 12;
  const dateLine = [formatWeddingDate(settings.weddingDate), settings.ceremonyTime]
    .filter(Boolean)
    .join(" · ");
  centered(pdf, dateLine || "Date to be confirmed", y, 15, "bold", c.ink);
  y += 6;
  rule(pdf, y, c.gold, 26);
  y += 12;

  // Compact two-column card layout for ceremony / reception, side by side —
  // this is what keeps the lower half of the page from sitting empty.
  const gap = 8;
  const colWidth = (w - 40 - gap) / 2;
  const leftX = 20;
  const rightX = 20 + colWidth + gap;
  const cardTop = y;

  function venueCard(x, label, name, address, lat, lng, time) {
    const centerX = x + colWidth / 2;
    let cardY = cardTop + 7;
    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...c.gold);
    centeredAt(pdf, label.toUpperCase(), centerX, cardY, 8, "normal", c.gold, 1.6);
    cardY += 9;
    if (time) {
      centeredAt(pdf, time, centerX, cardY, 10.5, "italic", c.ink);
      cardY += 6;
    }
    if (name) {
      pdf.setFont("times", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(...c.ink);
      const nameLines = pdf.splitTextToSize(name, colWidth - 8);
      pdf.text(nameLines, centerX, cardY, { align: "center" });
      cardY += nameLines.length * 5;
    }
    if (address) {
      cardY += addressBlock(pdf, {
        text: address,
        x: centerX,
        y: cardY,
        c,
        lat,
        lng,
        maxWidth: colWidth - 10,
        fontSize: 9.5,
      });
      cardY += 3;
    }
    return cardY;
  }

  const hasReception =
    settings.receptionTime || settings.receptionVenueName || settings.receptionVenueAddress;
  const leftBottom = venueCard(
    leftX,
    "Ceremony",
    settings.venueName,
    settings.venueAddress,
    settings.venueLat,
    settings.venueLng,
    null,
  );
  const rightBottom = hasReception
    ? venueCard(
        rightX,
        "Reception",
        settings.receptionVenueName,
        settings.receptionVenueAddress,
        settings.receptionVenueLat,
        settings.receptionVenueLng,
        settings.receptionTime,
      )
    : cardTop + 20;

  // Card borders drawn after content so height can adapt to the taller side.
  const cardH = Math.max(leftBottom, rightBottom) - cardTop + 6;
  pdf.setDrawColor(...c.goldSoft);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(leftX, cardTop - 4, colWidth, cardH, 3, 3, "S");
  if (hasReception) pdf.roundedRect(rightX, cardTop - 4, colWidth, cardH, 3, 3, "S");

  y = cardTop + cardH + 10;

  if (settings.dressCode) {
    rule(pdf, y, c.gold, 16);
    y += 7;
    centered(pdf, "DRESS CODE", y, 8, "normal", c.gold, 2);
    y += 6;
    centered(pdf, settings.dressCode, y, 11.5, "italic", c.ink);
    if (dressCodeImage) {
      y += 5;
      const size = 18;
      pdf.setDrawColor(...c.gold);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(w / 2 - size / 2 - 1, y - 1, size + 2, size + 2, 3, 3, "S");
      pdf.addImage(dressCodeImage, "PNG", w / 2 - size / 2, y, size, size);
      y += size + 3;
    }
  }

  if (settings.weddingMessage) {
    y += 8;
    pdf.setFont("times", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(...c.ink);
    const lines = pdf.splitTextToSize(settings.weddingMessage, w - 70);
    pdf.text(lines, w / 2, y, { align: "center" });
    y += lines.length * 5;
  }

  if (guest) {
    const panelY = Math.max(y + 6, h - 30);
    const panelH = 18;
    pdf.setFillColor(...c.creamDeep);
    pdf.roundedRect(w / 2 - 50, panelY, 100, panelH, 3, 3, "F");
    pdf.setDrawColor(...c.gold);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(w / 2 - 50, panelY, 100, panelH, 3, 3, "S");
    centered(pdf, "RESERVED FOR", panelY + 6.5, 7.5, "normal", c.gold, 1.8);
    centered(
      pdf,
      `${guest.firstName} ${guest.surname} · ${guest.numberOfSeats} seat${guest.numberOfSeats > 1 ? "s" : ""}`,
      panelY + 13.5,
      11.5,
      "bold",
      c.ink,
    );
  }
}

const TEMPLATE_RENDERERS = {
  classic: renderClassicInvitation,
  modern: renderModernInvitation,
  botanical: renderBotanicalInvitation,
};

export async function generateInvitationPdf(settings, guest) {
  const JsPDF = await loadJsPdf();
  const pdf = new JsPDF({ unit: "mm", format: "a4" });
  const c = getColorScheme(settings.pdfColorScheme).colors;

  const [invitationImage, dressCodeImage] = await Promise.all([
    resolveImage(settings.invitationImageData, settings.invitationImageUrl, "circle"),
    resolveImage(settings.dressCodeImageData, settings.dressCodeImageUrl, "square"),
  ]);

  const renderer =
    TEMPLATE_RENDERERS[settings.pdfTemplate] || TEMPLATE_RENDERERS[DEFAULT_TEMPLATE_ID];
  renderer({ pdf, settings, guest, c, invitationImage, dressCodeImage });

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
  const c = getColorScheme(settings.pdfColorScheme).colors;

  paperBackground(pdf, c);

  centered(pdf, "ORDER OF THE DAY", 34, 10.5, "normal", c.gold, 3);
  diamond(pdf, w / 2, 40, 1.4, c.gold);
  centered(
    pdf,
    `${settings.brideName || "Bride"} & ${settings.groomName || "Groom"}`,
    53,
    23,
    "bolditalic",
    c.ink,
  );
  centered(pdf, formatWeddingDate(settings.weddingDate), 63, 11.5, "italic", c.ink);
  rule(pdf, 71, c.gold, 34);

  let y = 90;
  const items = settings.programItems || [];
  items.forEach((item, i) => {
    // Gold medallion with the item's ordinal number.
    const medY = y - 3.4;
    pdf.setFillColor(...c.creamDeep);
    pdf.circle(24, medY, 5, "F");
    pdf.setDrawColor(...c.gold);
    pdf.setLineWidth(0.35);
    pdf.circle(24, medY, 5, "S");
    pdf.setFont("times", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...c.gold);
    pdf.text(String(i + 1), 24, medY + 1.4, { align: "center" });

    pdf.setFont("times", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(...c.ink);
    pdf.text(String(item.time || ""), 35, y - 5.5);

    pdf.setFont("times", "bold");
    pdf.setFontSize(13);
    pdf.text(String(item.event || ""), 35, y);

    if (item.description) {
      y += 6;
      pdf.setFont("times", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...c.ink);
      const lines = pdf.splitTextToSize(item.description, w - 65);
      pdf.text(lines, 35, y);
      y += (lines.length - 1) * 5;
    }

    y += 8;
    if (i < items.length - 1) {
      pdf.setDrawColor(...c.goldSoft);
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