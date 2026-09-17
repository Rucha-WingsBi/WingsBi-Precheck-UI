import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { usePageAccess } from "./useMasterData";
import { isPageAccessible } from "../utils/accessUtils";

/**
 * Standard custom hook to check if the current logged-in user has access
 * to one or more pages/features.
 *
 * Standard Pattern:
 * 1. Retrieve user.roleid from Redux auth state (state.auth.user).
 * 2. Fetch page permissions for user's role ID via usePageAccess.
 * 3. Evaluate access status using isPageAccessible.
 *
 * @param pageName - Single page name string or array of page names/fallbacks
 * @returns boolean indicating whether access is granted
 */
export function useHasPermission(pageName: string): boolean {
  // 1. Get current logged-in user from Redux
  const user = useSelector((state: RootState) => state.auth.user);

  // 2. Fetch page permissions for the user's role ID
  const { data: pageAccessData, isLoading: isAccessLoading } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null
  );

  // 3. Evaluate access status for the specific page
  return useMemo(() => {
    if (!user?.roleid) return true; // Default while no role ID
    if (isAccessLoading || pageAccessData === undefined) return true; // While loading

    return isPageAccessible(pageAccessData, pageName);
  }, [user, pageAccessData, isAccessLoading, pageName]);
}
