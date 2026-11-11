import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { AuthService } from '@/services';

const schema = z.object({ email: z.string().trim().email('Вкажіть коректний email') });

export const Route = createFileRoute('/forgot-password')({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    try {
      setMessage((await AuthService.forgotPassword(email)).message);
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Не вдалося надіслати запит') });
    }
  });

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Відновлення пароля</CardTitle>
          {!message && <CardDescription>Вкажіть email свого акаунта D.Church CRM.</CardDescription>}
        </CardHeader>
        <CardContent className="grid gap-4">
          {message ? (
            <p role="status" className="text-sm">
              {message}
            </p>
          ) : (
            <form onSubmit={submit} className="grid gap-4" noValidate>
              <Field
                label="Email"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              {errors.root?.message && (
                <p role="alert" className="text-destructive text-sm">
                  {errors.root.message}
                </p>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Надсилаємо…' : 'Надіслати посилання'}
              </Button>
            </form>
          )}
          <Link to="/login" className="text-primary justify-self-start text-sm hover:underline">
            До входу
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
