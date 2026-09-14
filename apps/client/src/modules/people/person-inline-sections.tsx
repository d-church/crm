import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect, useMemo, type ReactNode } from 'react';
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Card, CardContent, Field, Label, Select, Textarea } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/format';
import { useCommunities } from '@/modules/communities';
import { useHomeGroups } from '@/modules/home-groups';
import type { Person } from '@/services';

import { useUpdatePerson } from './hooks';
import { CommunityCheckboxes } from './community-checkboxes';
import {
  personSchema,
  pickPersonValues,
  toPersonPayload,
  toPersonValues,
  type PersonField,
  type PersonValues,
} from './person-form';
import {
  FOLLOW_UP_LABELS,
  FOLLOW_UP_STATES,
  PERSON_STATUSES,
  PERSON_STATUS_HINTS,
  PERSON_STATUS_LABELS,
} from './status';

const MAIN_FIELDS = [
  'firstName',
  'lastName',
  'status',
  'followUp',
] as const satisfies readonly PersonField[];

const CONTACT_FIELDS = [
  'phone',
  'email',
  'homePhone',
  'workPhone',
  'city',
  'address',
  'postalCode',
  'district',
  'region',
] as const satisfies readonly PersonField[];

const JOURNEY_FIELDS = [
  'firstVisitAt',
  'lastSeenAt',
  'connectedBy',
  'nextStep',
  'communityIds',
  'homeGroupId',
  'ministry',
  'responsible',
  'nextAction',
  'nextActionAt',
] as const satisfies readonly PersonField[];

const DATE_FIELDS = [
  'birthDate',
  'baptizedAt',
  'memberSince',
  'leftAt',
] as const satisfies readonly PersonField[];

const NOTE_FIELDS = ['notes'] as const satisfies readonly PersonField[];

type SectionFields = {
  control: Control<PersonValues>;
  register: UseFormRegister<PersonValues>;
  errors: FieldErrors<PersonValues>;
};

type InlinePersonSectionProps = {
  person: Person;
  title: string;
  fields: readonly PersonField[];
  children: (form: SectionFields) => ReactNode;
};

