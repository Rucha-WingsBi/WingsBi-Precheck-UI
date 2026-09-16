import { type PageAccessItem } from '../types';

/**
 * Recursively searches for a page by name in the page access tree
 * and checks whether access is NOT explicitly denied.
 *
 * A page is considered accessible when the role entry exists and
 * `noAccess` is NOT true (i.e. the role has full or partial access).
 */
export const isPageAccessible = (
  accessData: PageAccessItem[] | undefined,
  pageName: string
): boolean => {
  if (!accessData || !pageName) return false;

  for (const item of accessData) {
    if (item.pageName && item.pageName.trim().toLowerCase() === pageName.trim().toLowerCase()) {
      // Accessible when NOT explicitly denied (noAccess !== true)
      return item.noAccess !== true;
    }
    if (item.children && item.children.length > 0) {
      if (isPageAccessible(item.children, pageName)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Builds a flat map of page names to their access status.
 * A page is accessible when noAccess is NOT explicitly true.
 */
export const buildAccessMap = (
  accessData: PageAccessItem[] | undefined
): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  if (!accessData) return map;

  const walk = (items: PageAccessItem[]) => {
    items.forEach((item) => {
      map[item.pageName] = item.noAccess !== true;
      if (item.children && item.children.length > 0) {
        walk(item.children);
      }
    });
  };

  walk(accessData);
  return map;
};
