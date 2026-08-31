export function normalise(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function titleCase(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[\s'-])([a-z])/g, (_m, p, c) => p + c.toUpperCase());
}

export function makeInvitationCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function friendlyError(error, fallback = "Something went wrong. Please try again.") {
  const code = error?.code || "";
  const map = {
    "permission-denied": "You don't have permission to do that.",
    unavailable: "We can't reach the server right now. Please check your connection.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "storage/unauthorized": "You don't have permission to upload that file.",
    "storage/canceled": "The upload was cancelled.",
  };
  return map[code] || fallback;
}

export function formatWeddingDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isPastDeadline(deadline) {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return false;
  d.setHours(23, 59, 59, 999);
  return Date.now() > d.getTime();
}
