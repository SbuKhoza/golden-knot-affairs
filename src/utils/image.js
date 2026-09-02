// Resizes an image file client-side and returns a compressed base64 data URL.
// Used so we always have a CORS-free copy of the image available for PDF embedding,
// regardless of whether the storage bucket serving the uploaded file allows
// cross-origin fetches.
export function fileToCompressedDataUrl(file, maxSize = 900, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Crops an already-loaded <img> (or a data URL string) to a circle and
// returns a transparent PNG data URL, for embedding in the PDF.
export function circularCropDataUrl(img, sizePx = 640) {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.beginPath();
  ctx.arc(sizePx / 2, sizePx / 2, sizePx / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const scale = Math.max(sizePx / img.naturalWidth, sizePx / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (sizePx - dw) / 2, (sizePx - dh) / 2, dw, dh);
  ctx.restore();
  return canvas.toDataURL("image/png");
}

// Crops to a rounded square, same idea, for smaller inline images.
export function roundedSquareCropDataUrl(img, sizePx = 400, radiusPx = 36) {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.beginPath();
  const r = radiusPx;
  ctx.moveTo(r, 0);
  ctx.arcTo(sizePx, 0, sizePx, sizePx, r);
  ctx.arcTo(sizePx, sizePx, 0, sizePx, r);
  ctx.arcTo(0, sizePx, 0, 0, r);
  ctx.arcTo(0, 0, sizePx, 0, r);
  ctx.closePath();
  ctx.clip();
  const scale = Math.max(sizePx / img.naturalWidth, sizePx / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (sizePx - dw) / 2, (sizePx - dh) / 2, dw, dh);
  ctx.restore();
  return canvas.toDataURL("image/png");
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Loads from a data URL (no CORS involved) or a remote URL (best-effort CORS),
// then crops. Returns null on any failure instead of throwing.
export async function loadCroppedImage(src, crop = "circle") {
  if (!src) return null;
  try {
    const img = await loadImageElement(src);
    return crop === "circle" ? circularCropDataUrl(img) : roundedSquareCropDataUrl(img);
  } catch (err) {
    console.warn("Could not embed image in PDF (likely a CORS-blocked remote fetch):", src, err);
    return null;
  }
}