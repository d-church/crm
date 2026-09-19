import { useSyncExternalStore } from 'react';

/**
 * A small piece of per-browser state kept in localStorage — saved filters, table
 * columns. Values are parsed through a validator on every read, so a leftover
 * entry in an older shape degrades to the fallback instead of breaking a page.
 */
export type LocalStore<T> = {
  /** Same reference until the stored string really changes, as `useSyncExternalStore` requires. */
  read: (key: string) => T;
  /** `false` when the browser refuses to store — private mode, or a full quota. */
  write: (key: string, value: T) => boolean;
  subscribe: (listener: () => void) => () => void;
  useValue: (key: string) => T;
};

export const createLocalStore = <T>(parse: (raw: unknown) => T, fallback: T): LocalStore<T> => {
  const cache = new Map<string, { raw: string | null; value: T }>();
  const listeners = new Set<() => void>();

  const readRaw = (key: string) => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      // Storage can be blocked outright; the page still has to render.
      return null;
    }
  };

  const read = (key: string): T => {
    const raw = readRaw(key);
    const cached = cache.get(key);

    if (cached && cached.raw === raw) return cached.value;

    let value = fallback;

    if (raw !== null) {
      try {
        value = parse(JSON.parse(raw));
      } catch {
        value = fallback;
      }
    }

    cache.set(key, { raw, value });

    return value;
  };

  const write = (key: string, value: T) => {
    try {
      globalThis.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }

    listeners.forEach((listener) => listener());

    return true;
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    // Another tab writing the same key fires `storage`, so tabs stay in step.
    globalThis.addEventListener?.('storage', listener);

    return () => {
      listeners.delete(listener);
      globalThis.removeEventListener?.('storage', listener);
    };
  };

  return {
    read,
    write,
    subscribe,
    useValue: (key: string) =>
      useSyncExternalStore(
        subscribe,
        () => read(key),
        () => fallback,
      ),
  };
};
