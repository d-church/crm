import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { PersonCombobox } from '@/components/person-combobox';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  getPersonName,
  PersonEventKind,
  type Person,
  type PersonEvent,
  type PersonEventPayload,
} from '@/services';

import { EVENT_KIND_BADGES, EVENT_KIND_LABELS, TALK_KINDS } from './event-kinds';
import { usePersonChoices, usePersonEvents } from './hooks';
import { SectionCard } from './section-card';

const today = () => new Date().toLocaleDateString('sv-SE');

/**
 * Дві речі, які команда записує руками: віхи життя людини і власне спілкування з
 * нею. Обидві лягають у хронологію, тому живуть в одній секції. «Контактами»
 * ми навмисно не називаємо — так у картці звуться телефон і адреса.
 */
export const PersonEventsSection = ({ person }: { person: Person }) => {
  const { addEvent, isAdding, updateEvent, removeEvent } = usePersonEvents(person.id);
  const [draft, setDraft] = useState<PersonEventPayload | null>(null);

  const run = async (action: Promise<unknown>, failure: string) => {
    try {
      await action;
    } catch (error) {
      toast.error(getApiErrorMessage(error, failure));
    }
  };

  const startDraft = (kind: PersonEventKind) =>
    setDraft({ kind, occurredAt: today(), title: '', note: '', withPersonId: '' });

  const save = async () => {
    if (!draft) return;

    await run(
      addEvent({
        ...draft,
        // Порожні рядки валідатор ловить як помилку, тож шлемо чисті null.
        title: draft.kind === PersonEventKind.EVENT ? draft.title?.trim() : null,
        withPersonId: draft.withPersonId || null,
        note: draft.note?.trim() || null,
      }),
      'Не вдалося додати запис',
    );
    setDraft(null);
  };

  return (
    <SectionCard
      title={
        person.events.length > 0
          ? `Події та спілкування · ${person.events.length}`
          : 'Події та спілкування'
      }
      action={
        draft ? null : (
          <div className="flex items-center gap-2">
            <AddButton label="Подія" onClick={() => startDraft(PersonEventKind.EVENT)} />
            <AddButton label="Спілкування" onClick={() => startDraft(PersonEventKind.MEETING)} />
          </div>
        )
      }
    >
      {person.events.length > 0 ? (
        <ul className="divide-border-subtle -my-1 divide-y">
          {person.events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onChange={(payload) =>
                void run(updateEvent({ id: event.id, ...payload }), 'Не вдалося зберегти запис')
              }
              onRemove={() => void run(removeEvent(event.id), 'Не вдалося прибрати запис')}
            />
          ))}
        </ul>
      ) : null}

      {draft ? (
        <EventForm
          draft={draft}
          isSaving={isAdding}
          onChange={(patch) => setDraft({ ...draft, ...patch })}
          onSave={() => void save()}
          onCancel={() => setDraft(null)}
        />
      ) : person.events.length === 0 ? (
        <p className="text-ink-faint text-[12.5px]">Записів ще немає</p>
      ) : null}
    </SectionCard>
  );
};

const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-ink-faint hover:text-foreground flex cursor-pointer items-center gap-1 text-[12px] transition-colors"
  >
    <Plus className="size-3.5" />
    {label}
  </button>
);

type EventFormProps = {
  draft: PersonEventPayload;
  isSaving: boolean;
  onChange: (patch: PersonEventPayload) => void;
  onSave: () => void;
  onCancel: () => void;
};

/** Подія питає назву, спілкування — вид, співрозмовника і нотатку про хід розмови. */
const EventForm = ({ draft, isSaving, onChange, onSave, onCancel }: EventFormProps) => {
  const { data: choices = [] } = usePersonChoices();
  const isEvent = draft.kind === PersonEventKind.EVENT;
  const isReady = isEvent
    ? Boolean(draft.title?.trim() && draft.occurredAt)
    : Boolean(draft.occurredAt);

  return (
    <div className="border-border-muted mt-2 grid gap-2 rounded-lg border p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {isEvent ? (
          <Input
            autoFocus
            value={draft.title ?? ''}
            maxLength={120}
            placeholder="Назва події, напр. «Одруження»"
            aria-label="Назва події"
            className="h-9 min-w-[150px] flex-1 text-[13px]"
            onChange={(event) => onChange({ title: event.target.value })}
          />
        ) : (
          <Select
            autoFocus
            value={draft.kind}
            aria-label="Вид спілкування"
            className="h-9 w-40 text-[13px]"
            onChange={(event) => onChange({ kind: event.target.value as PersonEventKind })}
          >
            {TALK_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {EVENT_KIND_LABELS[kind]}
              </option>
            ))}
          </Select>
        )}

        <Input
          type="date"
          value={draft.occurredAt ?? ''}
          aria-label="Дата"
          className="h-9 w-36 text-[13px]"
          onChange={(event) => onChange({ occurredAt: event.target.value })}
        />
      </div>

      {isEvent ? null : (
        <>
          <PersonCombobox
            id="talk-with-person"
            people={choices}
            value={draft.withPersonId ?? ''}
            ariaLabel="Хто з церкви спілкувався"
            placeholder="Хто з церкви спілкувався"
            emptyLabel="Не вказано"
            inputClassName="h-9 text-[13px]"
            onChange={(withPersonId) => onChange({ withPersonId })}
          />

          <Textarea
            value={draft.note ?? ''}
            rows={3}
            maxLength={1000}
            placeholder="Про що говорили, до чого домовились"
            aria-label="Нотатка про хід розмови"
            className="text-[13px]"
            onChange={(event) => onChange({ note: event.target.value })}
          />
        </>
      )}

      <div className="flex items-center gap-1.5">
        <Button type="button" size="sm" disabled={!isReady || isSaving} onClick={onSave}>
          Додати
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
      </div>
    </div>
  );
};

