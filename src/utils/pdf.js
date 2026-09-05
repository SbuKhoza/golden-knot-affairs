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
} from "@/utils/pdfTemplates";

/*
 * The invitation is deliberately NOT a plain A4 sheet: the page is kept at
 * A4 width but made taller so the full invitation breathes on one page with
 * no cramped or overlapping type. The millimetre height is derived from the
 * pixel canvas so the proportions always match exactly.
 */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM =
  (A4_WIDTH_MM * PAGE_HEIGHT) / PAGE_WIDTH;

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500;1,600&display=swap";

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

function createRenderFrame() {
  return new Promise((resolve) => {
    const iframe =
      document.createElement("iframe");

    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "-99999px";

    iframe.style.width =
      `${PAGE_WIDTH}px`;

    iframe.style.height =
      `${PAGE_HEIGHT}px`;

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
) {
  const html2canvas =
    await loadHtml2Canvas();

  const iframe =
    await createRenderFrame();

  const idoc =
    iframe.contentDocument;

  try {
    await loadFontsInFrame(idoc);

    const container =
      idoc.createElement("div");

    container.style.width =
      `${PAGE_WIDTH}px`;

    container.style.height =
      `${PAGE_HEIGHT}px`;

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
              PAGE_WIDTH,
              A4_WIDTH_MM,
            ),

          yMm:
            pxToMm(
              r.top -
                containerRect.top,
              PAGE_HEIGHT,
              A4_HEIGHT_MM,
            ),

          wMm:
            pxToMm(
              r.width,
              PAGE_WIDTH,
              A4_WIDTH_MM,
            ),

          hMm:
            pxToMm(
              r.height,
              PAGE_HEIGHT,
              A4_HEIGHT_MM,
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
            PAGE_WIDTH,

          height:
            PAGE_HEIGHT,

          /*
           * 2.5 is a good compromise for A4.
           * The source itself is already 1240x1754.
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
) {
  const JsPDF =
    await loadJsPdf();

  const pdf =
    new JsPDF({
      unit:"mm",
      format:[
        A4_WIDTH_MM,
        A4_HEIGHT_MM,
      ],
      orientation:"portrait",
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

    return await pdfFromPages([
      html,
    ]);
  } catch (err) {
    console.error(
      "[pdf] Failed to generate invitation PDF:",
      err,
    );

    throw err;
  }
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