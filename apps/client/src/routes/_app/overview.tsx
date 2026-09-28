import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { CakeSlice, CircleAlert, HeartHandshake, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { PageHeader } from '@/components/layout';
import { Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { getPersonName, OverviewService, type PersonChoice } from '@/services';

export const Route = createFileRoute('/_app/overview')({
  component: OverviewPage,
});

/**
 * Робоче місце лідера. Весь список людей церкви йому не потрібен: потрібні ті,
 * за кого він відповідає, і те, що з ними треба зробити найближчим часом.
 */
function OverviewPage() {
  const {
    data: overview,
    isPending,
    error,
  } = useQuery({ queryKey: ['overview'] as const, queryFn: () => OverviewService.get() });

  if (error) {
    return <p className="text-destructive text-[13px]">{getApiErrorMessage(error)}</p>;
  }

  return (
    <>
      <PageHeader eyebrow="Огляд" title="Найближче до роботи" />

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {overview.gaps ? (
            <Card title="Дірки" icon={<CircleAlert className="size-4" />} className="sm:col-span-2">
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <Gap value={overview.gaps.withoutCaregiver} label="без попечителя" />
                <Gap value={overview.gaps.stuckOnBoard} label="висять на борді понад два тижні" />
              </div>
            </Card>
          ) : null}

          <Card
            title={`Мої підопічні${overview.wards.length > 0 ? ` · ${overview.wards.length}` : ''}`}
            icon={<HeartHandshake className="size-4" />}
          >
            <PeopleList
              people={overview.wards}
              empty="Підопічних поки немає. Попечителя призначає пастор або адміністратор."
            />
          </Card>

          <Card title="Мої команди" icon={<Users className="size-4" />}>
            {overview.teams.length === 0 ? (
              <Empty>Областей не довірено</Empty>
            ) : (
              <ul className="grid gap-1">
                {overview.teams.map((team) => (
                  <li key={`${team.kind}-${team.id}`} className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-[13px]">{team.name}</span>
                    <span className="text-ink-faint text-[12px]">{team.peopleCount}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Потребують уваги" icon={<HeartHandshake className="size-4" />}>
            <PeopleList people={overview.needsAttention} empty="Нікого не позначено" />
          </Card>

          <Card title="Прострочені кроки" icon={<CircleAlert className="size-4" />}>
            {overview.overdueSteps.length === 0 ? (
              <Empty>Нічого не прострочено</Empty>
            ) : (
              <ul className="grid gap-1">
                {overview.overdueSteps.map((step) => (
                  <li key={step.id} className="grid">
                    <PersonLink person={step.person} />
                    <span className="text-destructive text-[11.5px]">
                      {step.step} · до {formatDate(step.dueAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Дні народження цього тижня" icon={<CakeSlice className="size-4" />}>
            {overview.birthdays.length === 0 ? (
              <Empty>Цього тижня немає</Empty>
            ) : (
              <ul className="grid gap-1">
                {overview.birthdays.map((person) => (
                  <li key={person.id} className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate">
                      <PersonLink person={person} />
                    </span>
                    <span className="text-ink-faint text-[12px]">
                      {formatDate(person.birthDate).slice(0, 5)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

const Card = ({
  title,
  icon,
  className,
  children,
}: {
  title: string;
  icon: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <section className={`bg-card border-border-muted rounded-xl border p-4 ${className ?? ''}`}>
    <h2 className="text-ink-faint mb-2 flex items-center gap-1.5 text-[12px] tracking-wide uppercase">
      {icon}
      {title}
    </h2>
    {children}
  </section>
);

/** Дірку показуємо числом: нуль тут — теж відповідь, і добра. */
const Gap = ({ value, label }: { value: number; label: string }) => (
  <span className="grid">
    <span className={value > 0 ? 'text-destructive text-[20px]' : 'text-ink text-[20px]'}>
      {value}
    </span>
    <span className="text-ink-faint text-[11.5px]">{label}</span>
  </span>
);

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="text-ink-faint text-[12.5px]">{children}</p>
);

const PeopleList = ({ people, empty }: { people: PersonChoice[]; empty: string }) =>
  people.length === 0 ? (
    <Empty>{empty}</Empty>
  ) : (
    <ul className="grid gap-1">
      {people.map((person) => (
        <li key={person.id}>
          <PersonLink person={person} />
        </li>
      ))}
    </ul>
  );

/** Тут перехід у картку доречний: це люди, за яких користувач відповідає. */
const PersonLink = ({ person }: { person: PersonChoice }) => (
  <Link
    to="/people/$personId"
    params={{ personId: person.id }}
    className="hover:text-primary text-[13px] transition-colors"
  >
    {getPersonName(person)}
  </Link>
);
