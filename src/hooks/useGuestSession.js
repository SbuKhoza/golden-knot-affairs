import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { fetchVerifiedGuest } from "@/services/guestService";

const KEY = "wedding.guestId";

export function saveGuestSession(guestId) {
  try {
    window.sessionStorage.setItem(KEY, guestId);
  } catch {
    /* ignore */
  }
}

export function clearGuestSession() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function readGuestSession() {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * Loads the verified guest for the current session and re-validates it against
 * Firestore. The guest id lives in sessionStorage only — it disappears when the
 * browser session ends, and it can't be swapped in the URL.
 */
export function useGuestSession({ redirect = true } = {}) {
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const id = readGuestSession();
    if (!id) {
      setGuest(null);
      setLoading(false);
      if (redirect) navigate({ to: "/" });
      return;
    }
    try {
      const found = await fetchVerifiedGuest(id);
      if (!found) {
        clearGuestSession();
        if (redirect) navigate({ to: "/" });
      }
      setGuest(found);
    } catch {
      setGuest(null);
      if (redirect) navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  }, [navigate, redirect]);

  useEffect(() => {
    load();
  }, [load]);

  return { guest, loading, reload: load, signOut: () => { clearGuestSession(); navigate({ to: "/" }); } };
}
