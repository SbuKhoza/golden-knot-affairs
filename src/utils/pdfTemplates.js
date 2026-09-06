// src/utils/pdfTemplates.js
//
// HTML/CSS building blocks for the jsPDF + html2canvas renderer, used only
// for the wedding *program*. The invitation used to have its own pre-coded
// designs here too, but the invitation is now always the admin's uploaded
// fillable PDF template (see `pdfFormFill.js`) — there is no generated
// fallback design any more, so those builders have been removed.

import { formatWeddingDate } from "@/utils/format";

import {
  delicateDivider,
  ornamentalCorner,
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
/* PROGRAM                                                                    */
/* -------------------------------------------------------------------------- */

const MAX_ITEMS_PER_PAGE = 12;

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
          ${esc(settings.brideName)}&nbsp;&amp;&nbsp;${esc(settings.groomName)}
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
        ${esc(settings.brideName || "Bride")}&nbsp;&amp;&nbsp;${esc(settings.groomName || "Groom")}
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
        gap:28px;
        max-width:880px;
        margin:0 auto;
        padding:0 40px;
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
          padding-bottom:34px;
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