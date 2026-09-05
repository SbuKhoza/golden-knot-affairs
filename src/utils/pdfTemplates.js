// src/utils/pdfTemplates.js

import { formatWeddingDate } from "@/utils/format";

import {
  botanicalBranch,
  cornerSprig,
  delicateDivider,
  floralDivider,
  lineRose,
  ornamentalCorner,
  petalFlower,
  rgbCss,
  weddingRings,
} from "@/utils/pdfIllustrations";

// A4 render box.
// html2canvas rasterizes this exact size.
export const PAGE_WIDTH = 1240;
export const PAGE_HEIGHT = 1960;

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_SCRIPT = "'Great Vibes', cursive";
const FONT_BODY = "'Cormorant Garamond', Georgia, serif";
const FONT_LABEL = FONT_BODY;

function palCss(palette) {
  return {
    gold: rgbCss(palette?.gold || [150, 115, 55]),
    goldSoft: rgbCss(palette?.goldSoft || [190, 160, 105]),
    goldFaint: rgbCss(palette?.goldSoft || [190, 160, 105], 0.35),

    ink: rgbCss(palette?.ink || [63, 55, 45]),
    inkSoft: rgbCss(palette?.ink || [63, 55, 45], 0.68),

    cream: rgbCss(palette?.cream || [250, 247, 240]),
    creamDeep: rgbCss(palette?.creamDeep || [240, 232, 216]),

    leaf: rgbCss(palette?.leaf || [82, 91, 67]),

    bloomA: rgbCss(
      palette?.petalTint?.[0] ||
        palette?.gold ||
        [150, 115, 55],
    ),

    bloomB: rgbCss(
      palette?.petalTint?.[1] ||
        palette?.goldSoft ||
        [190, 160, 105],
    ),
  };
}

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function photoTag(
  src,
  width,
  height = width,
  extra = "",
) {
  if (!src) return "";

  return `
    <img
      src="${esc(src)}"
      style="
        width:${width}px;
        height:${height}px;
        object-fit:cover;
        display:block;
        ${extra}
      "
    />
  `;
}

/**
 * Hero image with a true, proportional "object-cover" crop, framed as an
 * oval.
 *
 * html2canvas does not honour `object-fit`, so relying on it squashes the
 * source image into whatever box we give it. Instead we let the image keep
 * its natural ratio (width:100%; height:auto) inside an overflow-hidden
 * window of a fixed height. Because the scaled image is taller than the
 * window, the excess is cropped from the bottom and the top of the photo —
 * where faces usually are — stays intact.
 *
 * The window itself uses `border-radius: 50%`, which on a wide rectangular
 * box renders as a clean oval frame rather than a circle.
 */
function heroPhoto(src, boxWidth, boxHeight, fit = "cover") {
  if (!src) return "";

  const mode = ["cover", "contain", "fill"].includes(fit) ? fit : "cover";

  // html2canvas ignores `object-fit`, so each mode is expressed with plain
  // geometry instead.
  let imgStyle;
  if (mode === "fill") {
    // Explicitly stretch — only when the couple asks for it.
    imgStyle = `width:${boxWidth}px;height:${boxHeight}px;`;
  } else if (mode === "contain") {
    // Whole picture visible, ratio kept, letterboxed inside the window.
    imgStyle = `max-width:${boxWidth}px;max-height:${boxHeight}px;width:auto;height:${boxHeight}px;margin:0 auto;`;
  } else {
    // Cover: scale to the window width, keep the ratio, crop the overflow
    // from the bottom so the top of the photo stays intact.
    imgStyle = `width:${boxWidth}px;height:auto;position:absolute;top:0;left:0;`;
  }

  return `
    <div
      style="
        width:${boxWidth}px;
        height:${boxHeight}px;
        overflow:hidden;
        position:relative;
        border-radius:6px;
        margin:0 auto;
        text-align:center;
      "
    >
      <img src="${esc(src)}" style="display:block;${imgStyle}" />
    </div>
  `;
}

function initials(bride, groom) {
  const b = (bride || "B").trim()[0] || "B";
  const g = (groom || "G").trim()[0] || "G";

  return `${b}${g}`.toUpperCase();
}

function dateLine(settings) {
  return [
    formatWeddingDate(settings.weddingDate),
    settings.ceremonyTime,
  ]
    .filter(Boolean)
    .join("  ·  ");
}

/* -------------------------------------------------------------------------- */
/* Typography                                                                 */
/* -------------------------------------------------------------------------- */

function eyebrow(text, c) {
  return `
    <div
      style="
        font-family:${FONT_BODY};
        font-style:italic;
        font-weight:500;
        font-size:21px;
        letter-spacing:1.7px;
        word-spacing:0.2em;
        color:${c.inkSoft};
        text-align:center;
      "
    >
      ${esc(text)}
    </div>
  `;
}

