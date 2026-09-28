import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Textarea } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Person } from '@/services';

import { useSignalCaregiver } from './hooks';
import { SectionCard } from './section-card';

/**
 * Те, що бачить лідер команди замість пасторських секцій. Не «доступ заборонено»,
 * а робочий інструмент: сказати попечителю, що з людиною щось не так.
 */
export const PersonSignalCard = ({ person }: { person: Person }) => {
  const { signal, isPending } = useSignalCaregiver(person.id);
  const [note, setNote] = useState('');

  const send = async () => {
    try {
      await signal(note.trim());
      setNote('');
      toast.success('Передано попечителю');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося передати'));
    }
  };

  return (
    <SectionCard title="Передати попечителю">
      <p className="text-ink-faint text-[12.5px]">
        Нотатки, кроки й спілкування веде той, хто має опіку над людиною. Якщо бачите, що щось не
        так — напишіть йому.
      </p>

      <Textarea
        value={note}
        rows={3}
        maxLength={1000}
        placeholder="Наприклад: пропустив три репетиції поспіль, на дзвінки не відповідає"
        aria-label="Що передати попечителю"
        className="mt-2 text-[13px]"
        onChange={(event) => setNote(event.target.value)}
      />

      <Button
        type="button"
        size="sm"
        className="mt-2"
        disabled={note.trim().length < 3 || isPending}
        onClick={() => void send()}
      >
        <Send />
        Передати
      </Button>
    </SectionCard>
  );
};
