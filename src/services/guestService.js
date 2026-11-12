import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
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
    approved: false,
    approvedAt: null,
    approvedBy: null,
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

/** True when a guest has been approved at the entrance (older records used checkedInAt). */
export function isGuestApproved(guest) {
  return Boolean(guest?.approved || guest?.checkedInAt);
}

/**
 * Approve one guest at the entrance — from a QR scan (via "qr") or the
 * Approve button in the guest list (via "manual").
 *
 * Only these fields are written, and only ever false -> true, which is exactly
 * what the "scan-admin" Firestore rules allow. Nothing else on the guest can
 * be changed from here.
 *
 * Resolves to null when no such guest exists, otherwise
 * { guest, alreadyApproved }.
 */
export async function approveGuest(id, via = "manual") {
  const guestId = String(id || "").trim();
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(guestId)) return null;
  const ref = doc(db(), COLLECTION, guestId);
  const uid = auth().currentUser?.uid || "";

  return runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;

    const current = { id: snap.id, ...snap.data() };
    if (isGuestApproved(current)) {
      return { guest: current, alreadyApproved: true };
    }

    tx.update(ref, {
      approved: true,
      approvedAt: serverTimestamp(),
      approvedBy: uid,
      approvedVia: via,
      checkedInAt: serverTimestamp(),
      checkedInBy: uid,
      updatedAt: serverTimestamp(),
    });
    return {
      guest: { ...current, approved: true, approvedAt: new Date(), approvedBy: uid, approvedVia: via },
      alreadyApproved: false,
    };
  });
}

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

/**
 * A–Z by the name as it is displayed ("First Surname"): first name, then
 * surname. Used for every guest list in the app.
 */
export function compareGuestsByName(a, b) {
  return (
    collator.compare(String(a?.firstName ?? "").trim(), String(b?.firstName ?? "").trim()) ||
    collator.compare(String(a?.surname ?? "").trim(), String(b?.surname ?? "").trim())
  );
}

export function sortGuestsAlphabetically(list) {
  return [...list].sort(compareGuestsByName);
}

// Sorted in the browser rather than with orderBy("surnameLower"), so guests
// missing that field are no longer silently left out of the list.
export function subscribeToGuests(onData, onError) {
  return onSnapshot(
    collection(db(), COLLECTION),
    (snap) => onData(sortGuestsAlphabetically(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError,
  );
}

export async function listGuests() {
  const snap = await getDocs(collection(db(), COLLECTION));
  return sortGuestsAlphabetically(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
    checkedIn: isGuestApproved(data),
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