/**
 * Режим «операції від імені системи»: суперадмін може підписувати свої дії
 * як D.Church CRM. Прапорець читає і перехоплювач запитів, і сама галочка,
 * тож він живе поза React.
 */
const STORAGE_KEY = 'dchurch-crm.act-as-system';

export const ACT_AS_SYSTEM_HEADER = 'x-act-as-system';

const listeners = new Set<() => void>();

const read = (): boolean => {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

let isEnabled = read();

export const isActingAsSystem = () => isEnabled;

export const setActingAsSystem = (value: boolean): void => {
  isEnabled = value;

  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, String(value));
  } catch {
    // Приватний режим: прапорець доживе до перезавантаження сторінки.
  }

  listeners.forEach((listener) => listener());
};

export const subscribeToSystemActor = (listener: () => void) => {
  listeners.add(listener);

  return () => listeners.delete(listener);
};