type EventRowProps = {
  event: PersonEvent;
  onChange: (payload: PersonEventPayload) => void;
  onRemove: () => void;
};

const EventRow = ({ event, onChange, onRemove }: EventRowProps) => {
  const { data: choices = [] } = usePersonChoices();
  const [isEditing, setIsEditing] = useState(false);
  const day = event.occurredAt.slice(0, 10);
  const isEvent = event.kind === PersonEventKind.EVENT;

  if (isEditing) {
    return (
      <li className="grid gap-1.5 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {isEvent ? (
            <Input
              defaultValue={event.title ?? ''}
              maxLength={120}
              aria-label="Назва події"
              className="h-8 min-w-[140px] flex-1 text-[12.5px]"
              onBlur={(input) => {
                const title = input.target.value.trim();

                // Подія без назви не зберігається — лишаємо стару.
                if (title.length >= 2 && title !== event.title) onChange({ title });
              }}
            />
          ) : (
            <Select
              value={event.kind}
              aria-label="Вид спілкування"
              className="h-8 w-36 text-[12.5px]"
              onChange={(input) => onChange({ kind: input.target.value as PersonEventKind })}
            >
              {TALK_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {EVENT_KIND_LABELS[kind]}
                </option>
              ))}
            </Select>
          )}

          <Input
            type="date"
            defaultValue={day}
            aria-label="Дата"
            className="h-8 w-36 text-[12.5px]"
            onChange={(input) => input.target.value && onChange({ occurredAt: input.target.value })}
          />

          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Готово
          </Button>
        </div>

        {isEvent ? null : (
          <>
            <PersonCombobox
              id={`talk-with-person-${event.id}`}
              people={choices}
              value={event.withPersonId ?? ''}
              ariaLabel="Хто з церкви спілкувався"
              placeholder="Хто з церкви спілкувався"
              emptyLabel="Не вказано"
              inputClassName="h-8 text-[12.5px]"
              onChange={(withPersonId) => onChange({ withPersonId: withPersonId || null })}
            />

            <Textarea
              defaultValue={event.note ?? ''}
              rows={3}
              maxLength={1000}
              placeholder="Про що говорили, до чого домовились"
              aria-label="Нотатка про хід розмови"
              className="text-[12.5px]"
              onBlur={(input) =>
                input.target.value !== (event.note ?? '') &&
                onChange({ note: input.target.value || null })
              }
            />
          </>
        )}
      </li>
    );
  }

  return (
    <li className="group grid gap-0.5 py-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-1.5 text-left text-[13px]"
        >
          {isEvent ? (
            <span className="text-ink">{event.title}</span>
          ) : (
            <>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10.5px] leading-none',
                  EVENT_KIND_BADGES[event.kind],
                )}
              >
                {EVENT_KIND_LABELS[event.kind]}
              </span>
              <span className="text-ink">
                {event.withPerson ? getPersonName(event.withPerson) : 'без співрозмовника'}
              </span>
            </>
          )}
          <span className="text-ink-faint text-[12px]">· {formatDate(day)}</span>
        </button>

        <button
          type="button"
          title="Прибрати запис"
          aria-label="Прибрати запис"
          onClick={onRemove}
          className="text-ink-faint hover:text-destructive grid size-6 shrink-0 cursor-pointer place-items-center rounded-full opacity-0 transition-colors group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {event.note ? (
        <p className="text-ink-soft line-clamp-2 pr-8 text-[12px]">{event.note}</p>
      ) : null}
    </li>
  );
};
