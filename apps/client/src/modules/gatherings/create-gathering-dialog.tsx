import { useState, type ReactNode } from 'react';
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
  Label,
  Select,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { useCommunities } from '@/modules/communities';
import { useHomeGroups } from '@/modules/home-groups';
import { useMinistries } from '@/modules/ministries';
import type { GatheringPayload, RepeatMode } from '@/services';

import { useCreateGathering, useGatheringTypes } from './hooks';

type ScopeKind = 'church' | 'homeGroup' | 'ministry' | 'community';

const SCOPE_LABELS: Record<ScopeKind, string> = {
  church: 'Уся церква',
  homeGroup: 'Домашня група',
  ministry: 'Служіння',
  community: 'Спільнота',
};

const REPEAT_LABELS: Record<RepeatMode, string> = {
  weekly: 'Щотижня',
  biweekly: 'Раз на два тижні',
  monthly: 'Щомісяця',
};

/**
 * Створення зібрання. Повторення тут не «правило», а генерація наперед: система
 * одразу створює потрібну кількість окремих зібрань, і кожне далі живе саме собою.
 */
export const CreateGatheringDialog = ({
  onCreated,
  children,
}: {
  onCreated: () => void;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: types = [] } = useGatheringTypes();
  const { data: communities = [] } = useCommunities();
  const { data: homeGroups = [] } = useHomeGroups();
  const { data: ministries = [] } = useMinistries();
  const { createGathering, isPending } = useCreateGathering();

  const [typeId, setTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [scope, setScope] = useState<ScopeKind>('homeGroup');
  const [targetId, setTargetId] = useState('');
  const [repeat, setRepeat] = useState<RepeatMode | ''>('');
  const [occurrences, setOccurrences] = useState(8);

  const targets =
    scope === 'homeGroup' ? homeGroups : scope === 'ministry' ? ministries : communities;

  const isReady = typeId !== '' && startsAt !== '' && (scope === 'church' || targetId !== '');

  const close = () => {
    setIsOpen(false);
    setTitle('');
    setStartsAt('');
    setRepeat('');
  };

  const submit = async () => {
    const payload: GatheringPayload = {
      typeId,
      startsAt: new Date(startsAt).toISOString(),
      title: title.trim() || null,
      ...(scope === 'church' ? {} : { [`${scope}Id`]: targetId }),
      ...(repeat === '' ? {} : { repeat, occurrences }),
    };

    try {
      const created = await createGathering(payload);

      toast.success(
        created.length === 1 ? 'Зібрання створено' : `Створено зібрань: ${created.length}`,
      );
      close();
      onCreated();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося створити зібрання'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : close())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle>Нове зібрання</DialogTitle>
          <DialogDescription>
            Загальноцерковне зібрання створює адміністратор, решту — той, кому довірена область.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="gathering-type">Вид</Label>
            <Select id="gathering-type" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Оберіть вид…</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="gathering-scope">Де</Label>
            <Select
              id="gathering-scope"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as ScopeKind);
                setTargetId('');
              }}
            >
              {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          {scope === 'church' ? null : (
            <div className="grid gap-1.5">
              <Label htmlFor="gathering-target">{SCOPE_LABELS[scope]}</Label>
              <Select
                id="gathering-target"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                <option value="">Оберіть…</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="gathering-starts">Коли</Label>
            <Input
              id="gathering-starts"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="gathering-title">Назва, якщо потрібна</Label>
            <Input
              id="gathering-title"
              value={title}
              maxLength={120}
              placeholder="Без назви показується вид зібрання"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="gathering-repeat">Повторювати</Label>
            <Select
              id="gathering-repeat"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as RepeatMode | '')}
            >
              <option value="">Одне зібрання</option>
              {Object.entries(REPEAT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            {repeat === '' ? null : (
              <>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={occurrences}
                  aria-label="Скільки зібрань створити"
                  onChange={(e) => setOccurrences(Number(e.target.value))}
                />
                <p className="text-ink-faint text-[11.5px]">
                  Створяться окремі зібрання — будь-яке можна перенести чи прибрати, не зачепивши
                  решту.
                </p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Скасувати
          </Button>
          <Button type="button" disabled={!isReady || isPending} onClick={() => void submit()}>
            {isPending ? 'Створюємо…' : 'Створити'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
