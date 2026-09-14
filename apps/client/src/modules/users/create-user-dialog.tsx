import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
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
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { UserRole } from '@/services';

import { useCreateUser } from './hooks';
import { createUserSchema, USER_ROLE_LABELS, type CreateUserValues } from './user-form';

const EMPTY_VALUES: CreateUserValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: UserRole.ADMIN,
};

export const CreateUserDialog = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { createUser, isPending } = useCreateUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: EMPTY_VALUES,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createUser(values);
      toast.success('Користувача додано');
      reset(EMPTY_VALUES);
      setIsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося додати користувача'));
    }
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setIsOpen(next);
        if (next) reset(EMPTY_VALUES);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новий користувач</DialogTitle>
          <DialogDescription>Користувач отримає доступ до CRM з обраною роллю.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field
              label="Імʼя"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Field
              label="Прізвище"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field
              label="Пароль"
              type="password"
              autoComplete="new-password"
              hint="Мінімум 8 символів"
              error={errors.password?.message}
              {...register('password')}
            />
            <Field
              label="Повторити пароль"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="role">Роль</Label>
            <Select id="role" className="w-full" {...register('role')}>
              {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Скасувати
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Додаємо…' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
