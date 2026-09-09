/*
 * Fills the admin-uploaded fillable invitation PDF (a real AcroForm — text
 * fields placed in a tool like Adobe Acrobat on top of a decorative design
 * made in Canva or similar) with this guest's details.
 *
 * The invitation has no generated fallback design any more — this uploaded,
 * fillable template is the *only* invitation. If it isn't configured, isn't
 * reachable, or isn't an AcroForm at all, `downloadFilledInvitationTemplate`
 * throws an `InvitationTemplateError` with a `code` the caller can use to
 * show a precise, actionable message instead of silently producing a blank
 * or wrong PDF.
 */

import {
  rgb,
  setFillingColor,
  setFontAndSize,
  PDFString,
  PDFName,
} from "pdf-lib";

import { downloadBlob } from "@/utils/pdf";
import { googleMapsUrl } from "@/utils/format";
import { getColorScheme } from "@/utils/pdfThemes";

/* -------------------------------------------------------------------------- */
/* Field typography                                                           */
/* -------------------------------------------------------------------------- */

const FIELD_SIZES = {
  username: {
    fontSize: 8.5,
    minFontSize: 7.5,
  },

  ceremonyVenueName: {
    fontSize: 9.5,
    minFontSize: 8.8,
  },

  receptionVenueName: {
    fontSize: 9.5,
    minFontSize: 7.5,
  },

  weddingMonth: {
    fontSize: 12.5,
    minFontSize: 10.5,
  },

  weddingDay: {
    fontSize: 17,
    minFontSize: 14,
    emphasis: true,
  },

  weddingYear: {
    fontSize: 9.5,
    minFontSize: 7.5,
  },

  ceremonyTime: {
    fontSize: 11.5,
    minFontSize: 7.5,
  },

  receptionTime: {
    fontSize: 11.5,
    minFontSize: 7.5,
  },

  tableNumber: {
    fontSize: 12.5,
    minFontSize: 9,
  },

  additionalMessage: {
    fontSize: 9.5,
    minFontSize: 8.5,
  },
};

const DEFAULT_FIELD_SIZE = {
  fontSize: 7.5,
  minFontSize: 7,
};

/* -------------------------------------------------------------------------- */
/* Colours                                                                    */
/* -------------------------------------------------------------------------- */

function clampByte(value) {
  return Math.max(
    0,
    Math.min(255, value),
  );
}

function darken([r, g, b], factor = 0.72) {
  return [
    clampByte(r * factor),
    clampByte(g * factor),
    clampByte(b * factor),
  ];
}

function themeTextColors(colorSchemeId) {
  const scheme = getColorScheme(colorSchemeId);

  const [r, g, b] =
    scheme.colors.ink;

  const [dr, dg, db] =
    darken(scheme.colors.ink);

  return {
    textColor: rgb(
      r / 255,
      g / 255,
      b / 255,
    ),

    emphasisColor: rgb(
      dr / 255,
      dg / 255,
      db / 255,
    ),
  };
}

