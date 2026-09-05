import { buildInvitationHtml, PAGE_WIDTH, PAGE_HEIGHT } from "@/utils/pdfTemplates";
import { getColorScheme } from "@/utils/pdfThemes";
const p = new URLSearchParams(location.search);
const long = p.get("long") === "1";
const settings = {
  brideName: long ? "Nomvulakazi Anathi" : "Charles",
  groomName: long ? "Sibusisiwe Thandolwethu" : "Nicolle",
  weddingDate: "2026-12-17",
  ceremonyTime: "14:00",
  ceremonyVenueName: long ? "The Grand Cathedral of Saint Michael and All Angels" : "St Michael's Chapel",
  ceremonyVenueAddress: long ? "128 Long Meandering Boulevard, Sandhurst Extension 4, Johannesburg, 2196" : "12 Oak Rd, Sandton",
  receptionTime: "17:30",
  receptionVenueName: long ? "Silverleaf Country Estate & Botanical Gardens" : "Silverleaf Estate",
  receptionVenueAddress: "44 Vine Street, Bryanston",
  dressCode: "Black tie, garden formal",
  weddingMessage: long
    ? "With hearts full of joy we invite you to share in the beginning of our forever. Your presence, your laughter and your love are the greatest gifts we could ask for on this most treasured day of our lives."
    : "Join us as we say I do.",
  rsvpDeadline: "2026-11-01",
  rsvpEnabled: true,
  invitationImageData: "https://picsum.photos/1200/1600",
  invitationImageFit: p.get("fit") || "cover",
};
const guest = long
  ? { firstName: "Bartholomew Alexander", surname: "Van Der Merwe-Nkosi", numberOfSeats: 4, tableNumber: 12, plusOneAllowed: true, plusOneName: "Josephine Matthews" }
  : { firstName: "John", surname: "Smith", numberOfSeats: 2, tableNumber: 3 };
const palette = getColorScheme("").colors;
const html = buildInvitationHtml(p.get("t") || "keepsake", settings, guest, palette);
const el = document.createElement("div");
el.style.cssText = `width:${PAGE_WIDTH}px;height:${PAGE_HEIGHT}px;position:relative;`;
el.id = "page";
el.innerHTML = html;
document.body.style.margin = "0";
document.body.appendChild(el);
