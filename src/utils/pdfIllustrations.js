// Small, dependency-free SVG illustration builders — hand-generated line
// art (flowers, leaves, rings, a laurel wreath) rather than stock clipart,
// so every shape can be recoloured to match the couple's chosen palette.
// These return raw SVG markup strings that get dropped into the HTML
// invitation/program templates and rasterized together by html2canvas.

export function rgbCss(rgb, alpha = 1) {
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function petal(cx, cy, r, angleDeg, color) {
  return `<ellipse cx="${cx}" cy="${cy - r * 0.85}" rx="${r * 0.42}" ry="${r}" fill="${color}" transform="rotate(${angleDeg} ${cx} ${cy})" />`;
}

// A simple rounded flower made of rotated petal ellipses around a center dot.
export function petalFlower({ cx, cy, r = 10, petals = 6, color, centerColor = "#fff8ec" }) {
  let out = "";
  for (let i = 0; i < petals; i++) {
    out += petal(cx, cy, r, (360 / petals) * i, color);
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${r * 0.32}" fill="${centerColor}" />`;
  return out;
}

function leaf(x, y, length, width, angleDeg, color, opacity = 0.9) {
  return `<path d="M ${x} ${y} Q ${x + width} ${y - length / 2} ${x} ${y - length} Q ${x - width} ${y - length / 2} ${x} ${y} Z" fill="${color}" opacity="${opacity}" transform="rotate(${angleDeg} ${x} ${y})" />`;
}

function stemWithLeaves(x1, y1, x2, y2, stemColor, leafColor, count = 4) {
  const baseAngle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  let leaves = "";
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    const side = i % 2 === 0 ? 1 : -1;
    leaves += leaf(x, y, 13, 4.5, baseAngle + side * 58, leafColor);
  }
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stemColor}" stroke-width="1.1" fill="none" opacity="0.8" />${leaves}`;
}

// A small hand-arranged bouquet sprig for page corners, drawn pointing
// up-and-right in a 150x150 box. Mirror with CSS transforms for the other
// three corners.
export function cornerSprig({ stem, leaf: leafColor, blooms = [] }, size = 150) {
  const [b1 = stem, b2 = leafColor, b3 = stem] = blooms;
  return `<svg width="${size}" height="${size}" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
    ${stemWithLeaves(6, 144, 96, 18, stem, leafColor, 5)}
    ${stemWithLeaves(6, 144, 46, 62, stem, leafColor, 3)}
    ${petalFlower({ cx: 92, cy: 22, r: 12, petals: 7, color: b1 })}
    ${petalFlower({ cx: 58, cy: 56, r: 8.5, petals: 6, color: b2 })}
    ${petalFlower({ cx: 30, cy: 96, r: 7, petals: 6, color: b3 })}
  </svg>`;
}

// Two interlocked wedding rings with a small gem sparkle above the join
// and a couple of twinkle marks nearby.
export function weddingRings(color, size = 64) {
  const r = size * 0.27;
  const cy = size * 0.56;
  const cx1 = size * 0.4;
  const cx2 = size * 0.62;
  const gemX = (cx1 + cx2) / 2;
  const gemY = cy - r - 4;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
    <circle cx="${cx1}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2.4" />
    <circle cx="${cx2}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2.4" />
    <path d="M ${gemX} ${gemY - 4} L ${gemX + 2.4} ${gemY} L ${gemX} ${gemY + 4} L ${gemX - 2.4} ${gemY} Z" fill="${color}" />
    <path d="M ${size * 0.86} ${size * 0.14} l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6-4 -4-1.6 4-1.6 Z" fill="${color}" opacity="0.75" />
    <path d="M ${size * 0.1} ${size * 0.32} l1 2.6 2.6 1 -2.6 1 -1 2.6 -1-2.6 -2.6-1 2.6-1 Z" fill="${color}" opacity="0.75" />
  </svg>`;
}

// A radial ring of leaves with a gap at the bottom — a laurel wreath sized
// to sit behind a monogram or portrait circle.
export function laurelWreath(color, size = 220, leafCount = 26, gapDeg = 46) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;
  const start = 90 + gapDeg / 2;
  const sweep = 360 - gapDeg;
  let leaves = "";
  for (let i = 0; i < leafCount; i++) {
    const t = i / (leafCount - 1);
    const angleDeg = start + sweep * t;
    const rad = (angleDeg * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    const rx = size * 0.05;
    const ry = size * 0.115;
    leaves += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="0.9" transform="rotate(${angleDeg + 90} ${x} ${y})" />`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">${leaves}</svg>`;
}

// A horizontal rule with a small flower-and-leaf cluster centered on it —
// used under headings in place of a plain line.
export function floralDivider({ stem, leaf: leafColor }, width = 220) {
  const midX = width / 2;
  return `<svg width="${width}" height="26" viewBox="0 0 ${width} 26" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
    <line x1="0" y1="13" x2="${midX - 22}" y2="13" stroke="${stem}" stroke-width="0.9" opacity="0.85" />
    <line x1="${midX + 22}" y1="13" x2="${width}" y2="13" stroke="${stem}" stroke-width="0.9" opacity="0.85" />
    ${leaf(midX - 15, 13, 11, 4, -35, leafColor)}
    ${leaf(midX + 15, 13, 11, 4, 35, leafColor)}
    ${petalFlower({ cx: midX, cy: 13, r: 6.5, petals: 6, color: stem })}
  </svg>`;
}