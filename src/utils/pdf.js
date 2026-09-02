import { formatWeddingDate } from "@/utils/format";

async function loadJsPdf() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

function centered(pdf, text, y, size, style = "normal") {
  pdf.setFont("times", style);
  pdf.setFontSize(size);
  pdf.text(String(text), pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
}

function wrapped(pdf, text, y, size, maxWidth) {
  pdf.setFont("times", "normal");
  pdf.setFontSize(size);
  const lines = pdf.splitTextToSize(String(text), maxWidth);
  pdf.text(lines, pdf.internal.pageSize.getWidth() / 2, y, { align: "center" });
  return lines.length * (size * 0.42);
}

/** Loads an image URL into a data URL so jsPDF can embed it. */
async function loadImage(url) {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error("image-fetch-failed");
  const blob = await response.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const size = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
  const format = blob.type.includes("png") ? "PNG" : blob.type.includes("webp") ? "WEBP" : "JPEG";
  return { dataUrl, format, ...size };
}

function venuePair(settings) {
  const ceremony = {
    name: settings.ceremonyVenueName || settings.venueName || "",
    address: settings.ceremonyVenueAddress || settings.venueAddress || "",
  };
  const reception = {
    name: settings.receptionVenueName || "",
    address: settings.receptionVenueAddress || "",
  };
  return { ceremony, reception };
}

export async function generateInvitationPdf(settings, guest) {
  const JsPDF = await loadJsPdf();
  const pdf = new JsPDF({ unit: "mm", format: "a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();

  pdf.setFillColor(251, 248, 243);
  pdf.rect(0, 0, w, h, "F");
  pdf.setDrawColor(176, 148, 96);
  pdf.setLineWidth(0.6);
  pdf.rect(12, 12, w - 24, h - 24);
  pdf.setLineWidth(0.2);
  pdf.rect(15, 15, w - 30, h - 30);

  let y = 30;

  if (settings.invitationImageUrl) {
    try {
      const image = await loadImage(settings.invitationImageUrl);
      const maxW = w - 50;
      const maxH = 70;
      const ratio = Math.min(maxW / image.width, maxH / image.height);
      const drawW = image.width * ratio;
      const drawH = image.height * ratio;
      pdf.addImage(image.dataUrl, image.format, (w - drawW) / 2, y, drawW, drawH);
      y += drawH + 12;
    } catch {
      /* fall back to a text-only invitation */
    }
  }

  centered(pdf, "TOGETHER WITH THEIR FAMILIES", y, 11);
  y += 20;
  centered(pdf, settings.brideName || "Bride", y, 28, "italic");
  y += 12;
  centered(pdf, "&", y, 15);
  y += 14;
  centered(pdf, settings.groomName || "Groom", y, 28, "italic");
  y += 16;
  centered(pdf, "request the pleasure of your company", y, 12);
  y += 14;
  centered(pdf, formatWeddingDate(settings.weddingDate), y, 15, "bold");

  const { ceremony, reception } = venuePair(settings);

  if (ceremony.name || settings.ceremonyTime) {
    y += 14;
    centered(pdf, "CEREMONY", y, 9);
    if (settings.ceremonyTime) {
      y += 7;
      centered(pdf, settings.ceremonyTime, y, 12);
    }
    if (ceremony.name) {
      y += 7;
      centered(pdf, ceremony.name, y, 13, "bold");
    }
    if (ceremony.address) {
      y += 6;
      y += wrapped(pdf, ceremony.address, y, 10, w - 70);
    }
  }

  if (reception.name || settings.receptionTime) {
    y += 12;
    centered(pdf, "RECEPTION", y, 9);
    if (settings.receptionTime) {
      y += 7;
      centered(pdf, settings.receptionTime, y, 12);
    }
    if (reception.name) {
      y += 7;
      centered(pdf, reception.name, y, 13, "bold");
    }
    if (reception.address) {
      y += 6;
      y += wrapped(pdf, reception.address, y, 10, w - 70);
    }
  }

  if (settings.dressCode) {
    y += 12;
    centered(pdf, `Dress code: ${settings.dressCode}`, y, 11, "italic");
  }

  if (guest) {
    y += 16;
    centered(pdf, "Reserved for", y, 10);
    y += 8;
    centered(pdf, `${guest.firstName} ${guest.surname}`, y, 16, "bold");
    y += 7;
    centered(pdf, `${guest.numberOfSeats} seat${guest.numberOfSeats > 1 ? "s" : ""}`, y, 11);
    if (guest.tableNumber) {
      y += 7;
      centered(pdf, `Table ${guest.tableNumber}`, y, 12, "bold");
    }
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
  pdf.setFillColor(251, 248, 243);
  pdf.rect(0, 0, w, pdf.internal.pageSize.getHeight(), "F");
  pdf.setDrawColor(176, 148, 96);
  pdf.rect(12, 12, w - 24, pdf.internal.pageSize.getHeight() - 24);

  centered(pdf, "ORDER OF THE DAY", 38, 12);
  centered(pdf, `${settings.brideName || "Bride"} & ${settings.groomName || "Groom"}`, 55, 26, "italic");
  centered(pdf, formatWeddingDate(settings.weddingDate), 66, 12);

  let y = 90;
  (settings.programItems || []).forEach((item) => {
    pdf.setFont("times", "bold");
    pdf.setFontSize(13);
    pdf.text(String(item.time || ""), 30, y);
    pdf.setFont("times", "normal");
    pdf.text(String(item.event || ""), 60, y);
    if (item.description) {
      y += 6;
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(item.description, w - 90);
      pdf.text(lines, 60, y);
      y += (lines.length - 1) * 5;
    }
    y += 12;
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
