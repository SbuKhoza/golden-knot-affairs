/**
 * Entry QR payloads.
 *
 * The QR deliberately does NOT contain a web link. A normal phone camera or
 * generic QR app will just show a short piece of text ("GKA1:<id>") and has
 * nothing to open. Only the check-in scanner inside the admin area knows what
 * to do with it, and even there the guest record can only be read by a signed-in
 * "scan-admin" (or admin) account — enforced by Firestore security rules.
 */
export const QR_PREFIX = "GKA1:";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,150}$/;

/** Build the payload encoded in a guest's personal entry QR. */
export function guestQrPayload(guestId) {
  return `${QR_PREFIX}${String(guestId)}`;
}

/**
 * Read a guest ID from scan data. Accepts the current payload, the old
 * link-style QR (so already-saved codes still work at the door) and a raw ID
 * typed or pasted in by hand. Returns "" when the data isn't a guest QR.
 */
export function guestIdFromQr(value) {
  const scanned = String(value ?? "").trim();
  if (!scanned) return "";

  if (scanned.startsWith(QR_PREFIX)) {
    const id = scanned.slice(QR_PREFIX.length);
    return ID_PATTERN.test(id) ? id : "";
  }

  try {
    const url = new URL(scanned, "https://invitation.invalid");
    const invite = url.searchParams.get("invite");
    if (invite) return ID_PATTERN.test(invite) ? invite : "";
  } catch {
    // Not a URL — fall through to raw ID.
  }

  return ID_PATTERN.test(scanned) ? scanned : "";
}
