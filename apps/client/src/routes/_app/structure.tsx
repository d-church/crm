import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/layout';
import { Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useCommunities } from '@/modules/communities';
import { useHomeGroups } from '@/modules/home-groups';
import { useMinistries } from '@/modules/ministries';
import { useTrainings } from '@/modules/trainings';
import { getPersonName, StructureKind, StructureService } from '@/services';

const TABS: { kind: StructureKind; label: string }[] = [
  { kind: StructureKind.COMMUNITY, label: 'Спільноти' },
  { kind: StructureKind.HOME_GROUP, label: 'Домашні групи' },
  { kind: StructureKind.MINISTRY, label: 'Служіння' },
  { kind: StructureKind.TRAINING, label: 'Навчання' },
];

export const Route = createFileRoute('/_app/structure')({
  component: StructurePage,
});

/**
 * Церква цілком: хто де задіяний. Тут навмисно немає переходу в картки —
 * структура відповідає на питання «де людина вже є», а не «що про неї відомо».
 */
function StructurePage() {
  const [kind, setKind] = useState<StructureKind>(StructureKind.HOME_GROUP);

  const { data: communities = [], isPending: loadingCommunities } = useCommunities();
  const { data: homeGroups = [], isPending: loadingGroups } = useHomeGroups();
  const { data: ministries = [], isPending: loadingMinistries } = useMinistries();
  const { data: trainings = [], isPending: loadingTrainings } = useTrainings();

  const entities =
    kind === StructureKind.COMMUNITY
      ? communities
      : kind === StructureKind.HOME_GROUP
        ? homeGroups
        : kind === StructureKind.MINISTRY
          ? ministries
          : trainings;

  const isPending =
    kind === StructureKind.COMMUNITY
      ? loadingCommunities
      : kind === StructureKind.HOME_GROUP
        ? loadingGroups
        : kind === StructureKind.MINISTRY
          ? loadingMinistries
          : loadingTrainings;

  return (
    <>
      <PageHeader
        eyebrow="Церква"
        title="Структура"
        description="Хто де задіяний. Картки тут не відкриваються — для цього потрібна область або опіка."
      />

      <div className="border-input-border mb-4 inline-flex flex-wrap rounded-full border p-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            aria-pressed={kind === tab.kind}
            onClick={() => setKind(tab.kind)}
            className={cn(
              'cursor-pointer rounded-full px-3 py-1 text-[12.5px] transition-colors',
              kind === tab.kind
                ? 'bg-primary text-primary-foreground'
                : 'text-ink-faint hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : entities.length === 0 ? (
        <p className="text-ink-faint text-[13px]">Тут поки нічого немає</p>
      ) : (
        <div className="grid gap-2">
          {entities.map((entity) => (
            <EntityCard key={entity.id} kind={kind} id={entity.id} name={entity.name} />
          ))}
        </div>
      )}
    </>
  );
}

const EntityCard = ({ kind, id, name }: { kind: StructureKind; id: string; name: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Імена тягнемо лише коли картку розгорнули: їх багато, а дивляться рідко.
  const {
    data: people = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['structure', kind, id, 'people'] as const,
    queryFn: () => StructureService.peopleOf(kind, id),
    enabled: isOpen,
  });

  return (
    <section className="bg-card border-border-muted rounded-xl border">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-[14px]">{name}</span>
        <ChevronDown
          className={cn('text-ink-faint size-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen ? (
        <div className="border-border-subtle border-t px-4 py-3">
          {error ? (
            <p className="text-destructive text-[12.5px]">{getApiErrorMessage(error)}</p>
          ) : isPending ? (
            <Skeleton className="h-5" />
          ) : people.length === 0 ? (
            <p className="text-ink-faint text-[12.5px]">Учасників немає</p>
          ) : (
            <ul className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <li key={person.id} className="text-ink-soft truncate text-[13px]">
                  {getPersonName(person)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
};
