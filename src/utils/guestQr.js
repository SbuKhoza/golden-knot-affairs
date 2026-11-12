/** Build the personal guest entry URL encoded in their QR code. */
export function guestQrUrl(guestId, origin) {
  const baseOrigin =
    origin || (typeof window === "undefined" ? "https://invitation.invalid" : window.location.origin);
  const url = new URL("/", baseOrigin);
  url.searchParams.set("invite", String(guestId));
  return url.toString();
}

/** Read a guest ID from either the app URL printed in the QR or a raw ID. */
export function guestIdFromQr(value) {
  const scanned = String(value ?? "").trim();
  if (!scanned) return "";

  try {
    const url = new URL(scanned, "https://invitation.invalid");
    const invite = url.searchParams.get("invite");
    if (invite) return invite;
  } catch {
    // A raw guest ID is valid scan data too.
  }

  return scanned;
}