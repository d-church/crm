const dateTimeFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const formatDateTime = (value: string | Date) => dateTimeFormatter.format(new Date(value));

export const formatDate = (value: string | Date) => dateFormatter.format(new Date(value));

export const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const dayMonthFormatter = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit' });

/** "24.08" — the compact form the people table uses for the last meeting. */
export const formatDayMonth = (value: string | Date) => dayMonthFormatter.format(new Date(value));

export const getAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;

  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;

  const now = new Date();
  const age = now.getFullYear() - born.getFullYear();
  const hadBirthday =
    now.getMonth() > born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() >= born.getDate());

  return hadBirthday ? age : age - 1;
};
