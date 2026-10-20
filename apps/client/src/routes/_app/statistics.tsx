import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { PageHeader } from '@/components/layout';
import { getApiErrorMessage } from '@/lib/api-error';
import { ALL_SEGMENT, PeopleSegment } from '@/modules/people';
import { Bars, BigNumber, Share, StatCard, StatSkeleton } from '@/modules/statistics';
import { StatisticsService } from '@/services';

type Search = { segment?: string };

export const Route = createFileRoute('/_app/statistics')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    segment: typeof search.segment === 'string' ? search.segment : undefined,
  }),
  component: StatisticsPage,
});

/**
 * Цифри про церкву цілком. Сторінка навмисно не показує жодного імені: тут
 * питання «яка церква зараз», а не «що з конкретною людиною».
 *
 * Кожна цифра йде зі своїм знаменником. Середній вік, порахований по половині
 * карток, — це не середній вік церкви, і читач має бачити це одразу, а не
 * дізнаватися згодом.
 */
function StatisticsPage() {
  const { segment = ALL_SEGMENT } = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: stats,
    isPending,
    error,
  } = useQuery({
    queryKey: ['statistics', segment] as const,
    queryFn: () => StatisticsService.get(segment),
  });

  return (
    <>
      <PageHeader
        eyebrow="Церква"
        title="Статистика"
        description="Склад і рух церкви. Цифри рахуються в межах того, що вам видно."
      />

      <div className="mb-4">
        <PeopleSegment
          value={segment}
          onChange={(next) =>
            void navigate({
              search: next === ALL_SEGMENT ? {} : { segment: next },
              replace: true,
            })
          }
        />
      </div>

      {error ? (
        <p className="text-destructive text-[13px]">{getApiErrorMessage(error)}</p>
      ) : isPending || !stats ? (
        <StatSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <StatCard
            title="Середній вік"
            hint={`по ${stats.age.counted} з ${stats.active} активних`}
          >
            <div className="flex flex-wrap items-end gap-10">
              <BigNumber
                value={stats.age.average ?? '—'}
                unit={stats.age.average === null ? undefined : 'років'}
                note="середнє"
              />
              <BigNumber
                value={stats.age.median ?? '—'}
                unit={stats.age.median === null ? undefined : 'років'}
                note="медіана"
              />
            </div>
            {stats.age.ignored > 0 ? (
              <p className="text-ink-faint mt-3 text-[11.5px]">
                {stats.age.ignored} дат народження виглядають помилковими й не враховані
              </p>
            ) : null}
          </StatCard>

          <StatCard title="Вік по групах" hint="активні з датою народження">
            <Bars slices={stats.age.groups} />
          </StatCard>

          <StatCard title="Стать" hint="серед активних">
            <Bars slices={stats.gender} />
          </StatCard>

          <StatCard title="Статус у церкві" hint="серед активних">
            <Bars slices={stats.membership} />
          </StatCard>

          <StatCard title="Залученість" hint="серед активних">
            <div className="divide-border-subtle divide-y">
              <Share label="У служіннях" value={stats.engagement.inMinistry} of={stats.active} />
              <Share
                label="У домашніх групах"
                value={stats.engagement.inHomeGroup}
                of={stats.active}
              />
              <Share
                label="Мають попечителя"
                value={stats.engagement.withCaregiver}
                of={stats.active}
              />
            </div>
          </StatCard>

          <StatCard title="Рух за рік" hint="останні 12 місяців, разом з неактивними">
            {stats.filled.firstVisit === 0 ? (
              <p className="text-ink-faint mb-2 text-[11.5px]">
                Прихід рахується за датою першого візиту, а її не заповнено в жодній картці — тому
                нуль тут означає брак даних, а не брак людей.
              </p>
            ) : null}
            <div className="divide-border-subtle divide-y">
              <Row label="Прийшло людей" value={stats.year.arrived} />
              <Row label="Хрещень" value={stats.year.baptized} />
              <Row label="Прийнято в членство" value={stats.year.becameMembers} />
              <Row label="Вибуло з членства" value={stats.year.left} />
            </div>
          </StatCard>

          <StatCard title="Заповненість даних" hint="від неї залежить чесність цифр вище">
            <div className="divide-border-subtle divide-y">
              <Share label="Дата народження" value={stats.filled.birthDate} of={stats.active} />
              <Share label="Телефон" value={stats.filled.phone} of={stats.active} />
              <Share label="Спільнота" value={stats.filled.community} of={stats.active} />
              <Share label="Перший візит" value={stats.filled.firstVisit} of={stats.active} />
            </div>
          </StatCard>
        </div>
      )}
    </>
  );
}

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-baseline justify-between gap-3 py-1">
    <span className="text-[13px]">{label}</span>
    <span className="text-[13px] tabular-nums">{value}</span>
  </div>
);
