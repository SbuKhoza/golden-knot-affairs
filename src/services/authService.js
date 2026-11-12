import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config";

/** Anonymous session used for guest invitation lookups. */
export async function ensureGuestSignIn() {
  const a = auth();
  if (a.currentUser) return a.currentUser;
  await setPersistence(a, browserSessionPersistence);
  const cred = await signInAnonymously(a);
  return cred.user;
}

export async function adminSignIn(email, password) {
  const a = auth();
  const cred = await signInWithEmailAndPassword(a, email.trim(), password);
  const isAdmin = await checkIsAdmin(cred.user);
  if (!isAdmin) {
    await signOut(a);
    const error = new Error("not-admin");
    error.code = "not-admin";
    throw error;
  }
  return cred.user;
}

/**
 * Sign in a staff member. Full admins ("admins" collection / admin claim) and
 * scan-admins ("scan-admin" collection) are both allowed; anyone else is
 * signed straight back out. Resolves to { user, role }.
 */
export async function staffSignIn(email, password) {
  const a = auth();
  const cred = await signInWithEmailAndPassword(a, email.trim(), password);
  const role = await getStaffRole(cred.user);
  if (!role) {
    await signOut(a);
    const error = new Error("not-admin");
    error.code = "not-admin";
    throw error;
  }
  return { user: cred.user, role };
}

export async function adminSignOut() {
  await signOut(auth());
}

/** Admin authorisation: custom claim first, then the "admins" collection. */
export async function checkIsAdmin(user) {
  if (!user || user.isAnonymous) return false;
  try {
    const token = await user.getIdTokenResult(true);
    if (token.claims.admin === true) return true;
  } catch {
    /* ignore */
  }
  try {
    const snap = await getDoc(doc(db(), "admins", user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Scan-admins are listed in the "scan-admin" collection (document ID = the
 * user's Firebase Auth UID). They can view guests and approve arrivals only.
 */
export async function checkIsScanAdmin(user) {
  if (!user || user.isAnonymous) return false;
  try {
    const snap = await getDoc(doc(db(), "scan-admin", user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

/** "admin" | "scan-admin" | null */
export async function getStaffRole(user) {
  if (await checkIsAdmin(user)) return "admin";
  if (await checkIsScanAdmin(user)) return "scan-admin";
  return null;
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth(), callback);
}
