import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useCommunities } from '@/modules/communities';
import { useHomeGroups } from '@/modules/home-groups';
import { useMinistries } from '@/modules/ministries';
import { useTrainings } from '@/modules/trainings';
import { MinistryRole, type Person } from '@/services';

import { CommunityCheckboxes } from './community-checkboxes';
import { useUpdatePerson } from './hooks';
import { MinistryAssignmentsField } from './ministry-assignments-field';
import { MINISTRY_ROLE_BADGES, MINISTRY_ROLE_LABELS } from './ministry-roles';
import { SectionCard } from './section-card';
import {
  personSchema,
  pickPersonValues,
  toPersonPayload,
  toPersonValues,
  type PersonValues,
} from './person-form';
import { TrainingCheckboxes } from './training-checkboxes';

const RELATION_FIELDS = ['communityIds', 'homeGroupId', 'ministries', 'trainingIds'] as const;

const describeInvalid = (errors: FieldErrors<PersonValues>): string => {
  const problems = Object.entries(errors)
    .map(([field, error]) => error?.message ?? field)
    .filter(Boolean);

  return problems.length > 0
    ? `Не вдалося зберегти: ${problems.join('; ')}`
    : 'Не вдалося зберегти: перевірте заповнені поля';
};

/**
 * Участь людини в житті церкви: спільноти, домашня група, служіння з ролями,
 * навчання. Читається як список звʼязків, редагується одним діалогом.
 */
export const PersonChurchLifeSection = ({ person }: { person: Person }) => {
  const [isEditing, setIsEditing] = useState(false);

  const hasAnything =
    person.communities.length > 0 ||
    person.homeGroup !== null ||
    person.ministryAssignments.length > 0 ||
    person.trainings.length > 0;

  return (
    <>
      <SectionCard
        title="Церковне життя"
        action={
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-ink-faint hover:text-foreground flex cursor-pointer items-center gap-1 text-[12px] transition-colors"
          >
            <Pencil className="size-3" />
            {hasAnything ? 'Змінити' : 'Додати'}
          </button>
        }
      >
        {hasAnything ? (
          <div className="grid gap-2.5">
            <Row label="Спільноти">
              {person.communities.length === 0 ? null : (
                <span className="flex flex-wrap gap-x-2 gap-y-1">
                  {person.communities.map((community) => (
                    <Link
                      key={community.id}
                      to="/communities/$communityId"
                      params={{ communityId: community.id }}
                      className="text-ink underline-offset-3 hover:underline"
                    >
                      {community.name}
                    </Link>
                  ))}
                </span>
              )}
            </Row>

            <Row label="Домашня група">
              {person.homeGroup ? (
                <Link
                  to="/home-groups/$homeGroupId"
                  params={{ homeGroupId: person.homeGroup.id }}
                  className="text-ink underline-offset-3 hover:underline"
                >
                  {person.homeGroup.name}
                </Link>
              ) : null}
            </Row>

            <Row label="Служіння">
              {person.ministryAssignments.length === 0 ? null : (
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {person.ministryAssignments.map(({ id, ministry, role }) => (
                    <span key={id} className="flex items-center gap-1">
                      <Link
                        to="/ministries/$ministryId"
                        params={{ ministryId: ministry.id }}
                        className="text-ink underline-offset-3 hover:underline"
                      >
                        {ministry.name}
                      </Link>
                      {role === MinistryRole.MEMBER ? null : (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10.5px] leading-none',
                            MINISTRY_ROLE_BADGES[role],
                          )}
                        >
                          {MINISTRY_ROLE_LABELS[role]}
                        </span>
                      )}
                    </span>
                  ))}
                </span>
              )}
            </Row>

            <Row label="Навчання">
              {person.trainings.length === 0 ? null : (
                <span className="text-ink">
                  {person.trainings.map(({ name }) => name).join(', ')}
                </span>
              )}
            </Row>
          </div>
        ) : (
          <p className="text-ink-faint text-[12.5px]">
            Ще ніде не бере участі. Додайте спільноту, групу чи служіння.
          </p>
        )}
      </SectionCard>

      {isEditing ? <ChurchLifeDialog person={person} onClose={() => setIsEditing(false)} /> : null}
    </>
  );
};

/** Порожній звʼязок просто не показуємо — рядок зникає разом зі значенням. */
const Row = ({ label, children }: { label: string; children: ReactNode }) =>
  children === null ? null : (
    <div className="grid gap-0.5 text-[13px] sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] sm:items-baseline sm:gap-3">
      <span className="text-ink-faint text-[12px]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );

const ChurchLifeDialog = ({ person, onClose }: { person: Person; onClose: () => void }) => {
  const { data: communities = [] } = useCommunities();
  const { data: homeGroups = [] } = useHomeGroups();
  const { data: ministries = [] } = useMinistries();
  const { data: trainings = [] } = useTrainings();
  const { updatePerson, isPending } = useUpdatePerson(person.id);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonValues>({
    resolver: zodResolver(personSchema),
    defaultValues: toPersonValues(person),
  });

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        await updatePerson(toPersonPayload(pickPersonValues(values, RELATION_FIELDS), true));
        toast.success('Зміни збережено');
        onClose();
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Не вдалося зберегти'));
      }
    },
    // Помилка в полі, якого немає в діалозі, інакше просто нічого б не сталося.
    (invalid) => toast.error(describeInvalid(invalid)),
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <DialogHeader className="pr-8">
            <DialogTitle>Церковне життя</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <CommunityCheckboxes
              communities={communities}
              register={register}
              error={errors.communityIds?.message}
            />

            <div className="grid gap-1.5">
              <Label htmlFor="homeGroupId">Домашня група</Label>
              <Select id="homeGroupId" {...register('homeGroupId')}>
                <option value="">Не призначено</option>
                {homeGroups.map((homeGroup) => (
                  <option key={homeGroup.id} value={homeGroup.id}>
                    {homeGroup.name}
                  </option>
                ))}
              </Select>
            </div>

            <Controller
              control={control}
              name="ministries"
              render={({ field }) => (
                <MinistryAssignmentsField
                  ministries={ministries}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.ministries?.message}
                />
              )}
            />

            <TrainingCheckboxes
              trainings={trainings}
              register={register}
              error={errors.trainingIds?.message}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Зберігаємо…' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
