import { type PageAccessItem } from '../types';

/**
 * Recursively searches for a page by name in the page access tree
 * and checks if it has full access.
 */
export const isPageAccessible = (
  accessData: PageAccessItem[] | undefined,
  pageName: string
): boolean => {
  if (!accessData || !pageName) return false;

  for (const item of accessData) {
    if (item.pageName === pageName) {
      return item.fullAccess === true;
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
 * Builds a flat map of page names to their fullAccess status for quicker lookups.
 */
export const buildAccessMap = (
  accessData: PageAccessItem[] | undefined
): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  if (!accessData) return map;

  const walk = (items: PageAccessItem[]) => {
    items.forEach((item) => {
      map[item.pageName] = item.fullAccess === true;
      if (item.children && item.children.length > 0) {
        walk(item.children);
      }
    });
  };

  walk(accessData);
  return map;
};
