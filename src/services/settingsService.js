import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { ensureGuestSignIn } from "@/services/authService";
import { DEFAULT_COLOR_SCHEME_ID, DEFAULT_TEMPLATE_ID } from "@/utils/pdfThemes";

const DOC_PATH = ["weddingSettings", "main"];

export const defaultSettings = {
  brideName: "",
  groomName: "",
  weddingDate: "",
  ceremonyTime: "",
  receptionTime: "",
  venueName: "",
  venueAddress: "",
  // Optional map pin for the ceremony venue. When both are present, the
  // address becomes clickable and opens the device's maps app; otherwise
  // it's shown as plain, non-interactive text.
  venueLat: "",
  venueLng: "",
  // Reception is treated as its own venue, since it's very often a
  // different address from the ceremony (or the couple wants it called
  // out separately even when it's the same place).
  receptionVenueName: "",
  receptionVenueAddress: "",
  receptionVenueLat: "",
  receptionVenueLng: "",
  dressCode: "",
  weddingMessage: "",
  invitationImageUrl: "",
  invitationImageData: "",
  dressCodeImageUrl: "",
  dressCodeImageData: "",
  invitationPdfUrl: "",
  programPdfUrl: "",
  backgroundImageUrl: "",
  backgroundImageData: "",
  musicUrl: "",
  rsvpDeadline: "",
  rsvpEnabled: true,
  programPublished: false,
  programItems: [],
  // Admin-selectable look for the generated (non-uploaded) invitation PDF.
  pdfTemplate: DEFAULT_TEMPLATE_ID,
  pdfColorScheme: DEFAULT_COLOR_SCHEME_ID,
};

export async function getSettings({ asGuest = false } = {}) {
  if (asGuest) await ensureGuestSignIn();
  const snap = await getDoc(doc(db(), ...DOC_PATH));
  return { ...defaultSettings, ...(snap.exists() ? snap.data() : {}) };
}

export function subscribeToSettings(onData, onError) {
  return onSnapshot(
    doc(db(), ...DOC_PATH),
    (snap) => onData({ ...defaultSettings, ...(snap.exists() ? snap.data() : {}) }),
    onError,
  );
}

export async function saveSettings(values) {
  await setDoc(
    doc(db(), ...DOC_PATH),
    { ...values, updatedAt: serverTimestamp() },
    { merge: true },
  );
}