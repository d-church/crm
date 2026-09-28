import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { PersonCombobox } from '@/components/person-combobox';
import { Input, Select } from '@/components/ui';
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
import { SectionCard } from './section-card';

type Field = 'maritalStatus' | 'orphanStatus' | 'isMilitary';

/**
 * Чутливе про саму людину: сімейний стан, сирітство, служба. Це не «шлях у церкві»
 * і не довідка — це те, що визначає пасторську увагу, тому живе в пасторському шарі
 * й видно лише тим, хто має опіку.
 */
export const PersonPersonalSection = ({ person }: { person: Person }) => {
  const { updatePerson } = useUpdatePerson(person.id);
  const { data: choices = [] } = usePersonChoices();
  const [revealed, setRevealed] = useState<Field[]>([]);

  const save = async (patch: Partial<Person>) => {
    try {
      await updatePerson(patch as never);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти'));
    }
  };

  const partner = partnerOf(person);
  const shows = (field: Field, filled: boolean) => filled || revealed.includes(field);

  const hasMarital = shows('maritalStatus', Boolean(person.maritalStatus));
  const hasOrphan = shows('orphanStatus', Boolean(person.orphanStatus));
  const hasMilitary = shows('isMilitary', person.isMilitary === true);
  const missing = (
    [
      ['maritalStatus', 'Сімейний стан'],
      ['orphanStatus', 'Сирітство'],
      ['isMilitary', militaryLabel(person.gender)],
    ] as [Field, string][]
  ).filter(
    ([field]) =>
      !shows(field, field === 'isMilitary' ? person.isMilitary === true : Boolean(person[field])),
  );

  return (
    <SectionCard
      title="Особисте"
      action={
        missing.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {missing.map(([field, label]) => (
              <button
                key={field}
                type="button"
                onClick={() => setRevealed((current) => [...current, field])}
                className="text-ink-faint hover:text-foreground flex cursor-pointer items-center gap-1 text-[12px] transition-colors"
              >
                <Plus className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        ) : null
      }
    >
      {!hasMarital && !hasOrphan && !hasMilitary && !partner ? (
        <p className="text-ink-faint text-[12.5px]">Не заповнено</p>
      ) : (
        <div className="grid gap-2">
          {hasMarital ? (
            <>
              <Row label="Сімейний стан">
                <Select
                  value={person.maritalStatus ?? ''}
                  aria-label="Сімейний стан"
                  className="h-9 w-full text-[13px]"
                  onChange={(event) =>
                    void save({
                      maritalStatus: (event.target.value || null) as MaritalStatus | null,
                      // Розлучення й вдівство не тягнуть за собою пару.
                      ...(hasPartner(event.target.value as MaritalStatus)
                        ? {}
                        : { partnerId: null }),
                    })
                  }
                >
                  <option value="">Не вказано</option>
                  {MARITAL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {maritalLabel(status, person.gender)}
                    </option>
                  ))}
                </Select>
              </Row>

              {hasPartner(person.maritalStatus) ? (
                <>
                  <Row label="Пара">
                    <PersonCombobox
                      id={`partner-${person.id}`}
                      people={choices.filter(({ id }) => id !== person.id)}
                      value={partner?.id ?? ''}
                      ariaLabel="Пара"
                      placeholder="Знайти людину"
                      emptyLabel="Не вказано"
                      inputClassName="h-9 text-[13px]"
                      onChange={(partnerId) => void save({ partnerId: partnerId || null })}
                    />
                    {/* Поле пошуку саме по собі нікуди не веде, тож перехід окремо. */}
                    {partner ? <PartnerLink partner={partner} label="Відкрити картку" /> : null}
                  </Row>

                  <Row label={maritalDateLabel(person.maritalStatus)}>
                    <Input
                      type="date"
                      value={toDateInputValue(person.maritalSince ?? '')}
                      aria-label={maritalDateLabel(person.maritalStatus)}
                      className="h-9 w-44 text-[13px]"
                      onChange={(event) => void save({ maritalSince: event.target.value || null })}
                    />
                  </Row>
                </>
              ) : null}
            </>
          ) : null}

          {hasOrphan ? (
            <Row label="Сирітство">
              <Select
                value={person.orphanStatus ?? ''}
                aria-label="Сирітство"
                className="h-9 w-full text-[13px]"
                onChange={(event) =>
                  void save({ orphanStatus: (event.target.value || null) as OrphanStatus | null })
                }
              >
                <option value="">Не вказано</option>
                {ORPHAN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ORPHAN_LABELS[status]}
                  </option>
                ))}
              </Select>
            </Row>
          ) : null}

          {hasMilitary ? (
            <Row label={militaryLabel(person.gender)}>
              <Select
                value={person.isMilitary === true ? 'true' : ''}
                aria-label={militaryLabel(person.gender)}
                className="h-9 w-full text-[13px]"
                onChange={(event) => void save({ isMilitary: event.target.value === 'true' })}
              >
                <option value="">Ні</option>
                <option value="true">Так</option>
              </Select>
            </Row>
          ) : null}
        </div>
      )}

      {/* Пару вносять на одній картці — на другій вона лише показується. */}
      {partner && !hasPartner(person.maritalStatus) ? (
        <p className="text-ink-soft text-[13px]">
          Пара: <PartnerLink partner={partner} />
        </p>
      ) : null}
    </SectionCard>
  );
};

/**
 * Пара — це людина в базі, тож у її картку має бути як потрапити. Але пара може
 * бути поза вашою областю: тоді імʼя лишається, а посилання немає — краще нічого,
 * ніж перехід у «людину не знайдено».
 */
const PartnerLink = ({ partner, label }: { partner: PersonPartner; label?: string }) =>
  partner.canOpen === false ? (
    <span className="text-ink-faint text-[12.5px]">
      {label ? 'Картка закрита' : getPersonName(partner)}
    </span>
  ) : (
    <Link
      to="/people/$personId"
      params={{ personId: partner.id }}
      className="text-primary text-[12.5px] hover:underline"
    >
      {label ?? getPersonName(partner)}
    </Link>
  );

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="grid gap-0.5">
    <span className="text-ink-faint text-[11.5px]">{label}</span>
    {children}
  </label>
);
