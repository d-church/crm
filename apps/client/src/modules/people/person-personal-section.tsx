import { Link } from '@tanstack/react-router';
import { Pencil, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { PersonCombobox } from '@/components/person-combobox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { toDateInputValue } from '@/lib/format';
import {
  getPersonName,
  type MaritalStatus,
  type OrphanStatus,
  type Person,
  type PersonPartner,
} from '@/services';

import {
  hasPartner,
  maritalDateLabel,
  maritalLabel,
  MARITAL_STATUSES,
  militaryLabel,
  ORPHAN_LABELS,
  ORPHAN_STATUSES,
  partnerOf,
} from './circumstances';
import { usePersonChoices, useUpdatePerson } from './hooks';
import { InlineField } from './inline-field';
import { SectionCard } from './section-card';

type Field = 'maritalStatus' | 'orphanStatus' | 'isMilitary';

/**
 * Чутливе про саму людину: сімейний стан, сирітство, служба. Це не «шлях у церкві»
 * і не довідка — це те, що визначає пасторську увагу, тому живе в пасторському
 * шарі й видно лише тим, хто має опіку.
 *
 * Поводиться як решта картки: збережене читається текстом, клік перетворює його
 * на поле. Порожні поля чекають у меню «Додати», а не висять порожніми рядками.
 */
export const PersonPersonalSection = ({ person }: { person: Person }) => {
  const { updatePerson } = useUpdatePerson(person.id);
  // Поля, які щойно додали з меню: ще порожні, але вже показані й відкриті.
  const [revealed, setRevealed] = useState<Field[]>([]);

  const save = async (patch: Partial<Person>) => {
    try {
      await updatePerson(patch as never);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти'));
      throw error;
    }
  };

  const partner = partnerOf(person);
  const filled: Record<Field, boolean> = {
    maritalStatus: Boolean(person.maritalStatus),
    orphanStatus: Boolean(person.orphanStatus),
    isMilitary: person.isMilitary === true,
  };
  const shows = (field: Field) => filled[field] || revealed.includes(field);

  const labels: Record<Field, string> = {
    maritalStatus: 'Сімейний стан',
    orphanStatus: 'Сирітство',
    isMilitary: militaryLabel(person.gender),
  };
  const missing = (Object.keys(labels) as Field[]).filter((field) => !shows(field));

  const reveal = (field: Field) => setRevealed((current) => [...current, field]);
  const hide = (field: Field) => setRevealed((current) => current.filter((item) => item !== field));

  const isEmpty = missing.length === Object.keys(labels).length;

  return (
    <SectionCard
      title="Особисте"
      action={
        missing.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="text-ink-faint hover:text-foreground flex cursor-pointer items-center gap-1 text-[12px] transition-colors">
              <Plus className="size-3.5" />
              Додати
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52"
              // Інакше Radix поверне фокус на кнопку, і щойно відкрите поле
              // втратить його, збережеться порожнім і зникне.
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              {missing.map((field) => (
                <DropdownMenuItem key={field} onSelect={() => reveal(field)}>
                  {labels[field]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null
      }
    >
      {isEmpty && !partner ? (
        <p className="text-ink-faint text-[12.5px]">Не заповнено</p>
      ) : (
        <div className="grid gap-1.5 sm:gap-1">
          {shows('maritalStatus') ? (
            <InlineField
              label={labels.maritalStatus}
              value={person.maritalStatus ?? ''}
              type="select"
              options={MARITAL_STATUSES.map((status) => ({
                value: status,
                label: maritalLabel(status, person.gender),
              }))}
              autoEdit={revealed.includes('maritalStatus') && !filled.maritalStatus}
              onCancelEmpty={() => hide('maritalStatus')}
              onSave={(value) =>
                save({
                  maritalStatus: (value || null) as MaritalStatus | null,
                  // Розлучення й вдівство пари за собою не тягнуть.
                  ...(hasPartner(value as MaritalStatus) ? {} : { partnerId: null }),
                })
              }
            />
          ) : null}

          {hasPartner(person.maritalStatus) ? (
            <>
              <PartnerField
                person={person}
                partner={partner}
                onSave={(partnerId) => save({ partnerId })}
              />

              <InlineField
                label={maritalDateLabel(person.maritalStatus)}
                value={toDateInputValue(person.maritalSince ?? '')}
                type="date"
                onSave={(value) => save({ maritalSince: value || null })}
              />
            </>
          ) : null}

          {shows('orphanStatus') ? (
            <InlineField
              label={labels.orphanStatus}
              value={person.orphanStatus ?? ''}
              type="select"
              options={ORPHAN_STATUSES.map((status) => ({
                value: status,
                label: ORPHAN_LABELS[status],
              }))}
              autoEdit={revealed.includes('orphanStatus') && !filled.orphanStatus}
              onCancelEmpty={() => hide('orphanStatus')}
              onSave={(value) => save({ orphanStatus: (value || null) as OrphanStatus | null })}
            />
          ) : null}

          {shows('isMilitary') ? (
            <InlineField
              label={labels.isMilitary}
              value={person.isMilitary === true ? 'true' : ''}
              type="select"
              options={[{ value: 'true', label: 'Так' }]}
              autoEdit={revealed.includes('isMilitary') && !filled.isMilitary}
              onCancelEmpty={() => hide('isMilitary')}
              onSave={(value) => save({ isMilitary: value === 'true' })}
            />
          ) : null}

          {/* Пару вносять на одній картці — на другій вона лише показується. */}
          {partner && !hasPartner(person.maritalStatus) ? (
            <Row label="Пара">
              <PartnerName partner={partner} />
            </Row>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
};

/**
 * Пара — не просто значення, а людина: показується посиланням, а міняється
 * пошуком. Тому окремо від InlineField, але з тією самою поведінкою.
 */
const PartnerField = ({
  person,
  partner,
  onSave,
}: {
  person: Person;
  partner: PersonPartner | null;
  onSave: (partnerId: string | null) => Promise<unknown>;
}) => {
  const { data: choices = [] } = usePersonChoices();
  const [isEditing, setIsEditing] = useState(false);

  const choose = async (partnerId: string) => {
    setIsEditing(false);

    if (partnerId === (partner?.id ?? '')) return;

    try {
      await onSave(partnerId || null);
    } catch {
      // Повідомлення вже показав той, хто зберігає.
    }
  };

  return (
    <Row label="Пара">
      {isEditing ? (
        <PersonCombobox
          id={`partner-${person.id}`}
          people={choices.filter(({ id }) => id !== person.id)}
          value={partner?.id ?? ''}
          ariaLabel="Пара"
          placeholder="Знайти людину"
          emptyLabel="Не вказано"
          inputClassName="h-8 text-[13px]"
          onChange={(partnerId) => void choose(partnerId)}
        />
      ) : (
        <span className="group flex items-center gap-1.5">
          {partner ? (
            <>
              <PartnerName partner={partner} />
              <button
                type="button"
                title="Змінити пару"
                aria-label="Змінити пару"
                onClick={() => setIsEditing(true)}
                className="text-ink-faint hover:text-foreground cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Pencil className="size-3" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-ink-faint hover:text-foreground cursor-pointer text-[13px] transition-colors"
            >
              Не вказано
            </button>
          )}
        </span>
      )}
    </Row>
  );
};

/** Картка пари відкривається лише тоді, коли вона вам доступна. */
const PartnerName = ({ partner }: { partner: PersonPartner }) =>
  partner.canOpen === false ? (
    <span className="text-ink text-[13px]">{getPersonName(partner)}</span>
  ) : (
    <Link
      to="/people/$personId"
      params={{ personId: partner.id }}
      className="text-ink text-[13px] underline-offset-3 hover:underline"
    >
      {getPersonName(partner)}
    </Link>
  );

/** Той самий двоколонковий рядок, що й в InlineField, щоб підписи стояли в лінію. */
const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] sm:items-baseline sm:gap-3">
    <span className="text-ink-faint text-[12px]">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
);
