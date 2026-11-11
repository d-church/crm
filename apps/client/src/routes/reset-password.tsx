import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, useLocation } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button, Card, CardContent, CardHeader, CardTitle, Field } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { useLogout } from '@/modules/auth';
import { AuthService } from '@/services';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Мінімум 8 символів'),
    confirmPassword: z.string().min(8, 'Мінімум 8 символів'),
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    path: ['confirmPassword'],
    message: 'Паролі не збігаються',
  });

export const Route = createFileRoute('/reset-password')({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const hash = useLocation({ select: (location) => location.hash });
  const token = new URLSearchParams(hash).get('token') ?? '';
  return <ResetPasswordForm key={token} token={token} />;
}

function ResetPasswordForm({ token }: { token: string }) {
  const navigate = Route.useNavigate();
  const { logoutAsync } = useLogout();
  const [rejected, setRejected] = useState(false);
  const invalid = rejected || !/^[A-Za-z0-9_-]{1,512}$/.test(token);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await AuthService.resetPassword({ token, ...values });
    } catch (error) {
      const message = getApiErrorMessage(error, 'Не вдалося змінити пароль');
      if (
        isAxiosError(error) &&
        error.response?.status === 400 &&
        message === 'Посилання недійсне або його термін дії минув'
      ) {
        setRejected(true);
      } else {
        setError('root', { message });
      }
      return;
    }

    await logoutAsync();
    await navigate({ to: '/login', replace: true });
    toast.success('Пароль змінено');
  });

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Новий пароль</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {invalid ? (
            <p role="alert" className="text-sm">
              Посилання недійсне або його термін дії минув.
            </p>
          ) : (
            <form onSubmit={submit} className="grid gap-4" noValidate>
              <Field
                label="Новий пароль"
                type="password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <Field
                label="Повторіть пароль"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              {errors.root?.message && (
                <p role="alert" className="text-destructive text-sm">
                  {errors.root.message}
                </p>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Зберігаємо…' : 'Змінити пароль'}
              </Button>
            </form>
          )}
          <Link
            to="/forgot-password"
            className="text-primary justify-self-start text-sm hover:underline"
          >
            Запросити нове посилання
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
