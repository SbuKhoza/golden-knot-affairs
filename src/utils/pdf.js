// src/utils/pdf.js

import {
  getColorScheme,
  getTemplateMeta,
} from "@/utils/pdfThemes";

import {
  buildInvitationHtml,
  buildProgramPages,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  INVITATION_PAGE_HEIGHT,
  INVITATION_PAGE_WIDTH,
} from "@/utils/pdfTemplates";

/*
 * The wedding-program pages are a plain, tall A4 portrait sheet. The
 * millimetre height is derived from the pixel canvas so the proportions
 * always match exactly.
 */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM =
  (A4_WIDTH_MM * PAGE_HEIGHT) / PAGE_WIDTH;

/*
 * The invitation renders landscape — true A4 landscape (297 x 210mm) — so a
 * printed page reads left/right the way the two-column layout is designed,
 * rather than needing to be a tall single column.
 */
const INVITATION_WIDTH_MM = 297;
const INVITATION_HEIGHT_MM =
  (INVITATION_WIDTH_MM * INVITATION_PAGE_HEIGHT) / INVITATION_PAGE_WIDTH;

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Karla:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500;1,600&display=swap";

/* -------------------------------------------------------------------------- */
/* Libraries                                                                  */
/* -------------------------------------------------------------------------- */

async function loadJsPdf() {
  const mod = await import("jspdf");

  return (
    mod.jsPDF ||
    mod.default?.jsPDF ||
    mod.default
  );
}

async function loadHtml2Canvas() {
  const mod = await import("html2canvas");

  return mod.default || mod;
}

/* -------------------------------------------------------------------------- */
/* Isolated rendering iframe                                                  */
/* -------------------------------------------------------------------------- */

