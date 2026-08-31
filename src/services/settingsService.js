import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { ensureGuestSignIn } from "@/services/authService";

const DOC_PATH = ["weddingSettings", "main"];

export const defaultSettings = {
  brideName: "",
  groomName: "",
  weddingDate: "",
  ceremonyTime: "",
  receptionTime: "",
  venueName: "",
  venueAddress: "",
  dressCode: "",
  weddingMessage: "",
  invitationImageUrl: "",
  invitationPdfUrl: "",
  programPdfUrl: "",
  backgroundImageUrl: "",
  musicUrl: "",
  rsvpDeadline: "",
  rsvpEnabled: true,
  programPublished: false,
  programItems: [],
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
