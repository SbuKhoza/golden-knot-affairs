// src/utils/pdfIllustrations.js
//
// Elegant hand-drawn SVG ornaments for wedding stationery.
// IMPORTANT:
// - No filled botanical shapes.
// - No gradients.
// - No heavy clip-art.
// - Everything is delicate line art.
// - Designed to look like engraved / hand-illustrated stationery.
//

export function rgbCss(rgb, alpha = 1) {
  if (!rgb) return `rgba(0,0,0,${alpha})`;

  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

/**
 * A delicate botanical branch.
 *
 * This is deliberately line-art only.
 */
export function botanicalBranch(
  color,
  {
    width = 260,
    height = 220,
    mirror = false,
    opacity = 0.78,
  } = {},
) {
  const transform = mirror ? `translate(${width} 0) scale(-1 1)` : "";

  return `
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg"
      style="overflow:visible;display:block;"
    >
      <g
        transform="${transform}"
        fill="none"
        stroke="${esc(color)}"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="${opacity}"
      >

        <!-- Main graceful stem -->
        <path
          d="
            M 18 ${height - 14}
            C 55 ${height - 58},
              74 ${height - 91},
              103 ${height - 124}
            C 132 ${height - 157},
              170 ${height - 181},
              224 24
          "
          stroke-width="2"
        />

        <!-- Secondary stem -->
        <path
          d="
            M 67 ${height - 77}
            C 83 ${height - 106},
              102 ${height - 135},
              129 ${height - 151}
          "
          stroke-width="1.35"
        />

        <!-- Upper branch -->
        <path
          d="
            M 119 ${height - 143}
            C 143 ${height - 153},
              167 ${height - 165},
              188 ${height - 188}
          "
          stroke-width="1.2"
        />

        <!-- Leaf 1 -->
        <path
          d="
            M 52 ${height - 61}
            C 42 ${height - 83},
              44 ${height - 99},
              61 ${height - 105}
            C 72 ${height - 87},
              68 ${height - 70},
              52 ${height - 61}
          "
          stroke-width="1.25"
        />

        <path
          d="M 51 ${height - 63} C 55 ${height - 79}, 58 ${height - 91}, 61 ${height - 103}"
          stroke-width="0.85"
        />

        <!-- Leaf 2 -->
        <path
          d="
            M 77 ${height - 93}
            C 61 ${height - 106},
              59 ${height - 123},
              71 ${height - 135}
            C 91 ${height - 126},
              94 ${height - 109},
              77 ${height - 93}
          "
          stroke-width="1.25"
        />

        <path
          d="M 77 ${height - 96} C 75 ${height - 111}, 73 ${height - 123}, 71 ${height - 133}"
          stroke-width="0.85"
        />

        <!-- Leaf 3 -->
        <path
          d="
            M 104 ${height - 125}
            C 92 ${height - 143},
              96 ${height - 160},
              112 ${height - 168}
            C 126 ${height - 153},
              123 ${height - 137},
              104 ${height - 125}
          "
          stroke-width="1.25"
        />

        <path
          d="M 105 ${height - 127} C 108 ${height - 143}, 110 ${height - 155}, 111 ${height - 166}"
          stroke-width="0.85"
        />

        <!-- Leaf 4 -->
        <path
          d="
            M 133 ${height - 149}
            C 132 ${height - 169},
              143 ${height - 184},
              161 ${height - 186}
            C 164 ${height - 167},
              153 ${height - 153},
              133 ${height - 149}
          "
          stroke-width="1.25"
        />

        <path
          d="M 135 ${height - 151} C 145 ${height - 164}, 153 ${height - 176}, 160 ${height - 184}"
          stroke-width="0.85"
        />

        <!-- Leaf 5 -->
        <path
          d="
            M 154 ${height - 171}
            C 149 ${height - 191},
              159 ${height - 207},
              177 ${height - 212}
            C 183 ${height - 192},
              173 ${height - 177},
              154 ${height - 171}
          "
          stroke-width="1.2"
        />

        <path
          d="M 156 ${height - 173} C 165 ${height - 188}, 172 ${height - 200}, 176 ${height - 210}"
          stroke-width="0.8"
        />

        <!-- Small upper leaves -->
        <path
          d="
            M 182 54
            C 171 40,
              174 27,
              188 19
            C 199 33,
              197 46,
              182 54
          "
          stroke-width="1.15"
        />

        <path
          d="M 184 52 C 185 40, 187 29, 188 21"
          stroke-width="0.75"
        />

        <path
          d="
            M 199 38
            C 198 22,
              207 12,
              221 10
            C 225 25,
              216 37,
              199 38
          "
          stroke-width="1.1"
        />

        <path
          d="M 201 36 C 208 25, 214 17, 220 12"
          stroke-width="0.75"
        />

      </g>
    </svg>
  `;
}

/**
 * Delicate rose outline.
 *
 * No fill. Designed to resemble fine stationery engraving.
 */
export function lineRose(color, size = 100, opacity = 0.78) {
  const c = esc(color);

  return `
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style="overflow:visible;display:block;"
    >
      <g
        fill="none"
        stroke="${c}"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="${opacity}"
      >

        <!-- Outer rose -->
        <path
          d="
            M 50 86
            C 39 82, 25 78, 19 67
            C 13 55, 18 43, 29 37
            C 19 31, 24 18, 37 16
            C 43 5, 57 8, 62 17
            C 75 15, 83 24, 78 35
            C 90 42, 87 56, 77 61
            C 79 75, 67 83, 57 81
          "
          stroke-width="1.35"
        />

        <!-- Petal structure -->
        <path
          d="
            M 29 37
            C 39 41, 47 49, 49 59
            C 51 68, 46 77, 40 81
          "
          stroke-width="1.05"
        />

        <path
          d="
            M 37 16
            C 40 29, 48 36, 58 40
            C 68 44, 73 52, 71 61
          "
          stroke-width="1.05"
        />

        <path
          d="
            M 62 17
            C 56 27, 57 36, 64 43
            C 72 51, 70 60, 64 68
          "
          stroke-width="1.05"
        />

        <path
          d="
            M 78 35
            C 68 34, 59 39, 55 48
            C 51 56, 53 66, 60 73
          "
          stroke-width="1.05"
        />

        <!-- Center -->
        <path
          d="
            M 43 47
            C 43 40, 49 36, 55 39
            C 61 42, 61 49, 56 53
            C 52 57, 47 55, 46 51
            C 44 48, 47 44, 51 44
          "
          stroke-width="1.2"
        />

        <!-- Stem -->
        <path
          d="M 49 77 C 48 84, 47 91, 43 97"
          stroke-width="1.2"
        />

        <!-- Leaf -->
        <path
          d="
            M 47 84
            C 35 80, 27 84, 25 93
            C 34 96, 42 92, 47 84
          "
          stroke-width="1.15"
        />

        <path
          d="M 28 92 C 35 89, 40 87, 46 85"
          stroke-width="0.8"
        />

      </g>
    </svg>
  `;
}

/**
 * Two tiny hand-drawn branches facing each other.
 */
export function delicateDivider(color, width = 300) {
  const c = esc(color);

  return `
    <svg
      width="${width}"
      height="55"
      viewBox="0 0 300 55"
      xmlns="http://www.w3.org/2000/svg"
      style="display:block;overflow:visible;"
    >
      <g
        fill="none"
        stroke="${c}"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.72"
      >

        <path
          d="M 15 39 C 48 39, 69 35, 104 25 C 119 21, 128 18, 139 12"
          stroke-width="1.1"
        />

        <path
          d="M 285 39 C 252 39, 231 35, 196 25 C 181 21, 172 18, 161 12"
          stroke-width="1.1"
        />

        <!-- left leaves -->
        <path
          d="M 52 34 C 45 23, 49 17, 60 16 C 64 26, 59 32, 52 34"
          stroke-width="0.95"
        />

        <path
          d="M 82 29 C 76 18, 80 12, 91 12 C 95 22, 90 28, 82 29"
          stroke-width="0.95"
        />

        <path
          d="M 109 22 C 106 12, 111 7, 121 8 C 123 17, 118 21, 109 22"
          stroke-width="0.9"
        />

        <!-- right leaves -->
        <path
          d="M 248 34 C 255 23, 251 17, 240 16 C 236 26, 241 32, 248 34"
          stroke-width="0.95"
        />

        <path
          d="M 218 29 C 224 18, 220 12, 209 12 C 205 22, 210 28, 218 29"
          stroke-width="0.95"
        />

        <path
          d="M 191 22 C 194 12, 189 7, 179 8 C 177 17, 182 21, 191 22"
          stroke-width="0.9"
        />

        <!-- tiny centre diamond -->
        <path
          d="M 150 8 L 153 12 L 150 16 L 147 12 Z"
          stroke-width="0.9"
        />

      </g>
    </svg>
  `;
}

/**
 * Elegant single-line ornamental corners.
 *
 * These are deliberately asymmetric and mostly off-canvas.
 */
export function ornamentalCorner(color, {
  width = 280,
  height = 280,
  mirrorX = false,
  mirrorY = false,
  opacity = 0.7,
} = {}) {
  const sx = mirrorX ? -1 : 1;
  const sy = mirrorY ? -1 : 1;

  const tx = mirrorX ? width : 0;
  const ty = mirrorY ? height : 0;

  return `
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg"
      style="display:block;overflow:visible;"
    >
      <g
        transform="translate(${tx} ${ty}) scale(${sx} ${sy})"
        fill="none"
        stroke="${esc(color)}"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="${opacity}"
      >

        <!-- Main sweeping stem -->
        <path
          d="
            M -15 250
            C 23 214,
              44 171,
              60 125
            C 72 90,
              92 58,
              130 35
            C 160 16,
              188 10,
              224 12
          "
          stroke-width="1.45"
        />

        <!-- Inner curl -->
        <path
          d="
            M 49 157
            C 65 139,
              81 126,
              103 119
            C 119 114,
              132 119,
              134 130
            C 136 140,
              126 147,
              118 143
            C 111 140,
              112 132,
              118 130
          "
          stroke-width="1.05"
        />

        <!-- Long leaves -->
        <path
          d="
            M 57 127
            C 36 112,
              31 94,
              42 77
            C 61 84,
              69 104,
              57 127
          "
          stroke-width="1.05"
        />

        <path
          d="M 58 124 C 51 105, 47 92, 43 80"
          stroke-width="0.72"
        />

        <path
          d="
            M 82 86
            C 65 71,
              65 53,
              77 41
            C 95 48,
              101 68,
              82 86
          "
          stroke-width="1.05"
        />

        <path
          d="M 83 83 C 80 67, 78 53, 78 43"
          stroke-width="0.72"
        />

        <path
          d="
            M 117 51
            C 108 32,
              116 19,
              132 13
            C 145 29,
              137 43,
              117 51
          "
          stroke-width="1.0"
        />

        <path
          d="M 119 48 C 124 34, 128 23, 131 15"
          stroke-width="0.7"
        />

        <!-- Tiny flower -->
        <circle cx="225" cy="12" r="3.5" stroke-width="0.85" />
        <path d="M 225 5 C 222 0, 225 -4, 229 -2 C 231 2, 228 6, 225 5" stroke-width="0.8" />
        <path d="M 232 12 C 237 9, 240 12, 238 16 C 234 18, 231 15, 232 12" stroke-width="0.8" />
        <path d="M 225 19 C 222 24, 225 27, 229 25 C 231 21, 228 18, 225 19" stroke-width="0.8" />

      </g>
    </svg>
  `;
}

/**
 * Small ring illustration.
 */
export function weddingRings(color, size = 60) {
  const c = esc(color);

  return `
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg"
      style="display:block;overflow:visible;"
    >
      <g
        fill="none"
        stroke="${c}"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="24" cy="33" r="14" stroke-width="1.4" />
        <circle cx="36" cy="27" r="14" stroke-width="1.4" />

        <path
          d="M 30 12 L 31.8 16 L 36 17.5 L 31.8 19 L 30 23 L 28.2 19 L 24 17.5 L 28.2 16 Z"
          stroke-width="0.9"
        />
      </g>
    </svg>
  `;
}

/**
 * Keeps compatibility with the old API.
 *
 * Instead of filled flowers, return a tiny line-art flower.
 */
export function petalFlower({
  cx = 20,
  cy = 20,
  r = 10,
  petals = 6,
  color = "#8d7350",
} = {}) {
  const c = esc(color);

  const paths = [];

  for (let i = 0; i < petals; i++) {
    const angle = (360 / petals) * i;
    paths.push(`
      <ellipse
        cx="${cx}"
        cy="${cy - r * 0.55}"
        rx="${r * 0.28}"
        ry="${r * 0.55}"
        transform="rotate(${angle} ${cx} ${cy})"
      />
    `);
  }

  return `
    <g
      fill="none"
      stroke="${c}"
      stroke-width="0.85"
      opacity="0.78"
    >
      ${paths.join("")}
      <circle cx="${cx}" cy="${cy}" r="${r * 0.18}" />
    </g>
  `;
}

/**
 * Compatibility wrapper for the previous laurel API.
 *
 * Now rendered as fine botanical outlines instead of filled leaves.
 */
export function laurelWreath(
  color,
  size = 220,
  leafCount = 26,
  gapDeg = 46,
) {
  const c = esc(color);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  let leaves = "";

  const start = 90 + gapDeg / 2;
  const sweep = 360 - gapDeg;

  for (let i = 0; i < leafCount; i++) {
    const t = i / Math.max(leafCount - 1, 1);
    const angleDeg = start + sweep * t;
    const rad = (angleDeg * Math.PI) / 180;

    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);

    leaves += `
      <path
        d="
          M ${x} ${y}
          C ${x - 8} ${y - 10},
            ${x - 7} ${y - 19},
            ${x} ${y - 24}
          C ${x + 7} ${y - 19},
            ${x + 8} ${y - 10},
            ${x} ${y}
        "
        fill="none"
        stroke="${c}"
        stroke-width="0.9"
        transform="rotate(${angleDeg + 90} ${x} ${y})"
      />
    `;
  }

  return `
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      xmlns="http://www.w3.org/2000/svg"
      style="overflow:visible;display:block;"
    >
      ${leaves}
    </svg>
  `;
}