const InlinePersonSection = ({ person, title, fields, children }: InlinePersonSectionProps) => {
  const initialValues = useMemo(() => toPersonValues(person), [person]);
  const { updatePerson, isPending } = useUpdatePerson(person.id);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PersonValues>({
    resolver: zodResolver(personSchema),
    defaultValues: initialValues,
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  // Keep saved sections current after another section is saved, but never erase a draft.
  useEffect(() => {
    if (!isDirty) reset(initialValues);
  }, [initialValues, isDirty, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updatedPerson = await updatePerson(
        toPersonPayload(pickPersonValues(values, fields), true),
      );

      reset(toPersonValues(updatedPerson));
      toast.success('Зміни збережено');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти'));
    }
  });

  return (
    <Card className="overflow-hidden">
      <form onSubmit={onSubmit} noValidate>
        <div className="border-border-muted flex items-center justify-between gap-4 border-b px-5 py-3.5">
          <span className="eyebrow text-muted-foreground">{title}</span>
          <Button type="submit" size="sm" disabled={!isDirty || isPending}>
            <Save />
            {isPending ? 'Зберігаємо…' : 'Зберегти'}
          </Button>
        </div>

        <CardContent className="p-5">{children({ control, register, errors })}</CardContent>
      </form>
    </Card>
  );
};

export const PersonInlineSections = ({ person }: { person: Person }) => {
  const { data: communities = [] } = useCommunities();
  const { data: homeGroups = [] } = useHomeGroups();

  return (
    <div className="grid max-w-5xl gap-5 lg:grid-cols-2 lg:items-start">
      <div className="grid gap-5">
        <InlinePersonSection person={person} title="Основне" fields={MAIN_FIELDS}>
          {({ register, errors }) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Імʼя" error={errors.firstName?.message} {...register('firstName')} />
              <Field label="Прізвище" error={errors.lastName?.message} {...register('lastName')} />

              <div className="grid gap-1.5">
                <Label htmlFor="status">Статус</Label>
                <Select id="status" {...register('status')}>
                  {PERSON_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PERSON_STATUS_LABELS[status]} — {PERSON_STATUS_HINTS[status]}
                    </option>
                  ))}
                </Select>
              </div>

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
            </div>
          )}
        </InlinePersonSection>

        <InlinePersonSection person={person} title="Шлях у церкві" fields={JOURNEY_FIELDS}>
          {({ control, register, errors }) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Перший візит"
                type="date"
                error={errors.firstVisitAt?.message}
                {...register('firstVisitAt')}
              />
              <Field
                label="Остання зустріч"
                type="date"
                error={errors.lastSeenAt?.message}
                {...register('lastSeenAt')}
              />
              <Field
                label="Connect"
                error={errors.connectedBy?.message}
                {...register('connectedBy')}
              />
              <Field label="Next Step" error={errors.nextStep?.message} {...register('nextStep')} />

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

              <Field label="Служіння" error={errors.ministry?.message} {...register('ministry')} />
              <Field
                label="Відповідальний"
                error={errors.responsible?.message}
                {...register('responsible')}
              />
              <Field
                label="Наступна дія"
                error={errors.nextAction?.message}
                {...register('nextAction')}
              />
              <Field
                label="Коли зробити"
                type="date"
                error={errors.nextActionAt?.message}
                {...register('nextActionAt')}
              />
            </div>
          )}
        </InlinePersonSection>
      </div>

      <div className="grid gap-5">
        <InlinePersonSection person={person} title="Контакти й адреса" fields={CONTACT_FIELDS}>
          {({ register, errors }) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Телефон"
                placeholder="067 123 45 67"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Field
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Field
                label="Домашній телефон"
                error={errors.homePhone?.message}
                {...register('homePhone')}
              />
              <Field
                label="Робочий телефон"
                error={errors.workPhone?.message}
                {...register('workPhone')}
              />
              <Field label="Місто" error={errors.city?.message} {...register('city')} />
              <Field
                label="Вулиця, будинок"
                error={errors.address?.message}
                {...register('address')}
              />
              <Field
                label="Індекс"
                error={errors.postalCode?.message}
                {...register('postalCode')}
              />
              <Field label="Район" error={errors.district?.message} {...register('district')} />
              <Field label="Область" error={errors.region?.message} {...register('region')} />
            </div>
          )}
        </InlinePersonSection>

        <InlinePersonSection person={person} title="Дати" fields={DATE_FIELDS}>
          {({ register, errors }) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Дата народження"
                type="date"
                error={errors.birthDate?.message}
                {...register('birthDate')}
              />
              <Field
                label="Водне хрещення"
                type="date"
                error={errors.baptizedAt?.message}
                {...register('baptizedAt')}
              />
              <Field
                label="Член церкви з"
                type="date"
                error={errors.memberSince?.message}
                {...register('memberSince')}
              />
              <Field
                label="Вибув з членства"
                type="date"
                error={errors.leftAt?.message}
                {...register('leftAt')}
              />
              <div className="border-border-subtle col-span-full border-t pt-4">
                <p className="eyebrow text-muted-foreground mb-1.5">Додано</p>
                <p className="text-[13.5px]">{formatDateTime(person.createdAt)}</p>
              </div>
            </div>
          )}
        </InlinePersonSection>

        <InlinePersonSection person={person} title="Нотатки" fields={NOTE_FIELDS}>
          {({ register, errors }) => (
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Нотатки</Label>
              <Textarea
                id="notes"
                rows={5}
                aria-invalid={Boolean(errors.notes)}
                {...register('notes')}
              />
              {errors.notes ? (
                <p className="text-destructive text-[11.5px]">{errors.notes.message}</p>
              ) : null}
            </div>
          )}
        </InlinePersonSection>
      </div>
    </div>
  );
};
