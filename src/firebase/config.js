import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyBUrjWPr-hOhpuhjB5eOoMivRPjKa9U",
  authDomain: "malloya--app.firebaseapp.com",
  projectId: "malloya--app",
  storageBucket: "malloya--app.firebasestorage.app",
  messagingSenderId: "574142082152",
  appId: "1:574142082152:web:cdb23bd4ddc8ef3c2c1fdd",
};

/**
 * Firebase is only initialised in the browser. All data access happens from
 * client components (effects / event handlers), never during SSR.
 */
export function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase is only available in the browser");
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function auth() {
  return getAuth(getFirebaseApp());
}

export function db() {
  return getFirestore(getFirebaseApp());
}

export function storage() {
  return getStorage(getFirebaseApp());
}
