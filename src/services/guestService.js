import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { ensureGuestSignIn } from "@/services/authService";
import { makeInvitationCode, normalise, titleCase } from "@/utils/format";

const COLLECTION = "invitedGuests";

function guestPayload(input) {
  const firstName = titleCase(input.firstName);
  const surname = titleCase(input.surname);
  return {
    firstName,
    surname,
    firstNameLower: normalise(firstName),
    surnameLower: normalise(surname),
    email: (input.email || "").trim(),
    phone: (input.phone || "").trim(),
    invitationCode: input.invitationCode || makeInvitationCode(),
    invitationType: input.invitationType || "individual",
    plusOneAllowed: Boolean(input.plusOneAllowed),
    plusOneName: (input.plusOneName || "").trim(),
    numberOfSeats: Math.max(1, Number(input.numberOfSeats) || 1),
    tableNumber: (input.tableNumber || "").toString().trim(),
    notes: (input.notes || "").trim(),
  };
}

export async function createGuest(input) {
  const ref = await addDoc(collection(db(), COLLECTION), {
    ...guestPayload(input),
    rsvpStatus: "pending",
    rsvpResponse: null,
    dietaryRequirements: "",
    specialRequirements: "",
    checkedInAt: null,
    checkedInBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGuest(id, input) {
  await updateDoc(doc(db(), COLLECTION, id), {
    ...guestPayload(input),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGuest(id) {
  await deleteDoc(doc(db(), COLLECTION, id));
}

/** Find and mark a single guest when an administrator scans their entry QR. */
export async function checkInGuest(id) {
  const ref = doc(db(), COLLECTION, String(id || "").trim());
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const guest = { id: snap.id, ...snap.data() };
  if (guest.checkedInAt) {
    return { guest, alreadyCheckedIn: true };
  }

  await updateDoc(ref, {
    checkedInAt: serverTimestamp(),
    checkedInBy: auth().currentUser?.uid || "",
    updatedAt: serverTimestamp(),
  });
  const updated = await getDoc(ref);
  return {
    guest: updated.exists() ? { id: updated.id, ...updated.data() } : guest,
    alreadyCheckedIn: false,
  };
}

export function subscribeToGuests(onData, onError) {
  const q = query(collection(db(), COLLECTION), orderBy("surnameLower"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export async function listGuests() {
  const snap = await getDocs(query(collection(db(), COLLECTION), orderBy("surnameLower")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Minimal, safe projection returned to a verified guest. */
function publicGuest(id, data) {
  return {
    id,
    firstName: data.firstName,
    surname: data.surname,
    invitationType: data.invitationType,
    numberOfSeats: data.numberOfSeats ?? 1,
    tableNumber: data.tableNumber || "",
    plusOneAllowed: Boolean(data.plusOneAllowed),
    plusOneName: data.plusOneName || "",
    rsvpStatus: data.rsvpStatus || "pending",
    checkedIn: Boolean(data.checkedInAt),
  };
}

/**
 * Verify an invitation by name + surname (optionally an invitation code).
 * Signs the visitor in anonymously first so security rules can restrict the
 * lookup to a single-result query — the guest list is never downloaded.
 */
export async function verifyGuest({ firstName, surname, invitationCode }) {
  await ensureGuestSignIn();
  const constraints = [
    where("firstNameLower", "==", normalise(firstName)),
    where("surnameLower", "==", normalise(surname)),
  ];
  if (invitationCode && invitationCode.trim()) {
    constraints.push(where("invitationCode", "==", invitationCode.trim().toUpperCase()));
  }
  const snap = await getDocs(query(collection(db(), COLLECTION), ...constraints, limit(1)));
  const first = snap.docs[0];
  if (!first) return null;
  return publicGuest(first.id, first.data());
}

/** Re-validate a session guest id against Firestore on every protected page. */
export async function fetchVerifiedGuest(id) {
  await ensureGuestSignIn();
  const snap = await getDoc(doc(db(), COLLECTION, id));
  if (!snap.exists()) return null;
  return publicGuest(snap.id, snap.data());
}