import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { getPersonName, PersonService, type BulkPeoplePayload } from '@/services';

import { usePersonChoices } from './hooks';
import { PEOPLE_QUERY_KEY } from './queries';

/** Скільки знайдених показуємо: далі список перестає допомагати й починає заважати. */
const MAX_RESULTS = 40;

type AddPeopleDialogProps = {
  /** Куди саме додаємо — та сама дія, що й у масових операціях над списком. */
  action: Extract<BulkPeoplePayload['action'], 'ministry' | 'community' | 'homeGroup' | 'training'>;
  targetId: string;
  title: string;
  /** Кого вже додано: їх не пропонуємо вдруге. */
  excludeIds?: string[];
  children: ReactNode;
};

/**
 * Додати людей зі сторінки самого служіння, групи чи навчання. Раніше це
 * вимагало піти в список людей, відфільтрувати, відмітити й застосувати масову
 * дію — шлях, який з картки команди не видно взагалі.
 */
export const AddPeopleDialog = ({
  action,
  targetId,
  title,
  excludeIds = [],
  children,
}: AddPeopleDialogProps) => {
  const queryClient = useQueryClient();
  const { data: choices = [] } = usePersonChoices();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const normalized = query.trim().toLocaleLowerCase('uk-UA');

  const matches = useMemo(
    () =>
      choices
        .filter(
          (person) =>
            !excluded.has(person.id) &&
            getPersonName(person).toLocaleLowerCase('uk-UA').includes(normalized),
        )
        .slice(0, MAX_RESULTS),
    [choices, excluded, normalized],
  );

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setPicked(new Set());
  };

  const toggle = (id: string) =>
    setPicked((current) => {
      const next = new Set(current);

      if (!next.delete(id)) next.add(id);

      return next;
    });

  const add = async () => {
    setIsSaving(true);

    try {
      const { affected } = await PersonService.bulk({
        personIds: [...picked],
        action,
        targetId,
        mode: 'add',
      });

      await queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY });
      toast.success(`Додано людей: ${affected}`);
      close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося додати'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : close())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Знайдіть людей за імʼям і відмітьте тих, кого додати.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="text-ink-faint pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            autoFocus
            value={query}
            placeholder="Пошук людини"
            aria-label="Пошук людини"
            className="pl-10"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="max-h-72 overflow-y-auto">
          {normalized.length === 0 && picked.size === 0 ? (
            <p className="text-ink-faint px-1 py-3 text-[12.5px]">Введіть імʼя або прізвище</p>
          ) : matches.length === 0 ? (
            <p className="text-ink-faint px-1 py-3 text-[12.5px]">Нікого не знайдено</p>
          ) : (
            <ul className="grid">
              {matches.map((person) => (
                <li key={person.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px]',
                      picked.has(person.id) ? 'bg-accent' : 'hover:bg-accent/60',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={picked.has(person.id)}
                      className="accent-primary size-3.5 cursor-pointer"
                      onChange={() => toggle(person.id)}
                    />
                    {getPersonName(person)}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Скасувати
          </Button>
          <Button type="button" disabled={picked.size === 0 || isSaving} onClick={() => void add()}>
            {isSaving ? 'Додаємо…' : `Додати${picked.size > 0 ? ` (${picked.size})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
