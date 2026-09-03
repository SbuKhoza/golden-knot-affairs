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
export const PAGE_HEIGHT = 1754;

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

  return `
    <p
      style="
        font-family:${FONT_BODY};
        font-style:italic;
        font-weight:500;
        font-size:27px;
        line-height:1.45;
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
        font-size:15px;
        letter-spacing:3px;
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
                font-size:27px;
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
                font-size:24px;
                color:${c.ink};
                margin-top:5px;
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
                font-size:20px;
                color:${c.inkSoft};
                margin-top:5px;
                line-height:1.35;
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
          font-size:25px;
          color:${c.ink};
          margin-top:6px;
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
          font-size:21px;
          color:${c.inkSoft};
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
          font-size:29px;
          color:${c.ink};
          margin-top:4px;
        "
      >
        ${esc(guest.firstName)} ${esc(guest.surname)}
      </div>

      <div
        style="
          font-family:${FONT_BODY};
          font-style:italic;
          font-size:18px;
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
/* CLASSIC — NEW HERO DESIGN                                                  */
/* -------------------------------------------------------------------------- */

export function classicInvitationHtml(
  settings,
  guest,
  palette,
) {
  const c = palCss(palette);

  const photo =
    settings.invitationImageData ||
    settings.invitationImageUrl;

  const date = dateLine(settings);

  const body = `

    <!-- ================================================================ -->
    <!-- HERO PHOTOGRAPH                                                  -->
    <!-- ================================================================ -->

    ${heroImage({
      photo,
      c,
      height: 735,
    })}


    <!-- ================================================================ -->
    <!-- FINE BOTANICAL CORNERS                                           -->
    <!-- ================================================================ -->

    <div
      style="
        position:absolute;
        top:-18px;
        left:-18px;
      "
    >
      ${ornamentalCorner(c.ink, {
        width:280,
        height:280,
        opacity:0.58,
      })}
    </div>

    <div
      style="
        position:absolute;
        top:-18px;
        right:-18px;
      "
    >
      ${ornamentalCorner(c.ink, {
        width:280,
        height:280,
        mirrorX:true,
        opacity:0.58,
      })}
    </div>

    <div
      style="
        position:absolute;
        bottom:-25px;
        left:-18px;
      "
    >
      ${ornamentalCorner(c.ink, {
        width:280,
        height:280,
        mirrorY:true,
        opacity:0.48,
      })}
    </div>

    <div
      style="
        position:absolute;
        bottom:-25px;
        right:-18px;
      "
    >
      ${ornamentalCorner(c.ink, {
        width:280,
        height:280,
        mirrorX:true,
        mirrorY:true,
        opacity:0.48,
      })}
    </div>


    <!-- ================================================================ -->
    <!-- HERO TEXT — deliberately overlaps the photograph                 -->
    <!-- ================================================================ -->

    <div
      style="
        position:absolute;
        top:510px;
        left:0;
        width:100%;
        text-align:center;
      "
    >

      ${eyebrow("Together with their families", c)}

      <div style="margin-top:15px;">
        ${scriptNames(
          settings.brideName,
          settings.groomName,
          c,
          122,
        )}
      </div>

      <div style="margin-top:18px;">
        ${delicateDivider(c.gold, 320)}
      </div>

      ${
        date
          ? `
            <div
              style="
                font-family:${FONT_DISPLAY};
                font-size:27px;
                font-weight:500;
                letter-spacing:0.4px;
                color:${c.ink};
                margin-top:10px;
              "
            >
              ${esc(date)}
            </div>
          `
          : ""
      }

    </div>


    <!-- ================================================================ -->
    <!-- LOWER INFORMATION                                                -->
    <!-- ================================================================ -->

    <div
      style="
        position:absolute;
        left:90px;
        right:90px;
        top:805px;
        bottom:70px;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:flex-start;
        gap:24px;
      "
    >

      ${messageBlock(
        settings.weddingMessage,
        c,
        850,
      )}

      <!-- Event information -->
      <div
        style="
          display:flex;
          align-items:flex-start;
          justify-content:center;
          gap:72px;
          width:100%;
          margin-top:6px;
        "
      >

        ${venueBlockHtml(
          {
            title:"Ceremony",
            time:settings.ceremonyTime,
            name:settings.ceremonyVenueName,
            address:settings.ceremonyVenueAddress,
            mapUrl:settings.ceremonyVenueMapUrl,
          },
          c,
        )}

        <div
          style="
            width:1px;
            height:110px;
            background:${c.gold};
            opacity:0.25;
            margin-top:10px;
          "
        ></div>

        ${venueBlockHtml(
          {
            title:"Reception",
            time:settings.receptionTime,
            name:settings.receptionVenueName,
            address:settings.receptionVenueAddress,
            mapUrl:settings.receptionVenueMapUrl,
          },
          c,
        )}

      </div>


      ${dressCodeHtml(settings, c)}

      ${rsvpHtml(settings, c)}

      ${guestTicketHtml(guest, c)}

    </div>


    <!-- Small botanical accent -->
    <div
      style="
        position:absolute;
        left:475px;
        bottom:8px;
        opacity:0.45;
      "
    >
      ${lineRose(c.gold, 75)}
    </div>

  `;

  return pageShell({
    palette,
    background:"#fbfaf7",
    children:body,
  });
}

/* -------------------------------------------------------------------------- */
/* MODERN                                                                     */
/* -------------------------------------------------------------------------- */

export function modernInvitationHtml(
  settings,
  guest,
  palette,
) {
  const c = palCss(palette);

  const photo =
    settings.invitationImageData ||
    settings.invitationImageUrl;

  const date = dateLine(settings);

  const body = `

    ${heroImage({
      photo,
      c,
      height:610,
    })}

    <!-- Minimal engraved botanical linework -->
    <div
      style="
        position:absolute;
        top:-15px;
        right:-30px;
      "
    >
      ${botanicalBranch(c.gold, {
        width:330,
        height:270,
        opacity:0.55,
      })}
    </div>

    <div
      style="
        position:absolute;
        bottom:-20px;
        left:-25px;
        transform:rotate(180deg);
      "
    >
      ${botanicalBranch(c.gold, {
        width:300,
        height:240,
        opacity:0.4,
      })}
    </div>

    <div
      style="
        position:absolute;
        top:425px;
        left:80px;
        right:80px;
        text-align:center;
      "
    >

      ${eyebrow("We are getting married", c)}

      <div style="margin-top:13px;">
        ${serifNames(
          settings.brideName,
          settings.groomName,
          c,
        )}
      </div>

      <div style="margin-top:13px;">
        ${delicateDivider(c.gold, 280)}
      </div>

      ${
        date
          ? `
            <div
              style="
                font-family:${FONT_BODY};
                font-style:italic;
                font-size:27px;
                color:${c.ink};
                margin-top:7px;
              "
            >
              ${esc(date)}
            </div>
          `
          : ""
      }

    </div>


    <div
      style="
        position:absolute;
        top:735px;
        left:100px;
        right:100px;
        bottom:60px;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:25px;
      "
    >

      ${messageBlock(
        settings.weddingMessage,
        c,
        800,
      )}

      <div
        style="
          display:flex;
          justify-content:center;
          gap:65px;
          width:100%;
        "
      >

        ${venueBlockHtml(
          {
            title:"Ceremony",
            time:settings.ceremonyTime,
            name:settings.ceremonyVenueName,
            address:settings.ceremonyVenueAddress,
            mapUrl:settings.ceremonyVenueMapUrl,
          },
          c,
        )}

        ${venueBlockHtml(
          {
            title:"Reception",
            time:settings.receptionTime,
            name:settings.receptionVenueName,
            address:settings.receptionVenueAddress,
            mapUrl:settings.receptionVenueMapUrl,
          },
          c,
        )}

      </div>

      ${dressCodeHtml(settings, c)}

      ${rsvpHtml(settings, c)}

      ${guestTicketHtml(guest, c)}

    </div>

  `;

  return pageShell({
    palette,
    background:"#ffffff",
    children:body,
  });
}

/* -------------------------------------------------------------------------- */
/* BOTANICAL                                                                  */
/* -------------------------------------------------------------------------- */

export function botanicalInvitationHtml(
  settings,
  guest,
  palette,
) {
  const c = palCss(palette);

  const photo =
    settings.invitationImageData ||
    settings.invitationImageUrl;

  const date = dateLine(settings);

  const body = `

    ${heroImage({
      photo,
      c,
      height:760,
    })}

    <!-- Hand drawn foliage -->
    <div
      style="
        position:absolute;
        top:-15px;
        left:-25px;
      "
    >
      ${botanicalBranch(c.ink, {
        width:340,
        height:280,
        opacity:0.55,
      })}
    </div>

    <div
      style="
        position:absolute;
        top:-15px;
        right:-25px;
        transform:scaleX(-1);
      "
    >
      ${botanicalBranch(c.ink, {
        width:340,
        height:280,
        opacity:0.55,
      })}
    </div>


    <!-- Text over the photograph -->
    <div
      style="
        position:absolute;
        top:535px;
        left:65px;
        right:65px;
        text-align:center;
      "
    >

      ${eyebrow("We're getting married", c)}

      <div style="margin-top:8px;">
        ${scriptNames(
          settings.brideName,
          settings.groomName,
          c,
          126,
        )}
      </div>

      <div style="margin-top:13px;">
        ${delicateDivider(c.gold, 310)}
      </div>

      ${
        date
          ? `
            <div
              style="
                font-family:${FONT_DISPLAY};
                font-size:28px;
                font-weight:500;
                color:${c.ink};
                margin-top:7px;
              "
            >
              ${esc(date)}
            </div>
          `
          : ""
      }

    </div>


    <div
      style="
        position:absolute;
        top:825px;
        left:85px;
        right:85px;
        bottom:55px;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:23px;
      "
    >

      ${messageBlock(
        settings.weddingMessage,
        c,
        850,
      )}

      <div
        style="
          display:flex;
          align-items:flex-start;
          justify-content:center;
          gap:65px;
          width:100%;
        "
      >

        ${venueBlockHtml(
          {
            title:"Ceremony",
            time:settings.ceremonyTime,
            name:settings.ceremonyVenueName,
            address:settings.ceremonyVenueAddress,
            mapUrl:settings.ceremonyVenueMapUrl,
          },
          c,
        )}

        ${venueBlockHtml(
          {
            title:"Reception",
            time:settings.receptionTime,
            name:settings.receptionVenueName,
            address:settings.receptionVenueAddress,
            mapUrl:settings.receptionVenueMapUrl,
          },
          c,
        )}

      </div>

      ${dressCodeHtml(settings, c)}

      ${rsvpHtml(settings, c)}

      ${guestTicketHtml(guest, c)}

    </div>

    <div
      style="
        position:absolute;
        right:18px;
        bottom:12px;
        opacity:0.35;
      "
    >
      ${lineRose(c.gold, 90)}
    </div>

  `;

  return pageShell({
    palette,
    background:"#fbfaf7",
    children:body,
  });
}

/* -------------------------------------------------------------------------- */
/* Template selector                                                          */
/* -------------------------------------------------------------------------- */

const INVITATION_BUILDERS = {
  classic: classicInvitationHtml,
  modern: modernInvitationHtml,
  botanical: botanicalInvitationHtml,
};

export function buildInvitationHtml(
  templateId,
  settings,
  guest,
  palette,
) {
  const build =
    INVITATION_BUILDERS[templateId] ||
    classicInvitationHtml;

  return build(
    settings,
    guest,
    palette,
  );
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