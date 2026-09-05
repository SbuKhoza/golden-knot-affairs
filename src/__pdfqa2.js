import { buildProgramPages, PAGE_WIDTH, PAGE_HEIGHT } from "@/utils/pdfTemplates";
import { getColorScheme } from "@/utils/pdfThemes";
const settings = {
  brideName: "Charles", groomName: "Nicolle", weddingDate: "2026-12-17",
  ceremonyVenueName: "St Michael's Chapel", receptionVenueName: "Silverleaf Estate",
  programItems: Array.from({ length: 9 }, (_, i) => ({ time: `1${i}:00`, event: `Moment number ${i + 1}`, description: i % 2 ? "A slightly longer description of what happens during this part of the day, with detail." : "" })),
};
const pages = buildProgramPages(settings, getColorScheme("").colors);
document.body.style.margin = "0";
pages.forEach((html, i) => {
  const el = document.createElement("div");
  el.id = `page${i}`;
  el.style.cssText = `width:${PAGE_WIDTH}px;height:${PAGE_HEIGHT}px;position:relative;`;
  el.innerHTML = html;
  document.body.appendChild(el);
});
