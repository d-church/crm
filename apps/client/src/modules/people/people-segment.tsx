import { cn } from '@/lib/utils';
import { useCommunities } from '@/modules/communities';

/** Значення за замовчуванням: уся церква. */
export const ALL_SEGMENT = 'all';

/** Усе, що поза відгалуженнями. */
export const REST_SEGMENT = 'rest';

/**
 * D.Youth — фактично церква в церкві: своя структура, свої адміни, свої цифри.
 * Тому база дивиться трьома способами — уся церква, лише відгалуження, решта.
 * Перемикач зникає сам, якщо жодної спільноти не позначено відгалуженням.
 */
export const PeopleSegment = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (segment: string) => void;
}) => {
  const { data: communities = [] } = useCommunities();
  const branches = communities.filter(({ isBranch }) => isBranch);

  if (branches.length === 0) return null;

  const options = [
    { value: ALL_SEGMENT, label: 'Усі' },
    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
    { value: REST_SEGMENT, label: branches.length === 1 ? `Без ${branches[0].name}` : 'Решта' },
  ];

  return (
    <div className="border-input-border inline-flex rounded-full border p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'cursor-pointer rounded-full px-3 py-1 text-[12.5px] transition-colors',
            value === option.value
              ? 'bg-primary text-primary-foreground'
              : 'text-ink-faint hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
