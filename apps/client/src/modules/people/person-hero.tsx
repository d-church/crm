import { Link } from '@tanstack/react-router';
import { ArrowLeft, HeartHandshake, History, IdCard, Trash2 } from 'lucide-react';
import { useState, type FocusEvent, type KeyboardEvent } from 'react';
import { toast } from 'sonner';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { Input } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { getAge, getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ActivityState, getPersonName, MinistryRole, type Person } from '@/services';

import { DeletePersonDialog } from './delete-person-dialog';
import { useUpdatePerson } from './hooks';
import { InlineField } from './inline-field';
import { CareBadge } from './person-badges';
import {
  ACTIVITY_BADGES,
  ACTIVITY_LABELS,
  ACTIVITY_STATES,
  MEMBERSHIP_BADGES,
  MEMBERSHIP_HINTS,
  MEMBERSHIP_LABELS,
  MEMBERSHIP_STATUSES,
} from './status';

/**
 * Чим людина керує. Для церкви це таке саме «хто вона», як і сан, тож стоїть
 * поруч із ним, а не десь у секціях. Керівництво служінням читається з ролі
 * в участі, решта — з окремих звʼязків.
 */
const leadsOf = (person: Person): string[] => [
  ...person.leadingCommunities.map(({ name }) => `Лідер ${name}`),
  ...person.leadingHomeGroups.map(({ name }) => `Лідер ${name}`),
  ...person.ministryAssignments
    .filter(({ role }) => role === MinistryRole.LEADER)
    .map(({ ministry }) => `Керівник ${ministry.name}`),
  ...person.leadingTrainings.map(({ name }) => `Веде ${name}`),
];

const BADGE =
  'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[12.5px] leading-4 sm:py-0.5 sm:text-[11.5px] sm:leading-5';

/**
 * Хто ця людина, чи вона тут і як до неї додзвонитися — усе в одному блоці.
 * Статус і активність міняються просто кліком по бейджу.
 */
type PersonHeroProps = {
  person: Person;
  onDeleted: () => void;
  /** Картка чи хронологія — перемикач живе тут, бо стосується всієї сторінки. */
  view: 'card' | 'timeline';
  onViewChange: (view: 'card' | 'timeline') => void;
};

export const PersonHero = ({ person, onDeleted, view, onViewChange }: PersonHeroProps) => {
  const { updatePerson } = useUpdatePerson(person.id);
  const name = getPersonName(person);
  const age = getAge(person.birthDate);
  const facts = [age === null ? null : `${age} р.`, person.city].filter(Boolean).join(' · ');

  return (
    <div className="bg-card border-border grid gap-3 rounded-xl border px-4 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:gap-x-4">
      <div className="flex items-start gap-3 sm:contents">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e6ece5] text-[14px] text-[#3f4a43]">
          {getInitials(name)}
        </span>

        <div className="min-w-0 flex-1 sm:hidden">
          <PersonNameField
            person={person}
            onSave={updatePerson}
            className="text-[19px] leading-snug font-light break-words"
          />
        </div>

        {/* На телефоні дії стоять поруч з іменем, щоб не з'їдати окремий рядок. */}
        <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
          <ViewToggle view={view} onViewChange={onViewChange} compact />

          <Button asChild variant="outline" size="icon" className="size-9" title="До списку">
            <Link to="/people" aria-label="До списку людей">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <CareToggle person={person} onToggle={updatePerson} />
          <DeletePersonDialog person={person} onDeleted={onDeleted}>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive size-9"
              title="Видалити"
            >
              <Trash2 className="size-4" />
            </Button>
          </DeletePersonDialog>
        </div>
      </div>

      <div className="grid min-w-0 gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="hidden min-w-0 sm:block">
            <PersonNameField
              person={person}
              onSave={updatePerson}
              className="truncate text-[20px] leading-tight font-light"
            />
          </div>

          <PickerBadge
            label={MEMBERSHIP_LABELS[person.membership]}
            hint={MEMBERSHIP_HINTS[person.membership]}
            className={MEMBERSHIP_BADGES[person.membership]}
            options={MEMBERSHIP_STATUSES.map((value) => ({
              value,
              label: MEMBERSHIP_LABELS[value],
            }))}
            onSelect={(value) => void updatePerson({ membership: value as never })}
          />

          <PickerBadge
            label={ACTIVITY_LABELS[person.activity]}
            className={cn(
              ACTIVITY_BADGES[person.activity],
              // «Активний» — типовий стан, тож він не має кричати.
              person.activity === ActivityState.ACTIVE && 'bg-transparent text-ink-faint',
            )}
            options={ACTIVITY_STATES.map((value) => ({ value, label: ACTIVITY_LABELS[value] }))}
            onSelect={(value) => void updatePerson({ activity: value as never })}
          />

          {/* Сан видно одразу: для церкви це важливіше за будь-яке інше поле. */}
          {person.churchRoles
            .filter(({ until }) => until === null)
            .map(({ id, roleType }) => (
              <span key={id} className={cn(BADGE, 'bg-[#e8e0f0] text-[#5c4a76]')}>
                {roleType.name}
              </span>
            ))}

          {leadsOf(person).map((what) => (
            <span key={what} className={cn(BADGE, 'bg-[#e4ecf4] text-[#3a5a78]')}>
              {what}
            </span>
          ))}

          {person.careNeeded ? <CareBadge /> : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] sm:text-[12.5px]">
          {facts ? <span className="text-ink-soft">{facts}</span> : null}
          <span className="min-w-[10rem] flex-1">
            <InlineField
              label="Телефон"
              labelHidden
              value={person.phone ?? ''}
              type="phone"
              maxLength={30}
              placeholder="додати телефон"
              onSave={(value) => updatePerson({ phone: value || null })}
            />
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <ViewToggle view={view} onViewChange={onViewChange} />

        <CareToggle person={person} onToggle={updatePerson} />

        <Button asChild variant="outline" size="sm">
          <Link to="/people">
            <ArrowLeft />
            До списку
          </Link>
        </Button>

        <DeletePersonDialog person={person} onDeleted={onDeleted}>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive size-8"
            title="Видалити"
          >
            <Trash2 className="size-4" />
          </Button>
        </DeletePersonDialog>
      </div>
    </div>
  );
};

