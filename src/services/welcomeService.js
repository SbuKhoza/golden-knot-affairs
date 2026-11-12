import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase/config";
import { welcomeStore } from "@/stores/welcomeStore";

const CHANNEL = "golden-knot-welcome";

/** Only the bits the big screen needs — nothing private. */
function toArrival(id, data) {
  return {
    key: String(id),
    firstName: String(data?.firstName ?? "").slice(0, 80),
    surname: String(data?.surname ?? "").slice(0, 80),
    numberOfSeats: Number(data?.numberOfSeats) || 1,
    tableNumber: String(data?.tableNumber ?? "").slice(0, 20),
  };
}

/**
 * Called by the scanner right after a guest is approved. Reaches a welcome
 * screen open in another window on the same computer immediately; screens on
 * other devices get the same guest from Firestore (startWelcomeFeed).
 */
export function announceWelcome(guest) {
  if (!guest?.id || typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(toArrival(guest.id, guest));
    channel.close();
  } catch {
    /* Firestore will still deliver it */
  }
}

/**
 * Start listening for newly approved guests and push them into the store.
 * Guests already approved when the screen opens are NOT replayed.
 * Returns a function that stops listening.
 */
export function startWelcomeFeed(onError) {
  let firstSnapshot = true;

  const latest = query(collection(db(), "invitedGuests"), orderBy("approvedAt", "desc"), limit(10));
  const stopFirestore = onSnapshot(
    latest,
    (snap) => {
      snap.docChanges().forEach((change) => {
        const data = change.doc.data();
        // An admin reverted this approval: allow a later re-approval to be welcomed again.
        if (!data.approved && (change.type === "modified" || change.type === "removed")) {
          welcomeStore.forget(change.doc.id);
          return;
        }
        if (change.type === "removed") return;
        // approvedAt is briefly null while the server timestamp is still being written.
        if (!data.approved || !data.approvedAt) return;
        if (firstSnapshot) welcomeStore.markSeen(change.doc.id);
        else welcomeStore.enqueue(toArrival(change.doc.id, data));
      });
      firstSnapshot = false;
    },
    onError,
  );

  let channel = null;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => {
      const data = event.data;
      if (data && typeof data.key === "string") welcomeStore.enqueue(toArrival(data.key, data));
    };
  }

  return () => {
    stopFirestore();
    channel?.close();
  };
}
