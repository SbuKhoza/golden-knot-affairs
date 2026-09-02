// Shared PDF theming config — the source of truth for both the admin
// "choose a look" UI and the actual jsPDF renderer, so the two never drift.
//
// Each color in a palette is an [r, g, b] triple (0–255) for jsPDF, plus a
// `hex` used purely to paint the little swatch preview in the admin UI.

export const PDF_COLOR_SCHEMES = [
  {
    id: "gold-cream",
    label: "Gold & Cream",
    hex: { accent: "#b09460", surface: "#faf6ed" },
    colors: {
      gold: [176, 148, 96],
      goldSoft: [206, 184, 140],
      ink: [58, 54, 48],
      cream: [250, 246, 237],
      creamDeep: [244, 238, 222],
    },
  },
  {
    id: "emerald-ivory",
    label: "Emerald & Ivory",
    hex: { accent: "#3f6b52", surface: "#f5f7f1" },
    colors: {
      gold: [63, 107, 82],
      goldSoft: [140, 173, 150],
      ink: [40, 46, 40],
      cream: [245, 247, 241],
      creamDeep: [232, 238, 226],
    },
  },
  {
    id: "rose-blush",
    label: "Rose & Blush",
    hex: { accent: "#b16a72", surface: "#fbf1ef" },
    colors: {
      gold: [177, 106, 114],
      goldSoft: [216, 168, 172],
      ink: [56, 42, 44],
      cream: [251, 241, 239],
      creamDeep: [245, 227, 225],
    },
  },
  {
    id: "navy-silver",
    label: "Navy & Silver",
    hex: { accent: "#33455f", surface: "#f2f4f7" },
    colors: {
      gold: [51, 69, 95],
      goldSoft: [150, 163, 182],
      ink: [35, 38, 44],
      cream: [242, 244, 247],
      creamDeep: [227, 231, 237],
    },
  },
  {
    id: "terracotta-sand",
    label: "Terracotta & Sand",
    hex: { accent: "#a5623a", surface: "#faf3ea" },
    colors: {
      gold: [165, 98, 58],
      goldSoft: [206, 156, 122],
      ink: [58, 45, 38],
      cream: [250, 243, 234],
      creamDeep: [242, 227, 210],
    },
  },
];

export const DEFAULT_COLOR_SCHEME_ID = "gold-cream";

export function getColorScheme(id) {
  return PDF_COLOR_SCHEMES.find((s) => s.id === id) || PDF_COLOR_SCHEMES[0];
}

export const PDF_TEMPLATES = [
  {
    id: "classic",
    label: "Classic Ornamental",
    description:
      "Framed border, corner flourishes, and a circular portrait — the original Golden Knot look.",
  },
  {
    id: "modern",
    label: "Modern Minimal",
    description: "Clean lines, generous type, a single rule — no border or corner ornaments.",
  },
  {
    id: "botanical",
    label: "Botanical Panel",
    description:
      "A soft banded header panel with a compact two-column details layout to fit more on one page.",
  },
];

export const DEFAULT_TEMPLATE_ID = "classic";

export function getTemplateMeta(id) {
  return PDF_TEMPLATES.find((t) => t.id === id) || PDF_TEMPLATES[0];
}