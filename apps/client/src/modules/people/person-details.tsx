import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Person } from '@/services';

import { useUpdatePerson } from './hooks';
import { InlineField } from './inline-field';
import { PersonChurchLifeSection } from './person-church-life-section';
import { PersonChurchRoles } from './person-church-roles-section';
import { PersonEventsSection } from './person-events-section';
import {
  getFieldHint,
  getFieldValue,
  PERSON_FIELD_GROUPS,
  PERSON_FIELDS,
  type PersonScalarField,
} from './person-field-groups';
import { PersonStepsSection } from './person-steps-section';
import { SectionCard } from './section-card';

/**
 * Картка показує тільки заповнене: решта полів чекає в меню «Додати». Секцій
 * небагато, тож кожна має власний заголовок — шукати поле не доводиться.
 */
export const PersonDetails = ({ person }: { person: Person }) => {
  const groups = (column: 'main' | 'side') =>
    PERSON_FIELD_GROUPS.filter((group) => (group.column ?? 'side') === column).map((group) => (
      <FieldGroupCard
        key={group.title}
        person={person}
        {...group}
        withChurchRoles={group.title === 'Шлях у церкві'}
      />
    ));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:items-start">
      <div className="grid gap-4">
        <PersonStepsSection person={person} />
        <NotesCard person={person} />
        {groups('main')}
        <PersonEventsSection person={person} />
      </div>

      <div className="grid gap-4">
        <PersonChurchLifeSection person={person} />
        {groups('side')}
      </div>
    </div>
  );
};

const NotesCard = ({ person }: { person: Person }) => {
  const save = useFieldSaver(person);

  return (
    <SectionCard title="Нотатки">
      <InlineField
        label="Нотатки"
        labelHidden
        value={person.notes ?? ''}
        type="textarea"
        maxLength={2000}
        placeholder="Порожньо"
        onSave={(value) => save('notes', value)}
      />
    </SectionCard>
  );
};

type FieldGroupCardProps = {
  person: Person;
  title: string;
  fields: PersonScalarField[];
  /** Довідкові секції стартують згорнутими — їх дивляться зрідка. */
  collapsed?: boolean;
  /** Сан живе всередині «Шляху в церкві»: окрема секція для нього була б зайвою. */
  withChurchRoles?: boolean;
};

const FieldGroupCard = ({
  person,
  title,
  fields,
  collapsed = false,
  withChurchRoles = false,
}: FieldGroupCardProps) => {
  const save = useFieldSaver(person);
  const [isOpen, setIsOpen] = useState(!collapsed);
  // Поля, які щойно додали через меню: ще порожні, але вже показані.
  const [revealed, setRevealed] = useState<PersonScalarField[]>([]);
  const [isAddingRole, setIsAddingRole] = useState(false);

  const visible = fields.filter(
    (field) => getFieldValue(person, field) !== '' || revealed.includes(field),
  );
  const missing = fields.filter((field) => !visible.includes(field));

  const reveal = (field: PersonScalarField) => {
    setIsOpen(true);
    setRevealed((current) => [...current, field]);
  };

  const hasChurchRoles = withChurchRoles && person.churchRoles.length > 0;

  if (collapsed && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border-border-muted bg-card hover:border-foreground/30 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-colors"
      >
        <span className="eyebrow text-muted-foreground">{title}</span>
        <span className="text-ink-faint flex items-center gap-1 text-[12px]">
          {visible.length > 0 ? `${visible.length}` : 'порожньо'}
          <ChevronDown className="size-3.5" />
        </span>
      </button>
    );
  }

  return (
    <SectionCard
      title={title}
      action={
        <div className="flex items-center gap-2">
          <AddFieldMenu
            fields={missing}
            onAdd={reveal}
            extra={
              withChurchRoles
                ? { label: 'Сан у церкві', onSelect: () => setIsAddingRole(true) }
                : undefined
            }
          />
          {collapsed ? (
            <button
              type="button"
              aria-label={`Згорнути «${title}»`}
              onClick={() => setIsOpen(false)}
              className="text-ink-faint hover:text-foreground cursor-pointer transition-colors"
            >
              <ChevronDown className="size-3.5 rotate-180" />
            </button>
          ) : null}
        </div>
      }
    >
      {visible.length === 0 && !hasChurchRoles && !isAddingRole ? (
        <p className="text-ink-faint text-[12.5px]">Не заповнено</p>
      ) : (
        <div className="grid gap-1.5 sm:gap-1">
          {visible.map((field) => {
            const definition = PERSON_FIELDS[field];

            return (
              <InlineField
                key={field}
                label={definition.label}
                value={getFieldValue(person, field)}
                type={definition.type}
                options={definition.options}
                maxLength={definition.maxLength}
                hint={getFieldHint(person, field)}
                autoEdit={revealed.includes(field) && getFieldValue(person, field) === ''}
                onSave={(value) => save(field, value)}
                onCancelEmpty={() =>
                  setRevealed((current) => current.filter((item) => item !== field))
                }
              />
            );
          })}

          {withChurchRoles ? (
            <PersonChurchRoles
              person={person}
              isAdding={isAddingRole}
              onAddingChange={setIsAddingRole}
            />
          ) : null}
        </div>
      )}
    </SectionCard>
  );
};

const AddFieldMenu = ({
  fields,
  onAdd,
  extra,
}: {
  fields: PersonScalarField[];
  onAdd: (field: PersonScalarField) => void;
  /** Пункт, який додає не поле, а звʼязану сутність — наприклад, сан. */
  extra?: { label: string; onSelect: () => void };
}) =>
  fields.length === 0 && !extra ? null : (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'text-ink-faint hover:text-foreground flex cursor-pointer items-center gap-1 text-[12px] transition-colors',
        )}
      >
        <Plus className="size-3.5" />
        Додати
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-56 overflow-y-auto"
        // Інакше Radix поверне фокус на кнопку «Додати» й щойно відкрите поле
        // втратить фокус, збережеться порожнім і зникне.
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {extra ? (
          <DropdownMenuItem onSelect={extra.onSelect}>{extra.label}</DropdownMenuItem>
        ) : null}
        {fields.map((field) => (
          <DropdownMenuItem key={field} onSelect={() => onAdd(field)}>
            {PERSON_FIELDS[field].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

/** Одне поле — один PATCH: картка зберігає рівно те, що змінили. */
const useFieldSaver = (person: Person) => {
  const { updatePerson } = useUpdatePerson(person.id);

  return (field: PersonScalarField, value: string) =>
    updatePerson({ [field]: value === '' ? null : value });
};
