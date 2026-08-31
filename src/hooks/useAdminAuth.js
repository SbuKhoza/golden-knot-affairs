import { useEffect, useState } from "react";
import { checkIsAdmin, watchAuth } from "@/services/authService";

export function useAdminAuth() {
  const [state, setState] = useState({ loading: true, user: null, isAdmin: false });

  useEffect(() => {
    let active = true;
    const unsub = watchAuth(async (user) => {
      if (!user || user.isAnonymous) {
        if (active) setState({ loading: false, user: null, isAdmin: false });
        return;
      }
      const isAdmin = await checkIsAdmin(user);
      if (active) setState({ loading: false, user, isAdmin });
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  return state;
}
