import { useSyncExternalStore } from 'react';

/**
 * Кого відмічено в списку людей. Живе поза компонентом навмисно: маршрут
 * розмонтовується, щойно відкриваєш картку, і разом з ним зникало б виділення —
 * а повернення «назад» мало б повертати рівно той стан, з якого пішов.
 *
 * У localStorage не кладемо: відмічені люди — це робочий стан, а не налаштування.
 * Через день він був би радше пасткою, ніж послугою.
 */
let selected: ReadonlySet<string> = new Set();

const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => listeners.delete(listener);
};

export const peopleSelection = {
  get: () => selected,

  set: (ids: Iterable<string>) => {
    selected = new Set(ids);
    emit();
  },

  clear: () => {
    if (selected.size === 0) return;

    selected = new Set();
    emit();
  },

  toggle: (id: string) => {
    const next = new Set(selected);

    if (!next.delete(id)) next.add(id);

    selected = next;
    emit();
  },

  togglePage: (ids: string[], isSelected: boolean) => {
    const next = new Set(selected);

    ids.forEach((id) => (isSelected ? next.add(id) : next.delete(id)));

    selected = next;
    emit();
  },
};

export const usePeopleSelection = (): ReadonlySet<string> =>
  useSyncExternalStore(subscribe, peopleSelection.get, peopleSelection.get);
