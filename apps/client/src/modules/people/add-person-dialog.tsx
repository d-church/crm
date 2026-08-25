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
import { PersonStatus } from '@/services';

import { useCreatePerson } from './hooks';
import { PERSON_STATUSES, PERSON_STATUS_LABELS } from './status';

const optionalText = (max: number) => z.string().trim().max(max).optional();

const personSchema = z.object({
  firstName: z.string().trim().min(2, 'Мінімум 2 символи').max(50, 'Максимум 50 символів'),
  lastName: optionalText(50),
  phone: optionalText(30),
  email: z.union([z.literal(''), z.string().email('Некоректний email')]).optional(),
  city: optionalText(80),
  status: z.enum([
    PersonStatus.GUEST,
    PersonStatus.NEW,
    PersonStatus.MEMBER,
    PersonStatus.SERVANT,
    PersonStatus.INACTIVE,
  ]),
  smallGroup: optionalText(80),
  ministry: optionalText(80),
  lastSeenAt: optionalText(10),
  notes: optionalText(2000),
});

type PersonValues = z.infer<typeof personSchema>;

const EMPTY: PersonValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  city: '',
  status: PersonStatus.GUEST,
  smallGroup: '',
  ministry: '',
  lastSeenAt: '',
  notes: '',
};

/** The API rejects empty strings for email — send only the fields actually filled in. */
const toPayload = (values: PersonValues) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value != null));

export const AddPersonDialog = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { createPerson, isPending } = useCreatePerson();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonValues>({
    resolver: zodResolver(personSchema),
    defaultValues: EMPTY,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createPerson(toPayload(values));

      toast.success('Людину додано');
      reset(EMPTY);
      setIsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося додати людину'));
    }
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setIsOpen(next);
        if (!next) reset(EMPTY);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Нова людина</DialogTitle>
          <DialogDescription>
            Заповніть те, що відомо — решту можна додати пізніше.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Імʼя" error={errors.firstName?.message} {...register('firstName')} />
            <Field label="Прізвище" error={errors.lastName?.message} {...register('lastName')} />
            <Field label="Телефон" placeholder="067 123 45 67" {...register('phone')} />
            <Field
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Field label="Місто" {...register('city')} />

            <div className="grid gap-1.5">
              <Label htmlFor="status">Статус</Label>
              <Select id="status" {...register('status')}>
                {PERSON_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PERSON_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>

            <Field label="Мала група" {...register('smallGroup')} />
            <Field label="Служіння" {...register('ministry')} />
            <Field label="Остання зустріч" type="date" {...register('lastSeenAt')} />
          </div>

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
              {isPending ? 'Зберігаємо…' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
