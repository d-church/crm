import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { PersonCombobox } from '@/components/person-combobox';
import { Button, Input, Select, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { usePersonChoices } from '@/modules/people';
import { ConnectService, getPersonName, type BoardPerson } from '@/services';

const BOARD_KEY = ['connect', 'board'] as const;

export const Route = createFileRoute('/_app/connect')({
  component: ConnectPage,
});

/**
 * Борда конекту. Задача команди — не губити нових людей у телеграмі й нотатках
 * телефону, тому додавання має бути коротшим за розмову: імʼя і захід.
 */
function ConnectPage() {
  const queryClient = useQueryClient();
  const {
    data: board = [],
    isPending,
    error,
  } = useQuery({ queryKey: BOARD_KEY, queryFn: () => ConnectService.board() });

  const refresh = () => queryClient.invalidateQueries({ queryKey: BOARD_KEY });

  return (
    <>
      <PageHeader
        eyebrow="Конект"
        title="Нові люди"
        description="Хто щойно прийшов і хто за ним іде далі. Після передачі в домашню групу людина сходить з борди."
      />

      <QuickAdd onAdded={() => void refresh()} />

      {error ? (
        <p className="text-destructive mt-4 text-[13px]">{getApiErrorMessage(error)}</p>
      ) : isPending ? (
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : board.length === 0 ? (
        <p className="text-ink-faint mt-4 text-[13px]">
          На борді нікого. Заведіть людину одразу після знайомства — інакше вона загубиться.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {board.map((person) => (
            <BoardRow key={person.id} person={person} onHandover={() => void refresh()} />
          ))}
        </ul>
      )}
    </>
  );
}

const QuickAdd = ({ onAdded }: { onAdded: () => void }) => {
  const { data: eventTypes = [] } = useQuery({
    queryKey: ['event-types'] as const,
    queryFn: () => ConnectService.eventTypes(),
  });
  const mutation = useMutation({ mutationFn: ConnectService.quickAdd.bind(ConnectService) });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');

  const isReady = firstName.trim().length >= 2 && eventTypeId !== '';

  const add = async () => {
    try {
      await mutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        eventTypeId,
      });
      setFirstName('');
      setLastName('');
      setPhone('');
      toast.success('Людину заведено, фолов-ап на вас');
      onAdded();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося завести людину'));
    }
  };

  return (
    <section className="bg-card border-border-muted rounded-xl border p-4">
      <h2 className="text-ink-faint mb-2 flex items-center gap-1.5 text-[12px] tracking-wide uppercase">
        <UserPlus className="size-4" />
        Нове знайомство
      </h2>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={firstName}
          maxLength={50}
          placeholder="Імʼя"
          aria-label="Імʼя"
          className="h-10"
          onChange={(event) => setFirstName(event.target.value)}
        />
        <Input
          value={lastName}
          maxLength={50}
          placeholder="Прізвище, якщо знаєте"
          aria-label="Прізвище"
          className="h-10"
          onChange={(event) => setLastName(event.target.value)}
        />
        <Select
          value={eventTypeId}
          aria-label="Де познайомились"
          className="h-10"
          onChange={(event) => setEventTypeId(event.target.value)}
        >
          <option value="">Де познайомились…</option>
          {eventTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
        <Input
          value={phone}
          maxLength={30}
          inputMode="tel"
          placeholder="Телефон, якщо дали"
          aria-label="Телефон"
          className="h-10"
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>

      <Button
        type="button"
        className="mt-2.5"
        disabled={!isReady || mutation.isPending}
        onClick={() => void add()}
      >
        <Plus />
        Завести
      </Button>

      <p className="text-ink-faint mt-2 text-[11.5px]">
        Дата й служитель підтягуються самі. Фолов-ап одразу стає на вас — його можна передати.
      </p>
    </section>
  );
};

const BoardRow = ({ person, onHandover }: { person: BoardPerson; onHandover: () => void }) => {
  const { data: choices = [] } = usePersonChoices();
  const [isHandingOver, setIsHandingOver] = useState(false);
  const mutation = useMutation({
    mutationFn: (caregiverId: string) => ConnectService.handover(person.id, caregiverId),
  });

  const care = person.careReceived[0];
  const event = person.events[0];
  const step = person.steps[0];

  const handover = async (caregiverId: string) => {
    if (!caregiverId) return;

    try {
      await mutation.mutateAsync(caregiverId);
      setIsHandingOver(false);
      toast.success('Передано колезі');
      onHandover();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося передати'));
    }
  };

  return (
    <li className="bg-card border-border-muted rounded-xl border px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[14px]">{getPersonName(person)}</span>
        {person.phone ? <span className="text-ink-soft text-[12.5px]">{person.phone}</span> : null}
        <span className="text-ink-faint text-[12px]">
          {event?.eventType?.name ?? 'знайомство'} · {formatDate(person.createdAt)}
        </span>
        {step ? (
          <span className="text-ink-faint text-[11.5px]">
            фолов-ап: {step.state === 'DONE' ? 'зроблено' : 'у роботі'}
          </span>
        ) : null}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-ink-soft text-[12.5px]">
          веде: {care ? getPersonName(care.caregiver) : 'нікого'}
        </span>
        {isHandingOver ? null : (
          <button
            type="button"
            onClick={() => setIsHandingOver(true)}
            className="text-ink-faint hover:text-foreground cursor-pointer text-[12px] transition-colors"
          >
            передати колезі
          </button>
        )}
      </div>

      {isHandingOver ? (
        <div className="mt-2 grid gap-1.5">
          <PersonCombobox
            id={`handover-${person.id}`}
            people={choices.filter(({ id }) => id !== person.id)}
            value=""
            ariaLabel="Кому передати"
            placeholder="Кому передати"
            emptyLabel="Не обрано"
            inputClassName="h-9 text-[13px]"
            onChange={(caregiverId) => void handover(caregiverId)}
          />
          <button
            type="button"
            onClick={() => setIsHandingOver(false)}
            className="text-ink-faint hover:text-foreground w-fit cursor-pointer text-[12px] transition-colors"
          >
            Скасувати
          </button>
        </div>
      ) : null}
    </li>
  );
};