/**
 * Імʼя редагується там, де воно й показане, — у шапці. Окреме поле десь у
 * «Деталях» читалося б як службове, хоча це найперше, що про людину знають.
 */
const PersonNameField = ({
  person,
  onSave,
  className,
}: {
  person: Person;
  onSave: (payload: { firstName?: string; lastName?: string | null }) => Promise<unknown>;
  className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const start = () => {
    setFirstName(person.firstName);
    setLastName(person.lastName ?? '');
    setIsEditing(true);
  };

  const save = async () => {
    const first = firstName.trim();
    const last = lastName.trim();

    setIsEditing(false);

    if (first.length < 2) {
      toast.error('Імʼя не може бути коротшим за два символи');

      return;
    }

    if (first === person.firstName && last === (person.lastName ?? '')) return;

    try {
      await onSave({ firstName: first, lastName: last || null });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти імʼя'));
    }
  };

  // Поля два, тож зберігаємо, лише коли фокус іде з обох: інакше перехід
  // з імені на прізвище рахувався б за завершення редагування.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;

    void save();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') void save();
    if (event.key === 'Escape') setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        title="Змінити імʼя"
        onClick={start}
        className={cn('w-full cursor-pointer text-left', className)}
      >
        {getPersonName(person)}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" onBlur={onBlur} onKeyDown={onKeyDown}>
      <Input
        autoFocus
        value={firstName}
        maxLength={50}
        aria-label="Імʼя"
        placeholder="Імʼя"
        className="h-9 w-32 text-[15px]"
        onChange={(event) => setFirstName(event.target.value)}
      />
      <Input
        value={lastName}
        maxLength={50}
        aria-label="Прізвище"
        placeholder="Прізвище"
        className="h-9 w-36 text-[15px]"
        onChange={(event) => setLastName(event.target.value)}
      />
    </div>
  );
};

/** Перемикає всю сторінку між карткою і стрічкою подій. */
const ViewToggle = ({
  view,
  onViewChange,
  compact = false,
}: {
  view: 'card' | 'timeline';
  onViewChange: (view: 'card' | 'timeline') => void;
  compact?: boolean;
}) => {
  const isTimeline = view === 'timeline';

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      title={isTimeline ? 'Показати картку' : 'Показати хронологію'}
      aria-pressed={isTimeline}
      className={cn(compact && 'size-9', isTimeline && 'border-primary text-primary')}
      onClick={() => onViewChange(isTimeline ? 'card' : 'timeline')}
    >
      {/* Іконка показує, куди веде натискання, а не де ти зараз. */}
      {isTimeline ? <IdCard className="size-4" /> : <History className="size-4" />}
      {compact ? null : isTimeline ? 'Картка' : 'Хронологія'}
    </Button>
  );
};

const CareToggle = ({
  person,
  onToggle,
}: {
  person: Person;
  onToggle: (payload: { careNeeded: boolean }) => Promise<unknown>;
}) => (
  <Button
    type="button"
    variant="outline"
    size="icon"
    title={person.careNeeded ? 'Зняти позначку уваги' : 'Потребує уваги'}
    aria-label={person.careNeeded ? 'Зняти позначку уваги' : 'Потребує уваги'}
    className={cn('size-9 sm:size-8', person.careNeeded && 'border-destructive text-destructive')}
    onClick={() => void onToggle({ careNeeded: !person.careNeeded })}
  >
    <HeartHandshake className="size-4" />
  </Button>
);

type PickerBadgeProps = {
  label: string;
  hint?: string;
  className: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
};

/** Бейдж, який водночас показує значення і дає його змінити. */
const PickerBadge = ({ label, hint, className, options, onSelect }: PickerBadgeProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      title={hint}
      className={cn(BADGE, className, 'cursor-pointer transition-opacity hover:opacity-80')}
    >
      {label}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-52">
      {options.map((option) => (
        <DropdownMenuItem key={option.value} onSelect={() => onSelect(option.value)}>
          {option.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
