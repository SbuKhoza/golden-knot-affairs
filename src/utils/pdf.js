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

  let y = 45;
  centered(pdf, "TOGETHER WITH THEIR FAMILIES", y, 11);
  y += 22;
  centered(pdf, settings.brideName || "Bride", y, 30, "italic");
  y += 14;
  centered(pdf, "&", y, 16);
  y += 16;
  centered(pdf, settings.groomName || "Groom", y, 30, "italic");
  y += 20;
  centered(pdf, "request the pleasure of your company", y, 12);
  y += 18;
  centered(pdf, formatWeddingDate(settings.weddingDate), y, 15, "bold");
  if (settings.ceremonyTime) {
    y += 10;
    centered(pdf, `Ceremony at ${settings.ceremonyTime}`, y, 12);
  }
  if (settings.receptionTime) {
    y += 8;
    centered(pdf, `Reception at ${settings.receptionTime}`, y, 12);
  }
  y += 16;
  if (settings.venueName) centered(pdf, settings.venueName, y, 14, "bold");
  if (settings.venueAddress) {
    y += 8;
    pdf.setFont("times", "normal");
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(settings.venueAddress, w - 60);
    pdf.text(lines, w / 2, y, { align: "center" });
    y += lines.length * 6;
  }
  if (settings.dressCode) {
    y += 12;
    centered(pdf, `Dress code: ${settings.dressCode}`, y, 11, "italic");
  }
  if (guest) {
    y += 20;
    centered(pdf, "Reserved for", y, 10);
    y += 9;
    centered(pdf, `${guest.firstName} ${guest.surname}`, y, 16, "bold");
    y += 8;
    centered(pdf, `${guest.numberOfSeats} seat${guest.numberOfSeats > 1 ? "s" : ""}`, y, 11);
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
