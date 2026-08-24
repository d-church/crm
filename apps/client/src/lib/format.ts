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