function fieldStyleFor(
  name,
  themeColors,
) {
  const size =
    FIELD_SIZES[name] ||
    DEFAULT_FIELD_SIZE;

  return {
    fontSize: size.fontSize,
    minFontSize: size.minFontSize,

    textColor:
      size.emphasis
        ? themeColors.emphasisColor
        : themeColors.textColor,
  };
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

export class InvitationTemplateError extends Error {
  constructor(
    code,
    message,
  ) {
    super(message);

    this.name =
      "InvitationTemplateError";

    this.code =
      code;
  }
}

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function splitWeddingDate(value) {
  if (!value) {
    return {
      weddingMonth: "",
      weddingDay: "",
      weddingYear: "",
    };
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return {
      weddingMonth: "",
      weddingDay: "",
      weddingYear: "",
    };
  }

  return {
    weddingMonth:
      MONTH_NAMES[
        date.getUTCMonth()
      ] || "",

    weddingDay:
      String(
        date.getUTCDate(),
      ),

    weddingYear:
      String(
        date.getUTCFullYear(),
      ),
  };
}

/* -------------------------------------------------------------------------- */
/* Guest helpers                                                              */
/* -------------------------------------------------------------------------- */

function fullGuestName(guest) {
  return [
    guest?.firstName,
    guest?.surname,
  ]
    .map((part) =>
      String(
        part ?? "",
      ).trim(),
    )
    .filter(Boolean)
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/* Field values                                                               */
/* -------------------------------------------------------------------------- */

function fieldValues(
  settings,
  guest,
) {
  const {
    weddingMonth,
    weddingDay,
    weddingYear,
  } =
    splitWeddingDate(
      settings.weddingDate,
    );

  return {
    username:
      fullGuestName(guest),

    ceremonyVenueName:
      settings.ceremonyVenueName ||
      "",

    receptionVenueName:
      settings.receptionVenueName ||
      "",

    weddingMonth,
    weddingDay,
    weddingYear,

    ceremonyTime:
      settings.ceremonyTime ||
      "",

    receptionTime:
      settings.receptionTime ||
      "",

    tableNumber:
      guest?.tableNumber
        ? String(
            guest.tableNumber,
          )
        : "",

    additionalMessage:
      settings.weddingMessage ||
      "",

    /*
     * These remain in the PDF as hidden form values
     * for backwards compatibility.
     *
     * The actual clickable venue hyperlinks are created
     * separately AFTER form.flatten().
     */
    ceremonyVenueMapUrl:
      googleMapsUrl(
        settings.ceremonyVenueMapUrl,
        settings.ceremonyVenueName,
        settings.ceremonyVenueAddress,
      ),

    receptionVenueMapUrl:
      googleMapsUrl(
        settings.receptionVenueMapUrl,
        settings.receptionVenueName,
        settings.receptionVenueAddress,
      ),
  };
}

/* -------------------------------------------------------------------------- */
/* Font sizing                                                                */
/* -------------------------------------------------------------------------- */

function fittedFontSize(
  field,
  value,
  font,
  fontSize,
  minFontSize,
) {
  try {
    const widths =
      field.acroField
        .getWidgets()
        .map(
          (widget) =>
            widget
              .getRectangle()
              .width,
        )
        .filter(
          (width) =>
            Number.isFinite(
              width,
            ) &&
            width > 0,
        );

    if (
      widths.length === 0
    ) {
      return fontSize;
    }

    const availableWidth =
      Math.max(
        1,
        Math.min(
          ...widths,
        ) - 4,
      );

    const longestLineWidth =
      String(value)
        .split(/\r?\n/)
        .reduce(
          (
            largest,
            line,
          ) =>
            Math.max(
              largest,
              font.widthOfTextAtSize(
                line,
                fontSize,
              ),
            ),
          0,
        );

    if (
      longestLineWidth <=
      availableWidth
    ) {
      return fontSize;
    }

    return Math.max(
      minFontSize,
      fontSize *
        (
          availableWidth /
          longestLineWidth
        ),
    );
  } catch {
    return fontSize;
  }
}

/* -------------------------------------------------------------------------- */
/* Appearance                                                                 */
/* -------------------------------------------------------------------------- */

function applyFieldAppearance(
  field,
  value,
  font,
  {
    fontSize,
    minFontSize,
    textColor,
  },
) {
  const resolvedFontSize =
    fittedFontSize(
      field,
      value,
      font,
      fontSize,
      minFontSize,
    );

  field.setText(
    value,
  );

  const da = [
    setFillingColor(
      textColor,
    ).toString(),

    setFontAndSize(
      font.name,
      resolvedFontSize,
    ).toString(),
  ].join("\n");

  field.acroField
    .setDefaultAppearance(
      da,
    );

  field.updateAppearances(
    font,
  );
}

async function setFieldText(
  field,
  value,
  preferredFont,
  fallbackFontPromise,
  style,
) {
  try {
    applyFieldAppearance(
      field,
      value,
      preferredFont,
      style,
    );

    return;
  } catch {
    // Preferred font could not encode this value.
  }

  try {
    const fallbackFont =
      await fallbackFontPromise();

    applyFieldAppearance(
      field,
      value,
      fallbackFont,
      style,
    );
  } catch {
    // Leave only this field blank instead of
    // failing the whole invitation.
  }
}

/* -------------------------------------------------------------------------- */
/* PDF annotation helpers                                                     */
/* -------------------------------------------------------------------------- */

const CEREMONY_LINK_NAME =
  "ceremonyVenueLink";

const RECEPTION_LINK_NAME =
  "receptionVenueLink";

function decodePdfString(value) {
  if (!value) {
    return "";
  }

  try {
    if (
      typeof value.decodeText ===
      "function"
    ) {
      return value.decodeText();
    }
  } catch {
    // Fall through.
  }

  return String(value);
}

/*
 * Finds the page containing an AcroForm widget.
 */
function findWidgetPage(
  pdfDoc,
  pages,
  widget,
) {
  const pageRef =
    widget.P();

  if (pageRef) {
    const direct =
      pages.find(
        (page) =>
          page.ref ===
          pageRef,
      );

    if (direct) {
      return direct;
    }
  }

  for (
    const page of pages
  ) {
    const annots =
      page.node.Annots();

    if (!annots) {
      continue;
    }

    for (
      let i = 0;
      i < annots.size();
      i += 1
    ) {
      const annot =
        pdfDoc.context.lookup(
          annots.get(i),
        );

      if (
        annot ===
        widget.dict
      ) {
        return page;
      }
    }
  }

  return null;
}

/*
 * IMPORTANT:
 *
 * Venue widget geometry must be captured BEFORE form.flatten()
 * because flattening removes the AcroForm widgets.
 */
function captureLinkTargets(
  pdfDoc,
  form,
  fieldName,
) {
  let field;

  try {
    field =
      form.getTextField(
        fieldName,
      );
  } catch {
    return [];
  }

  const pages =
    pdfDoc.getPages();

  const result =
    [];

  for (
    const widget of
      field.acroField.getWidgets()
  ) {
    const page =
      findWidgetPage(
        pdfDoc,
        pages,
        widget,
      );

    if (!page) {
      continue;
    }

    const {
      x,
      y,
      width,
      height,
    } =
      widget.getRectangle();

    result.push({
      page,

      rect: {
        x,
        y,
        width,
        height,
      },
    });
  }

  return result;
}

function pdfRectFromAnnotation(
  pdfDoc,
  annotation,
) {
  try {
    const rectValue =
      annotation.get(
        PDFName.of(
          "Rect",
        ),
      );

    const rect =
      pdfDoc.context.lookup(
        rectValue,
      );

    if (
      !rect ||
      typeof rect.size !==
        "function" ||
      rect.size() !== 4
    ) {
      return null;
    }

    const x1 =
      rect
        .get(0)
        .asNumber();

    const y1 =
      rect
        .get(1)
        .asNumber();

    const x2 =
      rect
        .get(2)
        .asNumber();

    const y2 =
      rect
        .get(3)
        .asNumber();

    return {
      x: x1,
      y: y1,

      width:
        x2 - x1,

      height:
        y2 - y1,
    };
  } catch {
    return null;
  }
}

function rectanglesMatch(
  a,
  b,
  tolerance = 3,
) {
  if (!a || !b) {
    return false;
  }

  return (
    Math.abs(
      a.x - b.x,
    ) <= tolerance &&
    Math.abs(
      a.y - b.y,
    ) <= tolerance &&
    Math.abs(
      a.width -
        b.width,
    ) <= tolerance &&
    Math.abs(
      a.height -
        b.height,
    ) <= tolerance
  );
}

/*
 * Removes the OLD/template venue hyperlink annotations.
 *
 * This is important for mobile PDF viewers. If an old empty
 * annotation sits above the fresh link, iOS/Android may tap the
 * old annotation instead.
 *
 * We remove annotations by:
 *
 * 1. their stable /NM annotation name, OR
 * 2. matching the venue-field rectangle.
 */
function removeExistingVenueLinks(
  pdfDoc,
  targets,
) {
  const targetPages =
    new Map();

  for (
    const target of targets
  ) {
    const existing =
      targetPages.get(
        target.page,
      ) || [];

    existing.push(
      target.rect,
    );

    targetPages.set(
      target.page,
      existing,
    );
  }

  for (
    const [
      page,
      rectangles,
    ] of targetPages
  ) {
    const annots =
      page.node.Annots();

    if (!annots) {
      continue;
    }

    /*
     * Iterate backwards so removing one annotation
     * does not shift the indices of annotations we
     * still need to inspect.
     */
    for (
      let i =
        annots.size() - 1;
      i >= 0;
      i -= 1
    ) {
      let annotation;

      try {
        annotation =
          pdfDoc.context.lookup(
            annots.get(i),
          );
      } catch {
        continue;
      }

      if (
        !annotation ||
        typeof annotation.get !==
          "function"
      ) {
        continue;
      }

      const subtype =
        annotation.get(
          PDFName.of(
            "Subtype",
          ),
        );

      if (
        subtype?.toString() !==
        "/Link"
      ) {
        continue;
      }

      const name =
        decodePdfString(
          annotation.get(
            PDFName.of(
              "NM",
            ),
          ),
        );

      const namedVenueLink =
        name.includes(
          CEREMONY_LINK_NAME,
        ) ||
        name.includes(
          RECEPTION_LINK_NAME,
        );

      const annotationRect =
        pdfRectFromAnnotation(
          pdfDoc,
          annotation,
        );

      const sitsOverVenue =
        rectangles.some(
          (rect) =>
            rectanglesMatch(
              annotationRect,
              rect,
            ),
        );

      if (
        namedVenueLink ||
        sitsOverVenue
      ) {
        annots.remove(i);
      }
    }
  }
}

/*
 * Ensure only normal HTTP/HTTPS links are written into the PDF.
 */
function normaliseUri(url) {
  const value =
    String(
      url || "",
    ).trim();

  if (!value) {
    return "";
  }

  try {
    const parsed =
      new URL(value);

    if (
      parsed.protocol !==
        "https:" &&
      parsed.protocol !==
        "http:"
    ) {
      return "";
    }

    return value;
  } catch {
    return "";
  }
}

/*
 * Adds a brand-new standards-compliant URI Link annotation.
 *
 * These links are created AFTER form.flatten() and contain the
 * FINAL admin-provided Maps URL immediately.
 *
 * This is much more reliable on:
 * - Safari / iOS Quick Look
 * - Chrome on Android
 * - Samsung PDF viewer
 * - Google Drive PDF viewer
 * - Acrobat mobile
 */
function addUriLinkAnnotation(
  pdfDoc,
  page,
  rect,
  url,
  annotationName,
) {
  const finalUrl =
    normaliseUri(url);

  if (!finalUrl) {
    return;
  }

  const {
    x,
    y,
    width,
    height,
  } =
    rect;

  const linkDict =
    pdfDoc.context.obj({
      Type: "Annot",

      Subtype: "Link",

      Rect: [
        x,
        y,
        x + width,
        y + height,
      ],

      /*
       * No visible border.
       */
      Border: [
        0,
        0,
        0,
      ],

      /*
       * Annotation visible and printable.
       */
      F: 4,

      /*
       * Invert highlight on tap — widely supported
       * by desktop and mobile PDF readers.
       */
      H: "I",

      /*
       * Stable annotation name.
       */
      NM:
        PDFString.of(
          annotationName,
        ),

      A: {
        Type: "Action",

        S: "URI",

        URI:
          PDFString.of(
            finalUrl,
          ),
      },
    });

  const linkRef =
    pdfDoc.context.register(
      linkDict,
    );

  page.node.addAnnot(
    linkRef,
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export async function downloadFilledInvitationTemplate(
  settings,
  guest,
) {
  const templateUrl =
    settings.invitationPdfUrl;

  if (!templateUrl) {
    throw new InvitationTemplateError(
      "NO_TEMPLATE",
      "No invitation template has been uploaded yet.",
    );
  }

  const {
    PDFDocument,
    StandardFonts,
  } =
    await import(
      "pdf-lib"
    );

  /* ---------------------------------------------------------------------- */
  /* Fetch template                                                          */
  /* ---------------------------------------------------------------------- */

  let bytes;

  try {
    let response =
      await fetch(
        `/api/public/invitation-template?url=${encodeURIComponent(
          templateUrl,
        )}`,
      );

    if (
      !response.ok
    ) {
      response =
        await fetch(
          templateUrl,
        );
    }

    if (
      !response.ok
    ) {
      throw new Error(
        `HTTP ${response.status}`,
      );
    }

    bytes =
      await response.arrayBuffer();
  } catch (err) {
    throw new InvitationTemplateError(
      "FETCH_FAILED",
      `Couldn't fetch the invitation template: ${err.message}`,
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Load PDF                                                                */
  /* ---------------------------------------------------------------------- */

  let pdfDoc;

  try {
    pdfDoc =
      await PDFDocument.load(
        bytes,
      );
  } catch (err) {
    throw new InvitationTemplateError(
      "LOAD_FAILED",
      `The uploaded invitation template isn't a valid PDF: ${err.message}`,
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Form                                                                    */
  /* ---------------------------------------------------------------------- */

  const form =
    pdfDoc.getForm();

  const fields =
    form.getFields();

  if (
    fields.length === 0
  ) {
    throw new InvitationTemplateError(
      "NOT_FILLABLE",
      "The uploaded invitation template has no fillable fields.",
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Fonts                                                                   */
  /* ---------------------------------------------------------------------- */

  const preferredFont =
    await pdfDoc.embedFont(
      StandardFonts.TimesRoman,
    );

  let fallbackFont =
    null;

  const getFallbackFont =
    async () => {
      if (
        !fallbackFont
      ) {
        fallbackFont =
          await pdfDoc.embedFont(
            StandardFonts.Helvetica,
          );
      }

      return fallbackFont;
    };

  /* ---------------------------------------------------------------------- */
  /* Values                                                                  */
  /* ---------------------------------------------------------------------- */

  const values =
    fieldValues(
      settings,
      guest,
    );

  const themeColors =
    themeTextColors(
      settings.colorSchemeId,
    );

  /* ---------------------------------------------------------------------- */
  /* IMPORTANT: Capture link positions BEFORE flattening                    */
  /* ---------------------------------------------------------------------- */

  const ceremonyTargets =
    captureLinkTargets(
      pdfDoc,
      form,
      "ceremonyVenueName",
    );

  const receptionTargets =
    captureLinkTargets(
      pdfDoc,
      form,
      "receptionVenueName",
    );

  const allVenueTargets = [
    ...ceremonyTargets,
    ...receptionTargets,
  ];

  /* ---------------------------------------------------------------------- */
  /* Fill form fields                                                        */
  /* ---------------------------------------------------------------------- */

  for (
    const [
      name,
      value,
    ] of Object.entries(
      values,
    )
  ) {
    if (!value) {
      continue;
    }

    let field;

    try {
      field =
        form.getTextField(
          name,
        );
    } catch {
      continue;
    }

    await setFieldText(
      field,
      value,
      preferredFont,
      getFallbackFont,
      fieldStyleFor(
        name,
        themeColors,
      ),
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Flatten FIRST                                                           */
  /* ---------------------------------------------------------------------- */

  /*
   * This removes the AcroForm widgets and bakes the visible
   * values into the finished invitation.
   *
   * We deliberately do this BEFORE creating the new venue links.
   */
  form.flatten();

  /* ---------------------------------------------------------------------- */
  /* Remove OLD template venue links                                         */
  /* ---------------------------------------------------------------------- */

  removeExistingVenueLinks(
    pdfDoc,
    allVenueTargets,
  );

  /* ---------------------------------------------------------------------- */
  /* Create fresh mobile-friendly links AFTER flattening                     */
  /* ---------------------------------------------------------------------- */

  const ceremonyUrl =
    normaliseUri(
      values.ceremonyVenueMapUrl,
    );

  const receptionUrl =
    normaliseUri(
      values.receptionVenueMapUrl,
    );

  for (
    const target of
      ceremonyTargets
  ) {
    addUriLinkAnnotation(
      pdfDoc,
      target.page,
      target.rect,
      ceremonyUrl,
      CEREMONY_LINK_NAME,
    );
  }

  for (
    const target of
      receptionTargets
  ) {
    addUriLinkAnnotation(
      pdfDoc,
      target.page,
      target.rect,
      receptionUrl,
      RECEPTION_LINK_NAME,
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Save                                                                    */
  /* ---------------------------------------------------------------------- */

  const filledBytes =
    await pdfDoc.save();

  const blob =
    new Blob(
      [filledBytes],
      {
        type:
          "application/pdf",
      },
    );

  const guestName =
    fullGuestName(
      guest,
    ) ||
    "guest";

  downloadBlob(
    blob,
    `invitation-${guestName
      .replace(
        /\s+/g,
        "-",
      )
      .toLowerCase()}.pdf`,
  );
}