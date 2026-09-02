import {
  browserLocalPersistence,
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
  try {
    await setPersistence(a, browserSessionPersistence);
  } catch {
    /* keep the existing persistence */
  }
  const cred = await signInAnonymously(a);
  return cred.user;
}

export async function adminSignIn(email, password) {
  const a = auth();
  // Admins stay signed in across refreshes/tabs until they click Logout.
  await setPersistence(a, browserLocalPersistence);
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

export function watchAuth(callback) {
  return onAuthStateChanged(auth(), callback);
}