function scriptNames(
  bride,
  groom,
  c,
  size = 120,
) {
  return `
    <div
      style="
        display:flex;
        align-items:baseline;
        justify-content:center;
        gap:28px;
        flex-wrap:wrap;
        line-height:0.95;
      "
    >

      <span
        style="
          font-family:${FONT_SCRIPT};
          font-size:${size}px;
          color:${c.ink};
          white-space:nowrap;
          word-spacing:0.2em;
        "
      >
        ${esc(bride || "Bride")}
      </span>

      <span
        style="
          font-family:${FONT_DISPLAY};
          font-style:italic;
          font-size:${Math.round(size * 0.32)}px;
          color:${c.gold};
          margin-top:15px;
        "
      >
        &amp;
      </span>

      <span
        style="
          font-family:${FONT_SCRIPT};
          font-size:${size}px;
          color:${c.ink};
          white-space:nowrap;
          word-spacing:0.2em;
        "
      >
        ${esc(groom || "Groom")}
      </span>

    </div>
  `;
}

function serifNames(bride, groom, c) {
  return `
    <div style="text-align:center;">

      <div
        style="
          font-family:${FONT_DISPLAY};
          font-weight:500;
          font-size:70px;
          color:${c.ink};
          letter-spacing:0.5px;
          word-spacing:0.15em;
        "
      >
        ${esc(bride || "Bride")}
      </div>

      <div
        style="
          font-family:${FONT_DISPLAY};
          font-style:italic;
          font-size:30px;
          color:${c.gold};
          margin:7px 0;
        "
      >
        &amp;
      </div>

      <div
        style="
          font-family:${FONT_DISPLAY};
          font-weight:500;
          font-size:70px;
          color:${c.ink};
          letter-spacing:0.5px;
          word-spacing:0.15em;
        "
      >
        ${esc(groom || "Groom")}
      </div>

    </div>
  `;
}

function messageBlock(
  message,
  c,
  maxWidth = 780,
) {
  if (!message) return "";

  // NOTE: this is plain italic prose (no letter-spacing), so it never
  // needed `word-spacing` to begin with — and on italic text specifically,
  // this html2canvas build renders `word-spacing` (in any unit) as
  // corrupted, overlapping glyphs. Never set word-spacing on italic text.
  return `
    <p
      style="
        font-family:${FONT_BODY};
        font-style:italic;
        font-weight:400;
        font-size:26px;
        line-height:1.55;
        color:${c.inkSoft};
        text-align:center;
        max-width:${maxWidth}px;
        margin:0 auto;
      "
    >
      ${esc(message)}
    </p>
  `;
}

function detailLabel(text, c) {
  return `
    <div
      style="
        font-family:${FONT_BODY};
        font-weight:600;
        font-size:16px;
        letter-spacing:3px;
        word-spacing:0.4em;
        text-transform:uppercase;
        color:${c.gold};
      "
    >
      ${esc(text)}
    </div>
  `;
}

function thinRule(c, width = 110) {
  return `
    <div
      style="
        width:${width}px;
        height:1px;
        background:${c.gold};
        opacity:0.48;
        margin:0 auto;
      "
    ></div>
  `;
}

/* -------------------------------------------------------------------------- */
/* Details                                                                    */
/* -------------------------------------------------------------------------- */

function venueBlockHtml(
  {
    title,
    time,
    name,
    address,
    mapUrl,
  },
  c,
) {
  if (!time && !name && !address) return "";

  return `
    <div
      style="
        text-align:center;
        width:390px;
      "
    >

      ${detailLabel(title, c)}

      ${
        time
          ? `
            <div
              style="
                font-family:${FONT_BODY};
                font-style:italic;
                font-size:29px;
                color:${c.ink};
                margin-top:7px;
              "
            >
              ${esc(time)}
            </div>
          `
          : ""
      }

      ${
        name
          ? `
            <div
              style="
                font-family:${FONT_DISPLAY};
                font-weight:600;
                font-size:26px;
                color:${c.ink};
                margin-top:5px;
                word-spacing:0.15em;
              "
            >
              ${esc(name)}
            </div>
          `
          : ""
      }

      ${
        address
          ? `
            <div
              style="
                font-family:${FONT_BODY};
                font-size:22px;
                color:${c.inkSoft};
                margin-top:5px;
                line-height:1.35;
                word-spacing:0.2em;
              "
            >
              ${esc(address)}
            </div>
          `
          : ""
      }

      ${
        mapUrl
          ? `
            <div
              data-pdf-link="${esc(mapUrl)}"
              style="
                display:inline-block;
                margin-top:7px;
                font-family:${FONT_BODY};
                font-style:italic;
                font-size:16px;
                color:${c.gold};
                text-decoration:underline;
              "
            >
              View on map ↗
            </div>
          `
          : ""
      }

    </div>
  `;
}

