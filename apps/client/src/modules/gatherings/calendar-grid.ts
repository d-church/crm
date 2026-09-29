export const MONTH_NAMES = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

/**
 * Проміжок місяця для запиту і сітка днів для показу. Тиждень починається з
 * понеділка, тож неділя в `getDay()` (нуль) стає сьомим днем.
 */
export const toMonthRange = (month: Date) => {
  const year = month.getFullYear();
  const index = month.getMonth();
  const first = new Date(year, index, 1);
  const last = new Date(year, index + 1, 0);
  const days = Array.from({ length: last.getDate() }, (_, day) => new Date(year, index, day + 1));

  return {
    from: toDayKey(first),
    to: toDayKey(last),
    days,
    leadingBlanks: (first.getDay() + 6) % 7,
  };
};

/**
 * Локальна дата без зсуву. `toISOString()` віддає UTC, і вечірнє зібрання за
 * Києвом потрапляло б у сітці на попередній день — саме такий зсув ми й ловили.
 */
export const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
