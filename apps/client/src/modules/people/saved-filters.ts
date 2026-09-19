import { z } from 'zod';

import { createLocalStore } from '@/lib/local-store';
import { useAuth } from '@/modules/auth';
import type { PeopleFilter } from '@/services';

import { peopleFilterSchema } from './filtering';

/** A named set of conditions, restored with one click. */
export type SavedPeopleFilter = {
  id: string;
  name: string;
  filter: PeopleFilter;
};

export const MAX_SAVED_FILTER_NAME = 40;
export const MAX_SAVED_FILTERS = 30;

/**
 * Saved sets live in this browser only. The key carries the user id, so two
 * people sharing a church laptop do not see each other's sets.
 */
const storageKey = (userId: string) => `dchurch-crm.people.saved-filters.${userId}`;

const savedFilterSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(MAX_SAVED_FILTER_NAME),
  filter: peopleFilterSchema,
});

/** An entry an older version wrote in another shape is skipped, not fatal. */
const store = createLocalStore<SavedPeopleFilter[]>((raw) => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    const parsed = savedFilterSchema.safeParse(item);

    return parsed.success ? [parsed.data as SavedPeopleFilter] : [];
  });
}, []);

/**
 * Two filters match when they would show the same people. Conditions are compared
 * as tuples, so key order in objects from the URL or from storage never matters.
 */
export const isSameFilter = (a: PeopleFilter | undefined, b: PeopleFilter | undefined) => {
  const canonical = (filter: PeopleFilter | undefined) =>
    JSON.stringify(
      filter
        ? [filter.match, filter.conditions.map((c) => [c.field, c.operator, c.value ?? null])]
        : null,
    );

  return canonical(a) === canonical(b);
};

const normalizeName = (name: string) => name.trim().toLocaleLowerCase('uk-UA');

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Why a name cannot be used, or `null` when it can. */
export const validateSavedFilterName = (
  name: string,
  saved: SavedPeopleFilter[],
  ownId?: string,
): string | null => {
  const trimmed = name.trim();

  if (!trimmed) return 'Вкажіть назву';

  if (trimmed.length > MAX_SAVED_FILTER_NAME) {
    return `Не довше ${MAX_SAVED_FILTER_NAME} символів`;
  }

  const taken = saved.some(
    (item) => item.id !== ownId && normalizeName(item.name) === normalizeName(trimmed),
  );

  return taken ? 'Фільтр з такою назвою вже є' : null;
};

export const useSavedPeopleFilters = () => {
  const { user } = useAuth();
  const key = storageKey(user?.id ?? 'anonymous');
  const saved = store.useValue(key);

  /** Newest first — the set just saved is the one about to be used. */
  const save = (name: string, filter: PeopleFilter) =>
    store.write(key, [{ id: createId(), name: name.trim(), filter }, ...store.read(key)]);

  const rename = (id: string, name: string) =>
    store.write(
      key,
      store.read(key).map((item) => (item.id === id ? { ...item, name: name.trim() } : item)),
    );

  const replaceFilter = (id: string, filter: PeopleFilter) =>
    store.write(
      key,
      store.read(key).map((item) => (item.id === id ? { ...item, filter } : item)),
    );

  const remove = (id: string) =>
    store.write(
      key,
      store.read(key).filter((item) => item.id !== id),
    );

  /** Puts a deleted set back where it was — the undo in the toast. */
  const restore = (item: SavedPeopleFilter, index: number) => {
    const items = store.read(key).filter(({ id }) => id !== item.id);

    items.splice(Math.min(index, items.length), 0, item);

    return store.write(key, items);
  };

  return { saved, save, rename, replaceFilter, remove, restore };
};
