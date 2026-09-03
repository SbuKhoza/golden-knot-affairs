import { getColorScheme, getTemplateMeta } from "@/utils/pdfThemes";
import { buildInvitationHtml, buildProgramPages, PAGE_HEIGHT, PAGE_WIDTH } from "@/utils/pdfTemplates";

// Renders the wedding invitation/program as real HTML+CSS (actual Google
// Fonts, inline SVG flower/ring illustrations) and rasterizes that with
// html2canvas, then drops the resulting image into a jsPDF page, plus
// re-adds real clickable link annotations (e.g. "View on map") on top of
// the flattened image.

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap";

async function loadJsPdf() {
  const mod = await import("jspdf");
  return mod.jsPDF || mod.default?.jsPDF || mod.default;
}

async function loadHtml2Canvas() {
  const mod = await import("html2canvas");
  return mod.default || mod;
}

// Creates a blank, same-origin (srcdoc) iframe with its own document — one
// that never loads our app's Tailwind stylesheet. This is the actual fix
// for the "unsupported color function oklch" crash: html2canvas clones the
// whole document containing the target element, inlining computed styles
// from every ancestor (html, body, ...) as it goes. If that target lives in
// our real page, those ancestors carry our app's oklch()-based CSS
// variables and html2canvas's bundled color parser throws before it ever
// gets to run the `onclone` callback. An isolated iframe has no such
// ancestor styles to trip over.
function createRenderFrame() {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "-99999px";
    iframe.style.width = `${PAGE_WIDTH}px`;
    iframe.style.height = `${PAGE_HEIGHT}px`;
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    iframe.addEventListener("load", () => resolve(iframe), { once: true });
    iframe.srcdoc = '<!DOCTYPE html><html><head></head><body style="margin:0;padding:0;background:#ffffff;"></body></html>';
    document.body.appendChild(iframe);
  });
}

async function loadFontsInFrame(idoc) {
  await new Promise((resolve) => {
    const link = idoc.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
    idoc.head.appendChild(link);
    // Safety net in case the load event never fires (e.g. already cached).
    setTimeout(resolve, 1200);
  });
  if (idoc.fonts && idoc.fonts.ready) {
    await idoc.fonts.ready;
  }
  await new Promise((r) => setTimeout(r, 60));
}

// Converts a remote image URL to a data: URI via fetch+FileReader. This is
// what actually prevents a "tainted canvas" failure: an <img> pointed at a
// cross-origin URL that lacks CORS headers will silently poison the whole
// canvas the moment we call toDataURL(), aborting PDF generation. Once the
// bytes are pulled in as a data: URI, the image is same-origin as far as
// the canvas is concerned, no matter what the original host allows.
async function toDataUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("[pdf] Could not inline remote image, omitting it from the PDF:", url, err);
    return "";
  }
}

// Pre-resolves every settings/guest image field to a safe, same-origin
// data: URI (or "" if it can't be loaded) before we ever touch the DOM.
async function withSafeImages(settings) {
  const [invitationImageData, dressCodeImageData] = await Promise.all([
    toDataUrl(settings.invitationImageData || settings.invitationImageUrl),
    toDataUrl(settings.dressCodeImageData || settings.dressCodeImageUrl),
  ]);
  return {
    ...settings,
    invitationImageData,
    invitationImageUrl: "",
    dressCodeImageData,
    dressCodeImageUrl: "",
  };
}

function pxToMm(px, pageDimPx, pageDimMm) {
  return (px / pageDimPx) * pageDimMm;
}

// Mounts `html` inside a fresh isolated iframe, waits for its fonts and
// images to finish loading, rasterizes it at 2x scale for crisp
// print-quality output, and also measures any [data-pdf-link] elements so
// callers can re-add real clickable link annotations on top of the
// flattened image.
async function rasterizeHtml(html) {
  const html2canvas = await loadHtml2Canvas();
  const iframe = await createRenderFrame();
  const idoc = iframe.contentDocument;

  try {
    await loadFontsInFrame(idoc);

    const container = idoc.createElement("div");
    container.style.width = `${PAGE_WIDTH}px`;
    container.style.height = `${PAGE_HEIGHT}px`;
    container.innerHTML = html;
    idoc.body.appendChild(container);

    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
      ),
    );

    const containerRect = container.getBoundingClientRect();
    const links = Array.from(container.querySelectorAll("[data-pdf-link]")).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        url: el.getAttribute("data-pdf-link"),
        xMm: pxToMm(r.left - containerRect.left, PAGE_WIDTH, A4_WIDTH_MM),
        yMm: pxToMm(r.top - containerRect.top, PAGE_HEIGHT, A4_HEIGHT_MM),
        wMm: pxToMm(r.width, PAGE_WIDTH, A4_WIDTH_MM),
        hMm: pxToMm(r.height, PAGE_HEIGHT, A4_HEIGHT_MM),
      };
    });

    const canvas = await html2canvas(container, {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    return { imgData, links };
  } finally {
    iframe.remove();
  }
}

async function pdfFromPages(pageHtmls) {
  const JsPDF = await loadJsPdf();
  const pdf = new JsPDF({ unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pageHtmls.length; i++) {
    const { imgData, links } = await rasterizeHtml(pageHtmls[i]);
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH);
    links.forEach(({ url, xMm, yMm, wMm, hMm }) => {
      if (url) pdf.link(xMm, yMm, wMm, hMm, { url });
    });
  }
  return pdf;
}

export async function generateInvitationPdf(settings, guest) {
  try {
    const safeSettings = await withSafeImages(settings);
    const palette = getColorScheme(safeSettings.colorSchemeId).colors;
    const template = getTemplateMeta(safeSettings.templateId);
    const html = buildInvitationHtml(template.id, safeSettings, guest, palette);
    return await pdfFromPages([html]);
  } catch (err) {
    console.error("[pdf] Failed to generate invitation PDF:", err);
    throw err;
  }
}

export async function downloadInvitationPdf(settings, guest) {
  const pdf = await generateInvitationPdf(settings, guest);
  pdf.save(`wedding-invitation-${(guest?.surname || "guest").toLowerCase()}.pdf`);
}

export async function generateProgramPdf(settings) {
  try {
    const safeSettings = await withSafeImages(settings);
    const palette = getColorScheme(safeSettings.colorSchemeId).colors;
    const pages = buildProgramPages(safeSettings, palette);
    return await pdfFromPages(pages);
  } catch (err) {
    console.error("[pdf] Failed to generate program PDF:", err);
    throw err;
  }
}

export async function downloadProgramPdf(settings) {
  const pdf = await generateProgramPdf(settings);
  pdf.save("wedding-program.pdf");
}

export async function programPdfBlob(settings) {
  const pdf = await generateProgramPdf(settings);
  return pdf.output("blob");
}