import { useSyncExternalStore, useRef, useCallback } from "react";
import { subscribe, getVersion } from "./dataStore";

/**
 * Subscribe a component to the central data store.
 *
 * The selector is re-run only when the store version changes (i.e. after a
 * mutation). Between mutations the cached snapshot is returned so that
 * useSyncExternalStore sees a stable reference and doesn't trigger
 * "getSnapshot should be cached" infinite render loops.
 */
export function useStoreSelector<T>(selector: () => T): T {
  const cache = useRef<{ version: number; value: T } | null>(null);

  const getSnapshot = useCallback(() => {
    const version = getVersion();
    if (cache.current && cache.current.version === version) {
      return cache.current.value;
    }
    const value = selector();
    cache.current = { version, value };
    return value;
    // selector is intentionally captured per-render via closure; cache
    // is keyed on store version so stale closures still produce fresh values
    // after any mutation.
  }, [selector]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
