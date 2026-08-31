import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { ensureGuestSignIn } from "@/services/authService";

const COLLECTION = "rsvps";

/** RSVP doc id === guest doc id, so a guest can only ever write their own. */
export async function getRsvpForGuest(guestId) {
  await ensureGuestSignIn();
  const snap = await getDoc(doc(db(), COLLECTION, guestId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function submitRsvp(guest, form) {
  await ensureGuestSignIn();
  const seats = Math.max(1, Number(guest.numberOfSeats) || 1);
  const attending = Boolean(form.attending);
  const numberAttending = attending ? Math.min(seats, Math.max(1, Number(form.numberAttending) || 1)) : 0;

  const payload = {
    guestId: guest.id,
    guestName: `${guest.firstName} ${guest.surname}`.trim(),
    invitationSeats: seats,
    attending,
    numberAttending,
    guestNames: (form.guestNames || []).map((n) => String(n).trim()).filter(Boolean),
    dietaryRequirements: (form.dietaryRequirements || "").trim(),
    specialRequirements: (form.specialRequirements || "").trim(),
    message: (form.message || "").trim(),
    updatedAt: serverTimestamp(),
  };

  const ref = doc(db(), COLLECTION, guest.id);
  const existing = await getDoc(ref);
  await setDoc(
    ref,
    existing.exists() ? payload : { ...payload, submittedAt: serverTimestamp() },
    { merge: true },
  );

  await updateDoc(doc(db(), "invitedGuests", guest.id), {
    rsvpStatus: attending ? "attending" : "declined",
    rsvpResponse: attending,
    dietaryRequirements: payload.dietaryRequirements,
    specialRequirements: payload.specialRequirements,
    updatedAt: serverTimestamp(),
  });

  return payload;
}

export function subscribeToRsvps(onData, onError) {
  return onSnapshot(
    query(collection(db(), COLLECTION)),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export async function listRsvps() {
  const snap = await getDocs(query(collection(db(), COLLECTION)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
