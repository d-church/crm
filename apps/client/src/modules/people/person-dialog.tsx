import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Label,
  Select,
  Textarea,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { useCommunities } from '@/modules/communities';
import { useHomeGroups } from '@/modules/home-groups';
import { useMinistries } from '@/modules/ministries';
import { useTrainings } from '@/modules/trainings';
import type { Person } from '@/services';

import { useCreatePerson, useUpdatePerson } from './hooks';
import { CommunityCheckboxes } from './community-checkboxes';
import { MinistryAssignmentsField } from './ministry-assignments-field';
import { TrainingCheckboxes } from './training-checkboxes';
import { PERSON_GENDERS, PERSON_GENDER_LABELS } from './gender';
import {
  EMPTY_PERSON_VALUES,
  personSchema,
  toPersonPayload,
  toPersonValues,
  type PersonValues,
} from './person-form';
import {
  FOLLOW_UP_LABELS,
  FOLLOW_UP_STATES,
  ACTIVITY_LABELS,
  ACTIVITY_STATES,
  CARE_LABEL,
  MEMBERSHIP_HINTS,
  MEMBERSHIP_LABELS,
  MEMBERSHIP_STATUSES,
} from './status';

type PersonDialogProps = {
  /** Omit to add someone new; pass a person to edit them. */
  person?: Person;
  children: ReactNode;
};

export const PersonDialog = ({ person, children }: PersonDialogProps) => {
  const isEdit = person !== undefined;
  const initial = person ? toPersonValues(person) : EMPTY_PERSON_VALUES;

  const [isOpen, setIsOpen] = useState(false);
  const { createPerson, isPending: isCreating } = useCreatePerson();
  const { updatePerson, isPending: isUpdating } = useUpdatePerson(person?.id ?? '');
  const { data: communities = [] } = useCommunities();
  const { data: homeGroups = [] } = useHomeGroups();
  const { data: ministries = [] } = useMinistries();
  const { data: trainings = [] } = useTrainings();
  const isPending = isCreating || isUpdating;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonValues>({
    resolver: zodResolver(personSchema),
    defaultValues: initial,
  });

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        const payload = toPersonPayload(values, isEdit);

        if (isEdit) {
          await updatePerson(payload);
          toast.success('Зміни збережено');
        } else {
          await createPerson(payload);
          toast.success('Людину додано');
          reset(EMPTY_PERSON_VALUES);
        }

        setIsOpen(false);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, isEdit ? 'Не вдалося зберегти' : 'Не вдалося додати людину'),
        );
      }
    },
    // Без цього невалідне поле поза межами видимої частини форми просто нічого не робить.
    (invalid) =>
      toast.error(
        Object.values(invalid)
          .map((error) => error?.message)
          .filter(Boolean)
          .join('; ') || 'Перевірте заповнені поля',
      ),
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setIsOpen(next);
        // Opening always starts from the saved data, never a half-finished edit.
        reset(initial);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редагувати людину' : 'Нова людина'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Порожнє поле очистить значення.'
              : 'Заповніть те, що відомо — решту можна додати пізніше.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          <FormSection title="Основне">
            <Field label="Імʼя" error={errors.firstName?.message} {...register('firstName')} />
            <Field label="Прізвище" error={errors.lastName?.message} {...register('lastName')} />

            <div className="grid gap-1.5">
              <Label htmlFor="gender">Стать</Label>
              <Select id="gender" {...register('gender')}>
                <option value="">Не вказано</option>
                {PERSON_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {PERSON_GENDER_LABELS[gender]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="membership">Статус</Label>
              <Select id="membership" {...register('membership')}>
                {MEMBERSHIP_STATUSES.map((membership) => (
                  <option key={membership} value={membership}>
                    {MEMBERSHIP_LABELS[membership]} — {MEMBERSHIP_HINTS[membership]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="activity">Активність</Label>
              <Select id="activity" {...register('activity')}>
                {ACTIVITY_STATES.map((activity) => (
                  <option key={activity} value={activity}>
                    {ACTIVITY_LABELS[activity]}
                  </option>
                ))}
              </Select>
            </div>

            <label className="border-input-border hover:bg-accent flex min-h-11 items-center gap-2 self-end rounded-md border px-3 text-[13px] transition-colors">
              <input
                type="checkbox"
                className="accent-primary size-3.5"
                {...register('careNeeded')}
              />
              {CARE_LABEL}
            </label>

            <div className="grid gap-1.5">
              <Label htmlFor="followUp">Follow-up</Label>
              <Select id="followUp" {...register('followUp')}>
                {FOLLOW_UP_STATES.map((state) => (
                  <option key={state} value={state}>
                    {FOLLOW_UP_LABELS[state]}
                  </option>
                ))}
              </Select>
            </div>
          </FormSection>

          <FormSection title="Контакти">
            <Field label="Телефон" placeholder="067 123 45 67" {...register('phone')} />
            <Field
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Field label="Домашній телефон" {...register('homePhone')} />
            <Field label="Робочий телефон" {...register('workPhone')} />
          </FormSection>

          <FormSection title="Адреса">
            <Field label="Місто" {...register('city')} />
            <Field label="Вулиця, будинок" {...register('address')} />
            <Field label="Індекс" placeholder="79019" {...register('postalCode')} />
            <Field label="Район" {...register('district')} />
            <Field label="Область" {...register('region')} />
          </FormSection>

          <FormSection title="Шлях у церкві">
            <Field label="Перший візит" type="date" {...register('firstVisitAt')} />
            <Field label="Остання зустріч" type="date" {...register('lastSeenAt')} />
            <Field
              label="Connect"
              placeholder="хто вийшов на контакт"
              {...register('connectedBy')}
            />
            <CommunityCheckboxes
              communities={communities}
              register={register}
              error={errors.communityIds?.message}
            />
            <Controller
              control={control}
              name="homeGroupId"
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor="homeGroupId">Домашня група</Label>
                  <Select
                    id="homeGroupId"
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? ''}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                  >
                    <option value="">Немає</option>
                    {homeGroups.map((homeGroup) => (
                      <option key={homeGroup.id} value={homeGroup.id}>
                        {homeGroup.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            />
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
            <Field label="Відповідальний" {...register('responsible')} />
          </FormSection>

          <FormSection title="Дати">
            <Field label="Дата народження" type="date" {...register('birthDate')} />
            <Field label="Водне хрещення" type="date" {...register('baptizedAt')} />
            <Field label="Член церкви з" type="date" {...register('memberSince')} />
            <Field label="Вибув з членства" type="date" {...register('leftAt')} />
          </FormSection>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Нотатки</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Скасувати
              </Button>
            </DialogClose>

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Зберігаємо…' : isEdit ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="grid gap-4">
    <legend className="eyebrow text-muted-foreground mb-3">{title}</legend>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </fieldset>
);