function createRenderFrame(widthPx, heightPx) {
  return new Promise((resolve) => {
    const iframe =
      document.createElement("iframe");

    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "-99999px";

    iframe.style.width =
      `${widthPx}px`;

    iframe.style.height =
      `${heightPx}px`;

    iframe.style.border = "0";

    iframe.setAttribute(
      "aria-hidden",
      "true",
    );

    iframe.addEventListener(
      "load",
      () => resolve(iframe),
      { once: true },
    );

    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
        <head></head>
        <body
          style="
            margin:0;
            padding:0;
            background:#ffffff;
          "
        ></body>
      </html>
    `;

    document.body.appendChild(iframe);
  });
}

/* -------------------------------------------------------------------------- */
/* Fonts                                                                      */
/* -------------------------------------------------------------------------- */

async function loadFontsInFrame(idoc) {
  await new Promise((resolve) => {
    const link =
      idoc.createElement("link");

    link.rel = "stylesheet";
    link.href = FONT_HREF;

    link.addEventListener(
      "load",
      resolve,
      { once: true },
    );

    link.addEventListener(
      "error",
      resolve,
      { once: true },
    );

    idoc.head.appendChild(link);

    setTimeout(
      resolve,
      1500,
    );
  });

  if (
    idoc.fonts &&
    idoc.fonts.ready
  ) {
    await idoc.fonts.ready;
  }

  await new Promise((resolve) =>
    setTimeout(resolve, 120),
  );
}

/* -------------------------------------------------------------------------- */
/* Remote image -> data URL                                                   */
/* -------------------------------------------------------------------------- */

async function toDataUrl(url) {
  if (!url) return "";

  if (
    url.startsWith("data:")
  ) {
    return url;
  }

  try {
    const res = await fetch(
      url,
      {
        mode:"cors",
      },
    );

    if (!res.ok) {
      throw new Error(
        `Image fetch failed: ${res.status}`,
      );
    }

    const blob =
      await res.blob();

    return await new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(reader.result);

        reader.onerror =
          reject;

        reader.readAsDataURL(
          blob,
        );
      },
    );
  } catch (err) {
    console.warn(
      "[pdf] Could not inline remote image:",
      url,
      err,
    );

    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Resolve all images before rendering                                        */
/* -------------------------------------------------------------------------- */

async function withSafeImages(
  settings,
) {
  const [
    invitationImageData,
    dressCodeImageData,
    backgroundImageData,
  ] = await Promise.all([
    toDataUrl(
      settings.invitationImageData ||
        settings.invitationImageUrl,
    ),

    toDataUrl(
      settings.dressCodeImageData ||
        settings.dressCodeImageUrl,
    ),

    toDataUrl(
      settings.backgroundImageData ||
        settings.backgroundImageUrl,
    ),
  ]);

  return {
    ...settings,

    invitationImageData,

    invitationImageUrl:"",

    dressCodeImageData,

    dressCodeImageUrl:"",

    backgroundImageData,

    backgroundImageUrl:"",
  };
}

/* -------------------------------------------------------------------------- */
/* Coordinates                                                                 */
/* -------------------------------------------------------------------------- */

function pxToMm(
  px,
  pageDimPx,
  pageDimMm,
) {
  return (
    (px / pageDimPx) *
    pageDimMm
  );
}

/* -------------------------------------------------------------------------- */
/* Rasterize HTML                                                              */
/* -------------------------------------------------------------------------- */

async function rasterizeHtml(
  html,
  { widthPx, heightPx, widthMm, heightMm },
) {
  const html2canvas =
    await loadHtml2Canvas();

  const iframe =
    await createRenderFrame(widthPx, heightPx);

  const idoc =
    iframe.contentDocument;

  try {
    await loadFontsInFrame(idoc);

    const container =
      idoc.createElement("div");

    container.style.width =
      `${widthPx}px`;

    container.style.height =
      `${heightPx}px`;

    container.style.position =
      "relative";

    container.innerHTML =
      html;

    idoc.body.appendChild(
      container,
    );

    /* -------------------------------------------------------------- */
    /* Wait for all images                                             */
    /* -------------------------------------------------------------- */

    const images =
      Array.from(
        container.querySelectorAll(
          "img",
        ),
      );

    await Promise.all(
      images.map((img) => {
        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise(
          (resolve) => {
            img.addEventListener(
              "load",
              resolve,
              { once:true },
            );

            img.addEventListener(
              "error",
              resolve,
              { once:true },
            );
          },
        );
      }),
    );

    /* -------------------------------------------------------------- */
    /* Allow layout to settle                                         */
    /* -------------------------------------------------------------- */

    await new Promise((resolve) =>
      requestAnimationFrame(
        () =>
          requestAnimationFrame(
            resolve,
          ),
      ),
    );

    /* -------------------------------------------------------------- */
    /* Clickable PDF links                                            */
    /* -------------------------------------------------------------- */

    const containerRect =
      container.getBoundingClientRect();

    const links =
      Array.from(
        container.querySelectorAll(
          "[data-pdf-link]",
        ),
      ).map((el) => {
        const r =
          el.getBoundingClientRect();

        return {
          url:
            el.getAttribute(
              "data-pdf-link",
            ),

          xMm:
            pxToMm(
              r.left -
                containerRect.left,
              widthPx,
              widthMm,
            ),

          yMm:
            pxToMm(
              r.top -
                containerRect.top,
              heightPx,
              heightMm,
            ),

          wMm:
            pxToMm(
              r.width,
              widthPx,
              widthMm,
            ),

          hMm:
            pxToMm(
              r.height,
              heightPx,
              heightMm,
            ),
        };
      });

    /* -------------------------------------------------------------- */
    /* High-resolution rasterization                                  */
    /* -------------------------------------------------------------- */

    const canvas =
      await html2canvas(
        container,
        {
          width:
            widthPx,

          height:
            heightPx,

          /*
           * 2.5 is a good compromise for A4 at this pixel density.
           */
          scale:2.5,

          useCORS:true,

          allowTaint:false,

          backgroundColor:
            "#fbfaf7",

          logging:false,

          imageTimeout:20000,

          removeContainer:true,
        },
      );

    /*
     * PNG is intentional.
     *
     * JPEG introduces visible compression around:
     * - thin botanical lines
     * - serif typography
     * - Great Vibes script
     * - small RSVP text
     *
     * PNG keeps these much cleaner.
     */
    const imgData =
      canvas.toDataURL(
        "image/png",
      );

    return {
      imgData,
      links,
    };
  } finally {
    iframe.remove();
  }
}

/* -------------------------------------------------------------------------- */
/* Build PDF                                                                  */
/* -------------------------------------------------------------------------- */

async function pdfFromPages(
  pageHtmls,
  {
    widthPx,
    heightPx,
    widthMm,
    heightMm,
    orientation = "portrait",
  } = {},
) {
  const JsPDF =
    await loadJsPdf();

  const pdf =
    new JsPDF({
      unit:"mm",
      format:[
        widthMm,
        heightMm,
      ],
      orientation,
      compress:true,
    });

  const pageW =
    pdf.internal.pageSize.getWidth();

  const pageH =
    pdf.internal.pageSize.getHeight();

  for (
    let i = 0;
    i < pageHtmls.length;
    i++
  ) {
    const {
      imgData,
      links,
    } =
      await rasterizeHtml(
        pageHtmls[i],
        { widthPx, heightPx, widthMm, heightMm },
      );

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      pageW,
      pageH,
      undefined,
      "FAST",
    );

    links.forEach(
      ({
        url,
        xMm,
        yMm,
        wMm,
        hMm,
      }) => {
        if (!url) return;

        pdf.link(
          xMm,
          yMm,
          wMm,
          hMm,
          { url },
        );
      },
    );
  }

  return pdf;
}

/* -------------------------------------------------------------------------- */
/* Invitation                                                                 */
/* -------------------------------------------------------------------------- */

export async function generateInvitationPdf(
  settings,
  guest,
) {
  try {
    const safeSettings =
      await withSafeImages(
        settings,
      );

    const palette =
      getColorScheme(
        safeSettings.colorSchemeId,
      ).colors;

    const template =
      getTemplateMeta(
        safeSettings.templateId,
      );

    const html =
      buildInvitationHtml(
        template.id,
        safeSettings,
        guest,
        palette,
      );

    return await pdfFromPages(
      [html],
      {
        widthPx: INVITATION_PAGE_WIDTH,
        heightPx: INVITATION_PAGE_HEIGHT,
        widthMm: INVITATION_WIDTH_MM,
        heightMm: INVITATION_HEIGHT_MM,
        orientation: "landscape",
      },
    );
  } catch (err) {
    console.error(
      "[pdf] Failed to generate invitation PDF:",
      err,
    );

    throw err;
  }
}

/**
 * Triggers a browser download for an arbitrary Blob — shared by the
 * jsPDF-rendered invitation/program above and by the AcroForm template
 * filler in `pdfFormFill.js`, which produces a Blob directly from pdf-lib
 * rather than through jsPDF.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a tick to pick up the click before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadInvitationPdf(
  settings,
  guest,
) {
  const pdf =
    await generateInvitationPdf(
      settings,
      guest,
    );

  const surname =
    (
      guest?.surname ||
      "guest"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      );

  pdf.save(
    `wedding-invitation-${surname}.pdf`,
  );
}

/* -------------------------------------------------------------------------- */
/* Program                                                                    */
/* -------------------------------------------------------------------------- */

export async function generateProgramPdf(
  settings,
) {
  try {
    const safeSettings =
      await withSafeImages(
        settings,
      );

    const palette =
      getColorScheme(
        safeSettings.colorSchemeId,
      ).colors;

    const pages =
      buildProgramPages(
        safeSettings,
        palette,
      );

    return await pdfFromPages(
      pages,
      {
        widthPx: PAGE_WIDTH,
        heightPx: PAGE_HEIGHT,
        widthMm: A4_WIDTH_MM,
        heightMm: A4_HEIGHT_MM,
        orientation: "portrait",
      },
    );
  } catch (err) {
    console.error(
      "[pdf] Failed to generate wedding program PDF:",
      err,
    );

    throw err;
  }
}

export async function downloadProgramPdf(
  settings,
) {
  const pdf =
    await generateProgramPdf(
      settings,
    );

  pdf.save(
    "wedding-program.pdf",
  );
}

export async function programPdfBlob(
  settings,
) {
  const pdf =
    await generateProgramPdf(
      settings,
    );

  return pdf.output("blob");
}