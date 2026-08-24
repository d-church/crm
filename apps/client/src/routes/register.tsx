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
import { meQueryOptions, useRegister } from '@/modules/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Мінімум 2 символи').max(20, 'Максимум 20 символів'),
  email: z.string().min(1, 'Вкажіть email').email('Некоректний email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export const Route = createFileRoute('/register')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions());

    if (user) {
      throw redirect({ to: '/' });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = Route.useNavigate();
  const { register: registerUser, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values);

      await navigate({ to: '/' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зареєструватися'));
    }
  });

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Реєстрація</CardTitle>
          <CardDescription>Створіть акаунт адміністратора</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4" noValidate>
            <Field
              label="Імʼя"
              autoComplete="name"
              placeholder="Ада Лавлейс"
              error={errors.name?.message}
              {...register('name')}
            />

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
              autoComplete="new-password"
              placeholder="••••••••"
              hint="Мінімум 8 символів"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? 'Створюємо…' : 'Створити акаунт'}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              Вже є акаунт?{' '}
              <Link to="/login" className="text-foreground underline underline-offset-4">
                Увійти
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
