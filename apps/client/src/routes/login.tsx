import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { meQueryOptions, useLogin } from '@/modules/auth';
import { sanitizeRedirect } from '@/lib/redirect';

const loginSchema = z.object({
  email: z.string().min(1, 'Вкажіть email').email('Некоректний email'),
  password: z.string().min(1, 'Вкажіть пароль'),
});

type LoginValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: sanitizeRedirect(search.redirect),
  }),
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions());

    if (user) {
      throw redirect({ to: search.redirect ?? '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);

      await navigate({ to: search.redirect ?? '/' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося увійти'));
    }
  });

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Вхід</CardTitle>
          <CardDescription>Увійдіть до панелі D.Church CRM</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@d.church"
              error={errors.email?.message}
              {...register('email')}
            />

            <Field
              label="Пароль"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Входимо…' : 'Увійти'}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              Немає акаунта?{' '}
              <Link to="/register" className="text-foreground underline underline-offset-4">
                Зареєструватися
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
