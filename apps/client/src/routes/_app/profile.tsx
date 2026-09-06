import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { PageHeader } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime, getFullName, getInitials } from '@/lib/format';
import { ME_QUERY_KEY, useAuth } from '@/modules/auth';
import { UserService, type User } from '@/services';

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Мінімум 2 символи').max(20, 'Максимум 20 символів'),
  lastName: z.string().trim().min(2, 'Мінімум 2 символи').max(20, 'Максимум 20 символів'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Вкажіть поточний пароль'),
    newPassword: z.string().min(8, 'Мінімум 8 символів'),
    confirmPassword: z.string().min(8, 'Мінімум 8 символів'),
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    message: 'Паролі не збігаються',
    path: ['confirmPassword'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { user: routeUser } = Route.useRouteContext();
  const { user: currentUser } = useAuth();
  const user = currentUser ?? routeUser;

  return (
    <>
      <PageHeader
        eyebrow="Акаунт"
        title="Профіль"
        description="Імʼя адміністратора, email і пароль для входу в CRM."
      />

      <section className="grid items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <ProfileSummary user={user} />

        <Card className="min-w-0 overflow-hidden">
          <ProfileForm user={user} />
          <PasswordForm />
        </Card>
      </section>
    </>
  );
}

function ProfileSummary({ user }: { user: User }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-border-muted border-b">
        <CardTitle className="flex items-center gap-2.5">
          <UserRound className="text-primary size-4.5" />
          Дані користувача
        </CardTitle>
        <CardDescription>Ці дані бачать інші адміністратори системи.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 pt-5">
        <div className="grid justify-items-center gap-3 text-center sm:flex sm:justify-start sm:text-left xl:grid xl:justify-items-start xl:text-left">
          <div className="bg-primary text-primary-foreground grid size-15 shrink-0 place-items-center rounded-full text-xl font-light">
            {getInitials(user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-light">{getFullName(user)}</p>
            <p className="text-ink-faint truncate text-[13px]">{user.email}</p>
          </div>
        </div>

        <dl className="border-border-muted grid gap-3 border-t pt-4 text-[13px]">
          <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)]">
            <dt className="text-ink-faint">Роль</dt>
            <dd className="text-foreground sm:text-right xl:text-left">
              {user.role === 'ADMIN' ? 'Адміністратор' : 'Суперадмін'}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)]">
            <dt className="text-ink-faint">Створено</dt>
            <dd className="text-foreground sm:text-right xl:text-left">
              {formatDateTime(user.createdAt)}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)]">
            <dt className="text-ink-faint">Оновлено</dt>
            <dd className="text-foreground sm:text-right xl:text-left">
              {formatDateTime(user.updatedAt)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function ProfileForm({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });

  const { mutateAsync: updateProfile, isPending } = useMutation({
    mutationFn: (values: ProfileValues) => UserService.updateProfile(values),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(ME_QUERY_KEY, updatedUser);
      reset({ firstName: updatedUser.firstName, lastName: updatedUser.lastName });
      toast.success('Профіль оновлено');
    },
  });

  useEffect(() => {
    reset({ firstName: user.firstName, lastName: user.lastName });
  }, [reset, user.firstName, user.lastName]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile(values);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося оновити профіль'));
    }
  });

  return (
    <section>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5">
          <ShieldCheck className="text-primary size-4.5" />
          Особисті дані
        </CardTitle>
        <CardDescription>Оновіть імʼя та прізвище, які показуються в системі.</CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit} noValidate>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
        </CardContent>

        <CardFooter className="border-border-muted justify-end border-t pt-5">
          <Button type="submit" disabled={isPending || !isDirty}>
            <Save />
            {isPending ? 'Зберігаємо…' : 'Зберегти'}
          </Button>
        </CardFooter>
      </form>
    </section>
  );
}

function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const { mutateAsync: changePassword, isPending } = useMutation({
    mutationFn: (values: PasswordValues) => UserService.changePassword(values),
    onSuccess: () => {
      reset();
      toast.success('Пароль змінено');
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword(values);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося змінити пароль'));
    }
  });

  return (
    <section className="border-border-muted border-t">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5">
          <KeyRound className="text-primary size-4.5" />
          Зміна пароля
        </CardTitle>
        <CardDescription>Введіть поточний пароль і підтвердьте новий пароль двічі.</CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit} noValidate>
        <CardContent className="grid gap-4">
          <div className="max-w-[520px]">
            <Field
              label="Поточний пароль"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Новий пароль"
              type="password"
              autoComplete="new-password"
              hint="Мінімум 8 символів"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Field
              label="Повторити пароль"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        </CardContent>

        <CardFooter className="border-border-muted justify-end border-t pt-5">
          <Button type="submit" disabled={isPending}>
            <KeyRound />
            {isPending ? 'Змінюємо…' : 'Змінити пароль'}
          </Button>
        </CardFooter>
      </form>
    </section>
  );
}