function dressCodeHtml(settings, c) {
  if (!settings.dressCode) return "";

  const img =
    settings.dressCodeImageData ||
    settings.dressCodeImageUrl;

  return `
    <div style="text-align:center;margin-top:2px;">

      ${detailLabel("Dress Code", c)}

      <div
        style="
          font-family:${FONT_BODY};
          font-style:italic;
          font-size:27px;
          color:${c.ink};
          margin-top:6px;
          word-spacing:0.2em;
        "
      >
        ${esc(settings.dressCode)}
      </div>

      ${
        img
          ? `
            <div
              style="
                width:90px;
                height:90px;
                border-radius:50%;
                margin:11px auto 0;
                overflow:hidden;
              "
            >
              ${photoTag(img, 90, 90)}
            </div>
          `
          : ""
      }

    </div>
  `;
}

function rsvpHtml(settings, c) {
  if (!settings.rsvpEnabled) return "";

  const deadline = settings.rsvpDeadline
    ? formatWeddingDate(settings.rsvpDeadline)
    : "";

  return `
    <div
      style="
        display:flex;
        align-items:center;
        justify-content:center;
        gap:10px;
      "
    >

      ${weddingRings(c.gold, 40)}

      <span
        style="
          font-family:${FONT_BODY};
          font-style:italic;
          font-size:22px;
          color:${c.inkSoft};
          word-spacing:0.2em;
        "
      >
        ${
          deadline
            ? `Kindly RSVP by ${esc(deadline)}`
            : "Kindly RSVP at your earliest convenience"
        }
      </span>

    </div>
  `;
}

