import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { toDateInputValue } from '@/lib/format';
import { FollowUpState, PersonStatus, type Person } from '@/services';

import { useCreatePerson, useUpdatePerson, type PersonPayload } from './hooks';
import {
  FOLLOW_UP_LABELS,
  FOLLOW_UP_STATES,
  PERSON_STATUSES,
  PERSON_STATUS_HINTS,
  PERSON_STATUS_LABELS,
} from './status';

const optionalText = (max: number) => z.string().trim().max(max).optional();

const personSchema = z.object({
  firstName: z.string().trim().min(2, 'Мінімум 2 символи').max(50, 'Максимум 50 символів'),
  lastName: optionalText(50),
  status: z.enum(PERSON_STATUSES as [PersonStatus, ...PersonStatus[]]),
  followUp: z.enum(FOLLOW_UP_STATES as [FollowUpState, ...FollowUpState[]]),

  phone: optionalText(30),
  homePhone: optionalText(30),
  workPhone: optionalText(30),
  email: z.union([z.literal(''), z.string().email('Некоректний email')]).optional(),

  city: optionalText(80),
  address: optionalText(200),
  postalCode: optionalText(10),
  district: optionalText(80),
  region: optionalText(80),

  firstVisitAt: optionalText(10),
  lastSeenAt: optionalText(10),
  connectedBy: optionalText(80),
  nextStep: optionalText(120),
  community: optionalText(80),
  ministry: optionalText(80),
  responsible: optionalText(80),
  nextAction: optionalText(200),
  nextActionAt: optionalText(10),

  birthDate: optionalText(10),
  baptizedAt: optionalText(10),
  memberSince: optionalText(10),
  leftAt: optionalText(10),

  notes: optionalText(2000),
});

type PersonValues = z.infer<typeof personSchema>;

const EMPTY: PersonValues = {
  firstName: '',
  lastName: '',
  status: PersonStatus.NEW,
  followUp: FollowUpState.NOT_DONE,
  phone: '',
  homePhone: '',
  workPhone: '',
  email: '',
  city: '',
  address: '',
  postalCode: '',
  district: '',
  region: '',
  firstVisitAt: '',
  lastSeenAt: '',
  connectedBy: '',
  nextStep: '',
  community: '',
  ministry: '',
  responsible: '',
  nextAction: '',
  nextActionAt: '',
  birthDate: '',
  baptizedAt: '',
  memberSince: '',
  leftAt: '',
  notes: '',
};

const DATE_KEYS = [
  'firstVisitAt',
  'lastSeenAt',
  'nextActionAt',
  'birthDate',
  'baptizedAt',
  'memberSince',
  'leftAt',
] as const satisfies readonly (keyof PersonValues)[];

const DATE_KEY_SET = new Set<string>(DATE_KEYS);

/** Every text input needs a string, and every date input needs `YYYY-MM-DD`. */
const toValues = (person: Person): PersonValues =>
  Object.fromEntries(
    Object.entries(EMPTY).map(([key, fallback]) => {
      const value = person[key as keyof Person];

      if (value == null) return [key, fallback];

      return [key, DATE_KEY_SET.has(key) ? toDateInputValue(String(value)) : String(value)];
    }),
  ) as PersonValues;

/**
 * On create the API rejects empty strings (`email: ''` is not an email), so blanks
 * are dropped. On edit they have to be sent as `null` instead — dropping them
 * would silently keep the old value when someone deliberately cleared a field.
 */
const toPayload = (values: PersonValues, isEdit: boolean): PersonPayload =>
  Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value === '' ? null : value])
      .filter(([, value]) => isEdit || value !== null),
  );

type PersonDialogProps = {
  /** Omit to add someone new; pass a person to edit them. */
  person?: Person;
  children: ReactNode;
};

export const PersonDialog = ({ person, children }: PersonDialogProps) => {
  const isEdit = person !== undefined;
  const initial = person ? toValues(person) : EMPTY;

  const [isOpen, setIsOpen] = useState(false);
  const { createPerson, isPending: isCreating } = useCreatePerson();
  const { updatePerson, isPending: isUpdating } = useUpdatePerson(person?.id ?? '');
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonValues>({
    resolver: zodResolver(personSchema),
    defaultValues: initial,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toPayload(values, isEdit);

      if (isEdit) {
        await updatePerson(payload);
        toast.success('Зміни збережено');
      } else {
        await createPerson(payload);
        toast.success('Людину додано');
        reset(EMPTY);
      }

      setIsOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, isEdit ? 'Не вдалося зберегти' : 'Не вдалося додати людину'),
      );
    }
  });

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
            <Field label="Next Step" placeholder="зустріч для нових" {...register('nextStep')} />
            <Field label="Спільнота" placeholder="ще немає" {...register('community')} />
            <Field label="Служіння" {...register('ministry')} />
            <Field label="Відповідальний" {...register('responsible')} />
            <Field
              label="Наступна дія"
              placeholder="запросити на зустріч"
              {...register('nextAction')}
            />
            <Field label="Коли зробити" type="date" {...register('nextActionAt')} />
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
