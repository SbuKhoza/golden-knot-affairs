import { formatWeddingDate } from "@/utils/format";
import { cornerSprig, floralDivider, laurelWreath, petalFlower, rgbCss, weddingRings } from "@/utils/pdfIllustrations";

// A4 at ~150dpi. html2canvas rasterizes this exact box; jsPDF then stretches
// the resulting image to fill a real A4 page, so the ratio must match A4
// (210:297) closely — 1240:1754 is a ~0.03% rounding difference, invisible.
export const PAGE_WIDTH = 1240;
export const PAGE_HEIGHT = 1754;

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_SCRIPT = "'Great Vibes', cursive";
const FONT_BODY = "'Cormorant Garamond', Georgia, serif";
const FONT_LABEL = "'Montserrat', 'Karla', sans-serif";

function palCss(palette) {
  return {
    gold: rgbCss(palette.gold),
    goldSoft: rgbCss(palette.goldSoft),
    goldFaint: rgbCss(palette.goldSoft, 0.45),
    ink: rgbCss(palette.ink),
    inkSoft: rgbCss(palette.ink, 0.72),
    cream: rgbCss(palette.cream),
    creamDeep: rgbCss(palette.creamDeep),
    leaf: rgbCss(palette.leaf),
    bloomA: rgbCss(palette.petalTint?.[0] || palette.gold),
    bloomB: rgbCss(palette.petalTint?.[1] || palette.goldSoft),
  };
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function photoTag(src, size, radius = "50%") {
  if (!src) return "";
  return `<img src="${src}" crossorigin="anonymous" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:${radius};display:block;" />`;
}

function initials(bride, groom) {
  const b = (bride || "B").trim()[0] || "B";
  const g = (groom || "G").trim()[0] || "G";
  return `${b}${g}`.toUpperCase();
}

// ---------- Shared content blocks (used by all three templates) ----------

function eyebrow(text, c) {
  return `<div style="font-family:${FONT_LABEL};font-size:15px;letter-spacing:5px;text-transform:uppercase;color:${c.gold};text-align:center;">${esc(text)}</div>`;
}

function scriptNames(bride, groom, c, size = 92) {
  return `
  <div style="display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap;">
    <span style="font-family:${FONT_SCRIPT};font-size:${size}px;color:${c.ink};line-height:1;">${esc(bride || "Bride")}</span>
    <span style="font-family:${FONT_DISPLAY};font-style:italic;font-size:${size * 0.4}px;color:${c.gold};">&amp;</span>
    <span style="font-family:${FONT_SCRIPT};font-size:${size}px;color:${c.ink};line-height:1;">${esc(groom || "Groom")}</span>
  </div>`;
}

function serifNames(bride, groom, c) {
  return `
  <div style="text-align:center;">
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:56px;color:${c.ink};letter-spacing:1px;">${esc(bride || "Bride")}</div>
    <div style="font-family:${FONT_DISPLAY};font-style:italic;font-size:26px;color:${c.gold};margin:6px 0;">&amp;</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:56px;color:${c.ink};letter-spacing:1px;">${esc(groom || "Groom")}</div>
  </div>`;
}

function messageBlock(message, c, maxWidth = 760) {
  if (!message) return "";
  return `<p style="font-family:${FONT_BODY};font-style:italic;font-size:23px;line-height:1.55;color:${c.inkSoft};text-align:center;max-width:${maxWidth}px;margin:0 auto;">${esc(message)}</p>`;
}

function detailLabel(text, c) {
  return `<div style="font-family:${FONT_LABEL};font-size:13px;letter-spacing:3.5px;text-transform:uppercase;color:${c.gold};">${esc(text)}</div>`;
}

function venueBlockHtml({ title, time, name, address, mapUrl }, c, opts = {}) {
  if (!time && !name && !address) return "";
  const { align = "center" } = opts;
  return `
  <div style="text-align:${align};position:relative;">
    ${detailLabel(title, c)}
    ${time ? `<div style="font-family:${FONT_BODY};font-style:italic;font-size:26px;color:${c.ink};margin-top:6px;">${esc(time)}</div>` : ""}
    ${name ? `<div style="font-family:${FONT_DISPLAY};font-weight:600;font-size:22px;color:${c.ink};letter-spacing:0.5px;margin-top:4px;">${esc(name).toUpperCase()}</div>` : ""}
    ${address ? `<div style="font-family:${FONT_BODY};font-size:19px;color:${c.inkSoft};margin-top:4px;max-width:420px;">${esc(address)}</div>` : ""}
    ${
      mapUrl
        ? `<div data-pdf-link="${esc(mapUrl)}" style="display:inline-block;margin-top:6px;font-family:${FONT_LABEL};font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:${c.gold};text-decoration:underline;cursor:pointer;">View on map ↗</div>`
        : ""
    }
  </div>`;
}

function dressCodeHtml(settings, c) {
  if (!settings.dressCode) return "";
  const img = settings.dressCodeImageData || settings.dressCodeImageUrl;
  return `
  <div style="text-align:center;">
    ${detailLabel("Dress Code", c)}
    <div style="font-family:${FONT_BODY};font-style:italic;font-size:24px;color:${c.ink};margin-top:6px;">${esc(settings.dressCode)}</div>
    ${img ? `<div style="margin:10px auto 0;width:96px;height:96px;border-radius:10px;overflow:hidden;border:2px solid ${c.gold};">${photoTag(img, 96, "8px")}</div>` : ""}
  </div>`;
}

function rsvpHtml(settings, c) {
  if (!settings.rsvpEnabled) return "";
  const deadline = settings.rsvpDeadline ? formatWeddingDate(settings.rsvpDeadline) : "";
  return `
  <div style="display:flex;align-items:center;justify-content:center;gap:10px;">
    ${weddingRings(c.gold, 34)}
    <span style="font-family:${FONT_BODY};font-style:italic;font-size:20px;color:${c.inkSoft};">
      ${deadline ? `Kindly RSVP by ${esc(deadline)}` : "Kindly RSVP at your earliest convenience"}
    </span>
  </div>`;
}

// The "reserved for" ticket stub showing every guest-specific detail:
// name, seat count, table number, plus-one.
function guestTicketHtml(guest, c, variant = "dashed") {
  if (!guest) return "";
  const seatWord = `${guest.numberOfSeats} seat${Number(guest.numberOfSeats) === 1 ? "" : "s"}`;
  const chips = [seatWord];
  if (guest.tableNumber) chips.push(`Table ${esc(guest.tableNumber)}`);
  if (guest.plusOneAllowed && guest.plusOneName) chips.push(`Plus one: ${esc(guest.plusOneName)}`);
  const border = variant === "dashed" ? `2px dashed ${c.gold}` : `1.5px solid ${c.gold}`;
  return `
  <div style="margin:0 auto;max-width:560px;border:${border};border-radius:14px;padding:18px 26px;background:${c.creamDeep};text-align:center;">
    <div style="font-family:${FONT_LABEL};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${c.gold};">Reserved For</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:600;font-size:26px;color:${c.ink};margin-top:4px;">${esc(guest.firstName)} ${esc(guest.surname)}</div>
    <div style="font-family:${FONT_BODY};font-size:18px;color:${c.inkSoft};margin-top:6px;">${chips.join(" &nbsp;·&nbsp; ")}</div>
  </div>`;
}

function pageShell({ palette, background = "cream", children }) {
  const c = palCss(palette);
  return `
  <div style="width:${PAGE_WIDTH}px;height:${PAGE_HEIGHT}px;position:relative;overflow:hidden;background:${background === "white" ? "#ffffff" : c.cream};box-sizing:border-box;font-family:${FONT_BODY};">
    ${children}
  </div>`;
}

// ---------------------------- Classic Ornamental ----------------------------

export function classicInvitationHtml(settings, guest, palette) {
  const c = palCss(palette);
  const photo = settings.invitationImageData || settings.invitationImageUrl;
  const dateLine = [formatWeddingDate(settings.weddingDate), settings.ceremonyTime].filter(Boolean).join("  ·  ");

  const body = `
    <div style="position:absolute;inset:26px;border:1.5px solid ${c.gold};border-radius:2px;"></div>
    <div style="position:absolute;inset:34px;border:1px solid ${c.goldFaint};border-radius:2px;"></div>

    <div style="position:absolute;top:8px;left:8px;">${cornerSprig({ stem: c.gold, leaf: c.leaf, blooms: [c.bloomA, c.bloomB, c.gold] }, 160)}</div>
    <div style="position:absolute;top:8px;right:8px;transform:scaleX(-1);">${cornerSprig({ stem: c.gold, leaf: c.leaf, blooms: [c.bloomA, c.bloomB, c.gold] }, 160)}</div>
    <div style="position:absolute;bottom:8px;left:8px;transform:scaleY(-1);">${cornerSprig({ stem: c.gold, leaf: c.leaf, blooms: [c.bloomB, c.bloomA, c.gold] }, 160)}</div>
    <div style="position:absolute;bottom:8px;right:8px;transform:scale(-1,-1);">${cornerSprig({ stem: c.gold, leaf: c.leaf, blooms: [c.bloomB, c.bloomA, c.gold] }, 160)}</div>

    <div style="position:relative;padding:78px 90px 60px;display:flex;flex-direction:column;align-items:center;gap:22px;height:100%;box-sizing:border-box;">
      ${eyebrow("Together with their families", c)}

      <div style="position:relative;width:260px;height:260px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;">${laurelWreath(c.gold, 260, 30, 44)}</div>
        <div style="width:200px;height:200px;border-radius:50%;background:${c.creamDeep};border:3px solid ${c.gold};display:flex;align-items:center;justify-content:center;overflow:hidden;">
          ${photo ? photoTag(photo, 200) : `<span style="font-family:${FONT_DISPLAY};font-style:italic;font-weight:600;font-size:64px;color:${c.gold};">${initials(settings.brideName, settings.groomName)}</span>`}
        </div>
      </div>

      ${scriptNames(settings.brideName, settings.groomName, c, 88)}

      <div style="display:flex;justify-content:center;">${floralDivider({ stem: c.gold, leaf: c.leaf }, 300)}</div>

      ${messageBlock(settings.weddingMessage, c)}

      <div style="font-family:${FONT_DISPLAY};font-weight:600;font-size:30px;color:${c.ink};letter-spacing:1px;">${esc(dateLine || "Date to be confirmed")}</div>

      <div style="display:flex;gap:70px;justify-content:center;flex-wrap:wrap;margin-top:4px;">
        ${venueBlockHtml({ title: "Ceremony", name: settings.ceremonyVenueName, address: settings.ceremonyVenueAddress, mapUrl: settings.ceremonyVenueMapUrl }, c)}
        ${venueBlockHtml({ title: "Reception", time: settings.receptionTime, name: settings.receptionVenueName, address: settings.receptionVenueAddress, mapUrl: settings.receptionVenueMapUrl }, c)}
      </div>

      ${dressCodeHtml(settings, c)}
      ${rsvpHtml(settings, c)}

      <div style="flex:1;"></div>
      ${guestTicketHtml(guest, c, "dashed")}
    </div>`;

  return pageShell({ palette, children: body });
}

// ----------------------------- Modern Minimal -----------------------------

export function modernInvitationHtml(settings, guest, palette) {
  const c = palCss(palette);
  const photo = settings.invitationImageData || settings.invitationImageUrl;
  const dateLine = [formatWeddingDate(settings.weddingDate), settings.ceremonyTime].filter(Boolean).join("  ·  ");

  const body = `
    <div style="position:absolute;top:0;left:0;width:100%;height:6px;background:${c.gold};"></div>
    <div style="position:relative;padding:96px 110px 60px;display:flex;flex-direction:column;align-items:center;gap:26px;height:100%;box-sizing:border-box;">
      ${eyebrow("We are getting married", c)}

      <div style="width:170px;height:170px;border-radius:50%;overflow:hidden;border:1.5px solid ${c.gold};display:flex;align-items:center;justify-content:center;background:${c.creamDeep};">
        ${photo ? photoTag(photo, 170) : `<span style="font-family:${FONT_DISPLAY};font-weight:600;font-size:52px;color:${c.gold};">${initials(settings.brideName, settings.groomName)}</span>`}
      </div>

      ${serifNames(settings.brideName, settings.groomName, c)}

      <div style="width:70px;height:1px;background:${c.gold};"></div>

      ${messageBlock(settings.weddingMessage, c, 620)}

      <div style="font-family:${FONT_BODY};font-size:24px;letter-spacing:0.5px;color:${c.ink};">${esc(dateLine || "Date to be confirmed")}</div>

      <div style="display:flex;gap:64px;justify-content:center;flex-wrap:wrap;width:100%;">
        ${venueBlockHtml({ title: "Ceremony", name: settings.ceremonyVenueName, address: settings.ceremonyVenueAddress, mapUrl: settings.ceremonyVenueMapUrl }, c)}
        ${venueBlockHtml({ title: "Reception", time: settings.receptionTime, name: settings.receptionVenueName, address: settings.receptionVenueAddress, mapUrl: settings.receptionVenueMapUrl }, c)}
      </div>

      ${dressCodeHtml(settings, c)}
      ${rsvpHtml(settings, c)}

      <div style="flex:1;"></div>
      ${guestTicketHtml(guest, c, "solid")}
    </div>`;

  return pageShell({ palette, background: "white", children: body });
}

// ---------------------------- Botanical Panel ----------------------------

export function botanicalInvitationHtml(settings, guest, palette) {
  const c = palCss(palette);
  const photo = settings.invitationImageData || settings.invitationImageUrl;
  const dateLine = [formatWeddingDate(settings.weddingDate), settings.ceremonyTime].filter(Boolean).join("  ·  ");

  const body = `
    <div style="position:relative;height:${PAGE_HEIGHT}px;box-sizing:border-box;">
      <div style="position:relative;background:${c.gold};padding:56px 80px 44px;text-align:center;overflow:hidden;">
        <div style="position:absolute;top:-30px;left:-30px;opacity:0.35;">${laurelWreath("rgba(255,255,255,0.5)", 180, 20, 200)}</div>
        <div style="position:absolute;bottom:-60px;right:-30px;opacity:0.35;transform:rotate(180deg);">${laurelWreath("rgba(255,255,255,0.5)", 180, 20, 200)}</div>
        <div style="position:relative;font-family:${FONT_LABEL};font-size:14px;letter-spacing:5px;text-transform:uppercase;color:${c.cream};">We're Getting Married</div>
        <div style="position:relative;font-family:${FONT_SCRIPT};font-size:80px;color:#ffffff;margin-top:8px;line-height:1;">${esc(settings.brideName || "Bride")} &amp; ${esc(settings.groomName || "Groom")}</div>
        <div style="position:relative;font-family:${FONT_BODY};font-style:italic;font-size:24px;color:${c.cream};margin-top:10px;">${esc(dateLine || "Date to be confirmed")}</div>
      </div>

      <div style="padding:40px 80px 0;display:flex;flex-direction:column;align-items:center;gap:24px;">
        ${
          photo
            ? `<div style="width:150px;height:150px;border-radius:16px;overflow:hidden;border:3px solid ${c.gold};margin-top:-92px;box-shadow:0 6px 18px rgba(0,0,0,0.18);">${photoTag(photo, 150, "12px")}</div>`
            : ""
        }

        ${messageBlock(settings.weddingMessage, c, 720)}

        <div style="display:flex;gap:30px;width:100%;justify-content:center;flex-wrap:wrap;">
          <div style="flex:1;min-width:320px;max-width:400px;border:1.5px solid ${c.goldSoft};border-radius:14px;padding:26px 20px;background:${c.creamDeep};text-align:center;">
            <div style="display:flex;justify-content:center;margin-bottom:6px;"><svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${petalFlower({ cx: 12, cy: 12, r: 11, petals: 6, color: c.gold, centerColor: c.creamDeep })}</svg></div>
            ${venueBlockHtml({ title: "Ceremony", name: settings.ceremonyVenueName, address: settings.ceremonyVenueAddress, mapUrl: settings.ceremonyVenueMapUrl }, c)}
          </div>
          <div style="flex:1;min-width:320px;max-width:400px;border:1.5px solid ${c.goldSoft};border-radius:14px;padding:26px 20px;background:${c.creamDeep};text-align:center;">
            ${venueBlockHtml({ title: "Reception", time: settings.receptionTime, name: settings.receptionVenueName, address: settings.receptionVenueAddress, mapUrl: settings.receptionVenueMapUrl }, c)}
          </div>
        </div>

        <div style="display:flex;gap:60px;justify-content:center;flex-wrap:wrap;">
          ${dressCodeHtml(settings, c)}
        </div>
        ${rsvpHtml(settings, c)}
        ${guestTicketHtml(guest, c, "solid")}
      </div>
    </div>`;

  return pageShell({ palette, background: "white", children: body });
}

const INVITATION_BUILDERS = {
  classic: classicInvitationHtml,
  modern: modernInvitationHtml,
  botanical: botanicalInvitationHtml,
};

export function buildInvitationHtml(templateId, settings, guest, palette) {
  const build = INVITATION_BUILDERS[templateId] || classicInvitationHtml;
  return build(settings, guest, palette);
}

// --------------------------------- Program ---------------------------------

const MAX_ITEMS_PER_PAGE = 8;

function programHeaderHtml(settings, c, isFirstPage) {
  if (!isFirstPage) {
    return `
    <div style="text-align:center;padding:50px 0 10px;">
      <div style="font-family:${FONT_DISPLAY};font-weight:600;font-size:26px;color:${c.ink};">${esc(settings.brideName)} &amp; ${esc(settings.groomName)} — Order of the Day</div>
      <div style="display:flex;justify-content:center;margin-top:8px;">${floralDivider({ stem: c.gold, leaf: c.leaf }, 220)}</div>
    </div>`;
  }
  return `
  <div style="text-align:center;padding:70px 80px 20px;">
    <div style="display:flex;justify-content:center;">${weddingRings(c.gold, 60)}</div>
    ${eyebrow("Order Of The Day", c)}
    <div style="font-family:${FONT_SCRIPT};font-size:64px;color:${c.ink};margin-top:8px;">${esc(settings.brideName || "Bride")} &amp; ${esc(settings.groomName || "Groom")}</div>
    <div style="font-family:${FONT_BODY};font-style:italic;font-size:22px;color:${c.inkSoft};margin-top:6px;">${esc(formatWeddingDate(settings.weddingDate))}</div>
    <div style="display:flex;justify-content:center;margin-top:14px;">${floralDivider({ stem: c.gold, leaf: c.leaf }, 260)}</div>
  </div>`;
}

function timelineItemHtml(item, index, c, isLast) {
  return `
  <div style="display:flex;gap:26px;padding:0 90px;">
    <div style="display:flex;flex-direction:column;align-items:center;width:44px;flex-shrink:0;">
      <div style="width:38px;height:38px;border-radius:50%;border:1.5px solid ${c.gold};background:${c.creamDeep};display:flex;align-items:center;justify-content:center;font-family:${FONT_DISPLAY};font-weight:600;font-size:16px;color:${c.gold};">${index + 1}</div>
      ${!isLast ? `<div style="flex:1;width:1px;background:${c.goldFaint};margin-top:4px;"></div>` : ""}
    </div>
    <div style="padding-bottom:30px;">
      <div style="font-family:${FONT_LABEL};font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${c.gold};">${esc(item.time || "")}</div>
      <div style="font-family:${FONT_DISPLAY};font-weight:600;font-size:24px;color:${c.ink};margin-top:2px;">${esc(item.event || "")}</div>
      ${item.description ? `<div style="font-family:${FONT_BODY};font-size:19px;color:${c.inkSoft};margin-top:4px;max-width:820px;">${esc(item.description)}</div>` : ""}
    </div>
  </div>`;
}

export function buildProgramPages(settings, palette) {
  const c = palCss(palette);
  const items = settings.programItems || [];
  const chunks = [];
  for (let i = 0; i < Math.max(items.length, 1); i += MAX_ITEMS_PER_PAGE) {
    chunks.push(items.slice(i, i + MAX_ITEMS_PER_PAGE));
  }

  return chunks.map((chunk, pageIndex) => {
    const isFirstPage = pageIndex === 0;
    const globalOffset = pageIndex * MAX_ITEMS_PER_PAGE;
    const body = `
      <div style="position:absolute;inset:26px;border:1.5px solid ${c.gold};border-radius:2px;"></div>
      <div style="position:absolute;inset:34px;border:1px solid ${c.goldFaint};border-radius:2px;"></div>
      <div style="position:absolute;top:8px;left:8px;">${cornerSprig({ stem: c.gold, leaf: c.leaf, blooms: [c.bloomA, c.bloomB, c.gold] }, 140)}</div>
      <div style="position:absolute;bottom:8px;right:8px;transform:scale(-1,-1);">${cornerSprig({ stem: c.gold, leaf: c.leaf, blooms: [c.bloomB, c.bloomA, c.gold] }, 140)}</div>

      <div style="position:relative;">
        ${programHeaderHtml(settings, c, isFirstPage)}
        <div style="padding:20px 0 40px;">
          ${chunk.map((item, i) => timelineItemHtml(item, globalOffset + i, c, i === chunk.length - 1)).join("")}
          ${chunk.length === 0 ? `<div style="text-align:center;font-family:${FONT_BODY};font-style:italic;font-size:20px;color:${c.inkSoft};">The order of the day will be shared soon.</div>` : ""}
        </div>
      </div>`;
    return pageShell({ palette, children: body });
  });
}

export const FONTS = { FONT_DISPLAY, FONT_SCRIPT, FONT_BODY, FONT_LABEL };