/**
 * Compatibility wrapper for old cornerSprig calls.
 *
 * It now uses line art instead of filled petals/leaves.
 */
export function cornerSprig(
  {
    stem = "#8d7350",
    leaf: leafColor = stem,
    blooms = [],
  } = {},
  size = 150,
) {
  const color = stem || leafColor;

  return botanicalBranch(color, {
    width: size,
    height: size,
    opacity: 0.72,
  });
}

/**
 * Compatibility wrapper.
 */
export function floralDivider(
  {
    stem = "#8d7350",
  } = {},
  width = 220,
) {
  return delicateDivider(stem, width);
}

/**
 * Compatibility wrapper.
 */
export function scrollFlourish(color, width = 90) {
  const c = esc(color);
  const mid = width / 2;

  return `
    <svg
      width="${width}"
      height="32"
      viewBox="0 0 ${width} 32"
      xmlns="http://www.w3.org/2000/svg"
      style="display:block;overflow:visible;"
    >
      <g
        fill="none"
        stroke="${c}"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.7"
      >
        <path
          d="
            M ${mid - 3} 16
            C ${mid - 3} 5,
              ${mid - 13} 2,
              ${mid - 20} 7
            C ${mid - 27} 12,
              ${mid - 23} 23,
              ${mid - 15} 22
            C ${mid - 9} 21,
              ${mid - 9} 14,
              ${mid - 14} 14
          "
          stroke-width="1.2"
        />

        <path
          d="
            M ${mid + 3} 16
            C ${mid + 3} 5,
              ${mid + 13} 2,
              ${mid + 20} 7
            C ${mid + 27} 12,
              ${mid + 23} 23,
              ${mid + 15} 22
            C ${mid + 9} 21,
              ${mid + 9} 14,
              ${mid + 14} 14
          "
          stroke-width="1.2"
        />

        <circle cx="${mid}" cy="16" r="2.1" stroke-width="0.9" />
      </g>
    </svg>
  `;
}