function guestTicketHtml(guest, c) {
  if (!guest) return "";

  const seatWord =
    `${guest.numberOfSeats || 0} seat` +
    `${Number(guest.numberOfSeats) === 1 ? "" : "s"}`;

  const chips = [seatWord];

  if (guest.tableNumber) {
    chips.push(`Table ${esc(guest.tableNumber)}`);
  }

  if (
    guest.plusOneAllowed &&
    guest.plusOneName
  ) {
    chips.push(
      `Plus one: ${esc(guest.plusOneName)}`,
    );
  }

  return `
    <div
      style="
        width:100%;
        text-align:center;
        margin-top:2px;
      "
    >

      ${thinRule(c, 130)}

      <div
        style="
          font-family:${FONT_BODY};
          font-weight:600;
          font-size:13px;
          letter-spacing:3px;
          word-spacing:0.4em;
          text-transform:uppercase;
          color:${c.gold};
          margin-top:11px;
        "
      >
        Reserved For
      </div>

      <div
        style="
          font-family:${FONT_DISPLAY};
          font-weight:600;
          font-size:31px;
          color:${c.ink};
          margin-top:4px;
          word-spacing:0.18em;
        "
      >
        ${esc(fullName(guest))}
      </div>

      <div
        style="
          font-family:${FONT_BODY};
          font-style:italic;
          font-size:20px;
          color:${c.inkSoft};
          margin-top:4px;
        "
      >
        ${chips.join(" &nbsp;·&nbsp; ")}
      </div>

      <div style="margin-top:11px;">
        ${thinRule(c, 130)}
      </div>

    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/* Page shell                                                                 */
/* -------------------------------------------------------------------------- */

function pageShell({
  palette,
  children,
  background = "#fbfaf7",
}) {
  return `
    <div
      style="
        width:${PAGE_WIDTH}px;
        height:${PAGE_HEIGHT}px;
        position:relative;
        overflow:hidden;
        background:${background};
        box-sizing:border-box;
        font-family:${FONT_BODY};
      "
    >

      ${children}

    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/* HERO IMAGE                                                                 */
/* -------------------------------------------------------------------------- */

function heroImage({
  photo,
  c,
  height = 710,
}) {
  if (!photo) {
    return `
      <div
        style="
          position:absolute;
          top:0;
          left:0;
          width:100%;
          height:${height}px;
          background:${c.creamDeep};
        "
      >
        <div
          style="
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
          "
        >
          <div
            style="
              font-family:${FONT_DISPLAY};
              font-style:italic;
              font-size:90px;
              color:${c.gold};
              opacity:0.7;
            "
          >
            ${initials("", "")}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div
      style="
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:${height}px;
        overflow:hidden;
      "
    >

      ${photoTag(
        photo,
        PAGE_WIDTH,
        height,
        `
          object-position:center center;
        `,
      )}

      <!-- Very subtle edge fade -->
      <div
        style="
          position:absolute;
          inset:0;
          background:
            linear-gradient(
              to bottom,
              rgba(251,250,247,0) 35%,
              rgba(251,250,247,0.04) 46%,
              rgba(251,250,247,0.35) 62%,
              rgba(251,250,247,0.82) 82%,
              rgba(251,250,247,1) 100%
            );
        "
      ></div>

      <!-- Gentle side fade -->
      <div
        style="
          position:absolute;
          inset:0;
          background:
            linear-gradient(
              to right,
              rgba(251,250,247,0.18) 0%,
              rgba(251,250,247,0) 18%,
              rgba(251,250,247,0) 82%,
              rgba(251,250,247,0.18) 100%
            );
        "
      ></div>

    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/* Shared building blocks for the two invitation designs                      */
/* -------------------------------------------------------------------------- */
/*
 * NOTE ON LAYOUT
 *
 * These pages are rasterized with html2canvas. Flexbox `gap`, baseline
 * alignment and stacked absolutely-positioned text blocks are unreliable
 * there and were the cause of the overlapping text in earlier versions.
 *
 * Everything below therefore uses plain document flow (block elements with
 * margins) and <table> for columns, which html2canvas reproduces exactly.
 *
 * NOTE ON WORD SPACING
 *
 * Several labels below use heavy `letter-spacing` for a tracked small-caps
 * look. Without an explicit `word-spacing` that is clearly larger than the
 * letter-spacing, the gap between two words ends up looking the same size
 * as the gap between two letters, so multi-word labels visually run
 * together (e.g. "Request the pleasure of your company"). Every tracked
 * label below sets `word-spacing` well above its `letter-spacing` to keep
 * word boundaries obvious. `html2canvas` also does not reliably apply CSS
 * `text-transform`, which is a second, independent reason spacing can look
 * wrong only in the generated PDF and not on-screen.
 */

function scriptDuo(bride, groom, c, size) {
  const nameStyle = `
    font-family:${FONT_SCRIPT};
    font-size:${size}px;
    color:${c.ink};
    line-height:1.15;
    padding:0 24px;
    word-spacing:0.22em;
  `;

  return `
    <div style="text-align:center;">
      <div style="${nameStyle}">${esc(bride || "Bride")}</div>

      <div
        style="
          font-family:${FONT_DISPLAY};
          font-style:italic;
          font-size:${Math.round(size * 0.34)}px;
          color:${c.gold};
          margin:18px 0;
          line-height:1;
        "
      >&amp;</div>

      <div style="${nameStyle}">${esc(groom || "Groom")}</div>
    </div>
  `;
}

function capsLine(
  text,
  c,
  { size = 19, spacing = 6, wordSpacing, weight = 700, color, top = 0 } = {},
) {
  if (!text) return "";

  // Word spacing is deliberately kept well above the letter spacing so
  // multi-word labels ("Request the pleasure of your company",
  // "Dear Jane Doe") don't visually run together once heavy letter
  // tracking is applied.
  const ws = wordSpacing != null ? wordSpacing : Math.max(spacing * 3, 18);

  return `
    <div
      style="
        font-family:${FONT_BODY};
        font-weight:${weight};
        font-size:${size}px;
        letter-spacing:${spacing}px;
        word-spacing:${ws}px;
        text-transform:uppercase;
        color:${color || c.gold};
        text-align:center;
        margin-top:${top}px;
      "
    >${esc(text)}</div>
  `;
}

function ruleWithDiamond(c, width = 300, top = 0) {
  return `
    <div style="text-align:center;margin-top:${top}px;line-height:0;">
      <span style="display:inline-block;width:${width}px;height:1px;background:${c.gold};opacity:0.55;vertical-align:middle;"></span>
      <span style="display:inline-block;width:7px;height:7px;background:${c.gold};opacity:0.8;transform:rotate(45deg);margin:0 12px;vertical-align:middle;"></span>
      <span style="display:inline-block;width:${width}px;height:1px;background:${c.gold};opacity:0.55;vertical-align:middle;"></span>
    </div>
  `;
}

function venueCell(
  { title, time, name, address, mapUrl },
  c,
  { compact = false } = {},
) {
  if (!time && !name && !address) return "";

  return `
    <div style="text-align:center;">
      ${capsLine(title, c, { size: compact ? 17 : 18, spacing: 4, weight: 700 })}

      ${
        time
          ? `<div style="font-family:${FONT_BODY};font-style:italic;font-weight:600;font-size:${
              compact ? 30 : 34
            }px;color:${c.ink};margin-top:10px;line-height:1.3;word-spacing:0.2em;">${esc(time)}</div>`
          : ""
      }

      ${
        name
          ? `<div style="font-family:${FONT_DISPLAY};font-weight:700;font-size:${
              compact ? 28 : 32
            }px;color:${c.ink};margin-top:8px;line-height:1.4;word-spacing:0.3em;">${esc(name)}</div>`
          : ""
      }

      ${
        address
          ? `<div style="font-family:${FONT_BODY};font-weight:500;font-size:${
              compact ? 24 : 26
            }px;color:${c.inkSoft};margin-top:6px;line-height:1.5;word-spacing:0.3em;">${esc(address)}</div>`
          : ""
      }

      ${
        mapUrl
          ? `<div data-pdf-link="${esc(mapUrl)}" style="font-family:${FONT_BODY};font-style:italic;font-weight:600;font-size:19px;color:${c.gold};margin-top:8px;">View on map</div>`
          : ""
      }
    </div>
  `;
}

function twoColumn(left, right, { divider = "", gutter = 60 } = {}) {
  if (!left && !right) return "";

  if (!left || !right) {
    return `<div style="width:100%;">${left || right}</div>`;
  }

  return `
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <tr>
        <td style="vertical-align:top;padding-right:${gutter / 2}px;">${left}</td>
        ${
          divider
            ? `<td style="width:1px;padding:0;"><div style="width:1px;height:120px;background:${divider};opacity:0.3;margin:0 auto;"></div></td>`
            : ""
        }
        <td style="vertical-align:top;padding-left:${gutter / 2}px;">${right}</td>
      </tr>
    </table>
  `;
}

function dressCodeInline(settings, c) {
  if (!settings.dressCode) return "";

  const img = settings.dressCodeImageData || settings.dressCodeImageUrl;

  return `
    <div style="text-align:center;">
      ${capsLine("Dress Code", c, { size: 17, spacing: 4, weight: 700 })}
      <div style="font-family:${FONT_BODY};font-style:italic;font-weight:600;font-size:30px;color:${c.ink};margin-top:9px;word-spacing:0.3em;">
        ${esc(settings.dressCode)}
      </div>
      ${
        img
          ? `<div style="width:104px;height:104px;border-radius:50%;overflow:hidden;margin:14px auto 0;">
               ${photoTag(img, 104, 104)}
             </div>`
          : ""
      }
    </div>
  `;
}

function rsvpLine(settings, c) {
  if (settings.rsvpEnabled === false) return "";

  const deadline = settings.rsvpDeadline
    ? formatWeddingDate(settings.rsvpDeadline)
    : "";

  return `
    <div style="font-family:${FONT_BODY};font-style:italic;font-weight:600;font-size:26px;color:${c.inkSoft};text-align:center;line-height:1.5;word-spacing:0.3em;">
      ${
        deadline
          ? `Kindly RSVP by ${esc(deadline)}`
          : "Kindly RSVP at your earliest convenience"
      }
    </div>
  `;
}

/** Guest full name with an explicit, guaranteed space between the parts. */
function fullName(guest) {
  return [guest?.firstName, guest?.surname]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

/** Long names step down in size instead of colliding with their neighbours. */
function nameSize(name, base) {
  const len = name.length;
  if (len <= 18) return base;
  if (len <= 26) return Math.round(base * 0.86);
  if (len <= 34) return Math.round(base * 0.74);
  return Math.round(base * 0.64);
}

function reservedPanel(guest, c) {
  if (!guest) return "";

  const seats = Number(guest.numberOfSeats) || 1;
  const chips = [`${seats} seat${seats === 1 ? "" : "s"}`];

  if (guest.tableNumber) chips.push(`Table ${esc(guest.tableNumber)}`);
  if (guest.plusOneAllowed && guest.plusOneName) {
    chips.push(`Plus one: ${esc(guest.plusOneName)}`);
  }

  const name = fullName(guest);

  return `
    <div style="text-align:center;padding:0 40px;">
      ${ruleWithDiamond(c, 150, 0)}
      ${capsLine("Reserved For", c, { size: 16, spacing: 4, weight: 700, top: 18 })}
      <div style="font-family:${FONT_DISPLAY};font-weight:700;font-size:${nameSize(
        name,
        34,
      )}px;color:${c.ink};margin-top:12px;line-height:1.4;word-spacing:0.3em;word-break:break-word;">
        ${esc(name)}
      </div>
      <div style="font-family:${FONT_BODY};font-style:italic;font-weight:600;font-size:24px;color:${c.inkSoft};margin-top:12px;line-height:1.6;word-spacing:0.25em;">
        ${chips.join(" &nbsp;·&nbsp; ")}
      </div>
    </div>

  `;
}

/* -------------------------------------------------------------------------- */
/* 1. KEEPSAKE — mirrors the on-screen invitation                             */
/* -------------------------------------------------------------------------- */

export function keepsakeInvitationHtml(settings, guest, palette) {
  const c = palCss(palette);

  const photo = settings.invitationImageData || settings.invitationImageUrl;
  const background =
    settings.backgroundImageData || settings.backgroundImageUrl;

  const date = formatWeddingDate(settings.weddingDate);

  const venues = twoColumn(
    venueCell(
      {
        title: "Ceremony",
        time: settings.ceremonyTime,
        name: settings.ceremonyVenueName,
        address: settings.ceremonyVenueAddress,
        mapUrl: settings.ceremonyVenueMapUrl,
      },
      c,
    ),
    venueCell(
      {
        title: "Reception",
        time: settings.receptionTime,
        name: settings.receptionVenueName,
        address: settings.receptionVenueAddress,
        mapUrl: settings.receptionVenueMapUrl,
      },
      c,
    ),
    { divider: c.gold, gutter: 70 },
  );

  const body = `
    <!-- Background photograph, softened so the card stays legible -->
    ${
      background
        ? `<div style="position:absolute;inset:0;overflow:hidden;">
             ${photoTag(background, PAGE_WIDTH, PAGE_HEIGHT)}
             <div style="position:absolute;inset:0;background:rgba(251,250,247,0.72);"></div>
           </div>`
        : `<div style="position:absolute;inset:0;background:${c.cream};"></div>`
    }

    <!-- The invitation card -->
    <div
      style="
        position:absolute;
        top:56px;
        left:56px;
        right:56px;
        bottom:56px;
        background:#ffffff;
        border:1px solid ${c.gold};
        box-sizing:border-box;
        padding:10px;
      "
    >
      <div
        style="
          width:100%;
          height:100%;
          box-sizing:border-box;
          border:1px solid ${c.goldFaint};
          padding:40px 74px;
        "
      >

        ${
          photo
            ? heroPhoto(photo, 950, 560, settings.invitationImageFit)
            : `<div style="text-align:center;font-family:${FONT_DISPLAY};font-style:italic;font-size:96px;color:${c.gold};line-height:1.2;">
                 ${initials(settings.brideName, settings.groomName)}
               </div>`
        }

        ${
          guest
            ? capsLine(`Dear ${fullName(guest)}`, c, {
                size: 18,
                spacing: 5,
                weight: 700,
                color: c.inkSoft,
                top: 34,
              })
            : ""
        }

        ${ruleWithDiamond(c, 190, 26)}

        <div style="margin-top:24px;">
          ${scriptDuo(settings.brideName, settings.groomName, c, 84)}
        </div>

        ${capsLine("Request the pleasure of your company", c, {
          size: 18,
          spacing: 5,
          weight: 700,
          color: c.inkSoft,
          top: 26,
        })}

        ${
          date
            ? `<div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:32px;color:${c.ink};text-align:center;margin-top:18px;line-height:1.4;">
                 ${esc(date)}
               </div>`
            : ""
        }

        ${
          settings.weddingMessage
            ? `<div style="margin-top:22px;">${messageBlock(
                settings.weddingMessage,
                c,
                720,
              )}</div>`
            : ""
        }

        ${ruleWithDiamond(c, 190, 26)}

        <div style="margin-top:28px;">${venues}</div>

        ${
          settings.dressCode
            ? `<div style="margin-top:26px;">${dressCodeInline(settings, c)}</div>`
            : ""
        }

        <div style="margin-top:26px;">${rsvpLine(settings, c)}</div>

        <div style="margin-top:26px;">${reservedPanel(guest, c)}</div>


      </div>
    </div>
  `;

  return pageShell({
    palette,
    background: "#fbfaf7",
    children: body,
  });
}

/* -------------------------------------------------------------------------- */
/* 2. GOLDEN EDITORIAL — a designed, gallery-style keepsake                   */
/* -------------------------------------------------------------------------- */

export function editorialInvitationHtml(settings, guest, palette) {
  const c = palCss(palette);

  const photo = settings.invitationImageData || settings.invitationImageUrl;
  const date = formatWeddingDate(settings.weddingDate);

  const venues = twoColumn(
    venueCell(
      {
        title: "Ceremony",
        time: settings.ceremonyTime,
        name: settings.ceremonyVenueName,
        address: settings.ceremonyVenueAddress,
        mapUrl: settings.ceremonyVenueMapUrl,
      },
      c,
      { compact: true },
    ),
    venueCell(
      {
        title: "Reception",
        time: settings.receptionTime,
        name: settings.receptionVenueName,
        address: settings.receptionVenueAddress,
        mapUrl: settings.receptionVenueMapUrl,
      },
      c,
      { compact: true },
    ),
    { divider: c.gold, gutter: 56 },
  );

  const body = `
    <!-- Deep colour band behind the top third -->
    <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:${c.creamDeep};"></div>

    <!-- Fine engraved frame -->
    <div style="position:absolute;top:34px;left:34px;right:34px;bottom:34px;border:1px solid ${c.gold};opacity:0.55;"></div>
    <div style="position:absolute;top:44px;left:44px;right:44px;bottom:44px;border:1px solid ${c.goldFaint};"></div>

    <div style="position:absolute;top:16px;left:16px;">
      ${ornamentalCorner(c.gold, { width: 230, height: 230, opacity: 0.5 })}
    </div>
    <div style="position:absolute;bottom:16px;right:16px;">
      ${ornamentalCorner(c.gold, {
        width: 230,
        height: 230,
        mirrorX: true,
        mirrorY: true,
        opacity: 0.5,
      })}
    </div>

    <div
      style="
        position:absolute;
        top:44px;
        left:44px;
        right:44px;
        bottom:44px;
        box-sizing:border-box;
        padding:48px 88px 40px;
      "
    >

      <!-- Monogram medallion -->
      <div style="text-align:center;">
        <div
          style="
            display:inline-block;
            width:92px;
            height:92px;
            border:1px solid ${c.gold};
            border-radius:46px;
            box-sizing:border-box;
            font-family:${FONT_DISPLAY};
            font-style:italic;
            font-size:36px;
            line-height:90px;
            color:${c.gold};
            letter-spacing:2px;
          "
        >${initials(settings.brideName, settings.groomName)}</div>
      </div>

      ${capsLine("Together with their families", c, {
        size: 18,
        spacing: 6,
        weight: 700,
        color: c.inkSoft,
        top: 24,
      })}

      <div style="margin-top:20px;">
        ${scriptDuo(settings.brideName, settings.groomName, c, 86)}
      </div>

      ${ruleWithDiamond(c, 210, 24)}

      ${
        date
          ? `<div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:32px;letter-spacing:1px;color:${c.ink};text-align:center;margin-top:20px;line-height:1.4;">
               ${esc(date)}
             </div>`
          : ""
      }

      ${
        photo
          ? `<div style="margin-top:26px;">${heroPhoto(photo, 920, 520, settings.invitationImageFit)}</div>`
          : ""
      }

      ${
        guest
          ? capsLine(`Dear ${fullName(guest)}`, c, {
              size: 18,
              spacing: 5,
              weight: 700,
              color: c.inkSoft,
              top: 26,
            })
          : ""
      }

      ${
        settings.weddingMessage
          ? `<div style="margin-top:24px;">${messageBlock(
              settings.weddingMessage,
              c,
              700,
            )}</div>`
          : ""
      }

      <div style="margin-top:${photo ? 28 : 48}px;">${venues}</div>

      ${
        settings.dressCode
          ? `<div style="margin-top:26px;">${dressCodeInline(settings, c)}</div>`
          : ""
      }

      <div style="margin-top:26px;">${rsvpLine(settings, c)}</div>

      <div style="margin-top:26px;">${reservedPanel(guest, c)}</div>


    </div>
  `;

  return pageShell({
    palette,
    background: "#fbfaf7",
    children: body,
  });
}

/* -------------------------------------------------------------------------- */
/* Template selector                                                          */
/* -------------------------------------------------------------------------- */

const INVITATION_BUILDERS = {
  keepsake: keepsakeInvitationHtml,
  editorial: editorialInvitationHtml,
  // Legacy ids stored on existing settings documents.
  classic: keepsakeInvitationHtml,
  modern: editorialInvitationHtml,
  botanical: editorialInvitationHtml,
};

export function buildInvitationHtml(templateId, settings, guest, palette) {
  const build = INVITATION_BUILDERS[templateId] || keepsakeInvitationHtml;

  return build(settings, guest, palette);
}


/* -------------------------------------------------------------------------- */
/* PROGRAM                                                                    */
/* -------------------------------------------------------------------------- */

const MAX_ITEMS_PER_PAGE = 8;

function programHeaderHtml(
  settings,
  c,
  isFirstPage,
) {
  if (!isFirstPage) {
    return `
      <div
        style="
          text-align:center;
          padding:55px 0 12px;
        "
      >

        <div
          style="
            font-family:${FONT_DISPLAY};
            font-weight:500;
            font-size:29px;
            color:${c.ink};
            word-spacing:0.15em;
          "
        >
          ${esc(settings.brideName)} &amp;
          ${esc(settings.groomName)}
        </div>

        <div
          style="
            font-family:${FONT_BODY};
            font-style:italic;
            font-size:20px;
            color:${c.inkSoft};
            margin-top:3px;
          "
        >
          Order of the Day
        </div>

        <div style="margin-top:10px;">
          ${delicateDivider(c.gold, 260)}
        </div>

      </div>
    `;
  }

  return `
    <div
      style="
        text-align:center;
        padding:72px 80px 28px;
      "
    >

      ${weddingRings(c.gold, 55)}

      <div style="margin-top:8px;">
        ${eyebrow("Order of the Day", c)}
      </div>

      <div
        style="
          font-family:${FONT_SCRIPT};
          font-size:82px;
          color:${c.ink};
          margin-top:9px;
          line-height:1;
          word-spacing:0.2em;
        "
      >
        ${esc(settings.brideName || "Bride")}
        &amp;
        ${esc(settings.groomName || "Groom")}
      </div>

      <div
        style="
          font-family:${FONT_BODY};
          font-style:italic;
          font-size:24px;
          color:${c.inkSoft};
          margin-top:8px;
        "
      >
        ${esc(formatWeddingDate(settings.weddingDate))}
      </div>

      <div style="margin-top:15px;">
        ${delicateDivider(c.gold, 290)}
      </div>

    </div>
  `;
}

function timelineItemHtml(
  item,
  index,
  c,
  isLast,
) {
  return `
    <div
      style="
        display:flex;
        gap:25px;
        padding:0 100px;
      "
    >

      <div
        style="
          display:flex;
          flex-direction:column;
          align-items:center;
          width:35px;
          flex-shrink:0;
        "
      >

        <div
          style="
            width:30px;
            height:30px;
            border:1px solid ${c.gold};
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:${FONT_DISPLAY};
            font-size:14px;
            color:${c.gold};
          "
        >
          ${index + 1}
        </div>

        ${
          !isLast
            ? `
              <div
                style="
                  flex:1;
                  width:1px;
                  background:${c.goldFaint};
                  margin-top:5px;
                "
              ></div>
            `
            : ""
        }

      </div>

      <div
        style="
          padding-bottom:28px;
        "
      >

        <div
          style="
            font-family:${FONT_BODY};
            font-weight:600;
            font-size:14px;
            letter-spacing:2.4px;
            word-spacing:0.5em;
            text-transform:uppercase;
            color:${c.gold};
          "
        >
          ${esc(item.time || "")}
        </div>

        <div
          style="
            font-family:${FONT_DISPLAY};
            font-weight:600;
            font-size:25px;
            color:${c.ink};
            margin-top:2px;
            word-spacing:0.15em;
          "
        >
          ${esc(item.event || "")}
        </div>

        ${
          item.description
            ? `
              <div
                style="
                  font-family:${FONT_BODY};
                  font-size:20px;
                  color:${c.inkSoft};
                  margin-top:3px;
                  max-width:820px;
                  line-height:1.35;
                "
              >
                ${esc(item.description)}
              </div>
            `
            : ""
        }

      </div>

    </div>
  `;
}

export function buildProgramPages(
  settings,
  palette,
) {
  const c = palCss(palette);

  const items =
    settings.programItems || [];

  const chunks = [];

  for (
    let i = 0;
    i < Math.max(items.length, 1);
    i += MAX_ITEMS_PER_PAGE
  ) {
    chunks.push(
      items.slice(
        i,
        i + MAX_ITEMS_PER_PAGE,
      ),
    );
  }

  return chunks.map(
    (chunk, pageIndex) => {
      const isFirstPage =
        pageIndex === 0;

      const globalOffset =
        pageIndex *
        MAX_ITEMS_PER_PAGE;

      const body = `

        <div
          style="
            position:absolute;
            top:0;
            left:0;
            right:0;
            height:1px;
            background:${c.gold};
            opacity:0.22;
          "
        ></div>

        <div
          style="
            position:absolute;
            top:-20px;
            left:-20px;
          "
        >
          ${ornamentalCorner(c.ink, {
            width:230,
            height:230,
            opacity:0.45,
          })}
        </div>

        <div
          style="
            position:absolute;
            bottom:-20px;
            right:-20px;
          "
        >
          ${ornamentalCorner(c.ink, {
            width:230,
            height:230,
            mirrorX:true,
            mirrorY:true,
            opacity:0.4,
          })}
        </div>

        <div style="position:relative;">

          ${programHeaderHtml(
            settings,
            c,
            isFirstPage,
          )}

          <div style="padding:18px 0 40px;">

            ${
              chunk.length
                ? chunk
                    .map(
                      (item, i) =>
                        timelineItemHtml(
                          item,
                          globalOffset + i,
                          c,
                          i ===
                            chunk.length -
                              1,
                        ),
                    )
                    .join("")
                : `
                  <div
                    style="
                      text-align:center;
                      font-family:${FONT_BODY};
                      font-style:italic;
                      font-size:21px;
                      color:${c.inkSoft};
                    "
                  >
                    The order of the day will be shared soon.
                  </div>
                `
            }

          </div>

        </div>
      `;

      return pageShell({
        palette,
        background:"#fbfaf7",
        children:body,
      });
    },
  );
}

export const FONTS = {
  FONT_DISPLAY,
  FONT_SCRIPT,
  FONT_BODY,
  FONT_LABEL,
};