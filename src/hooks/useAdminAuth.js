import { useEffect, useState } from "react";
import { getStaffRole, watchAuth } from "@/services/authService";

/**
 * role: "admin" (full access) | "scan-admin" (view guests + approve only) | null.
 * isAdmin stays true ONLY for full admins, so existing admin pages are unchanged.
 */
export function useAdminAuth() {
  const [state, setState] = useState({
    loading: true,
    user: null,
    role: null,
    isAdmin: false,
    isScanAdmin: false,
  });

  useEffect(() => {
    let active = true;
    const unsub = watchAuth(async (user) => {
      if (!user || user.isAnonymous) {
        if (active) setState({ loading: false, user: null, role: null, isAdmin: false, isScanAdmin: false });
        return;
      }
      const role = await getStaffRole(user);
      if (active) {
        setState({ loading: false, user, role, isAdmin: role === "admin", isScanAdmin: role === "scan-admin" });
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  return state;
}
