import { createFileRoute, redirect } from '@tanstack/react-router';
import { KeyRound, Plus, Trash2, UsersRound } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import {
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate, getFullName } from '@/lib/format';
import {
  CreateUserDialog,
  DeleteUserDialog,
  USER_ROLE_LABELS,
  UserAccessDialog,
  useUsers,
  usersQueryOptions,
} from '@/modules/users';
import { UserRole, type User } from '@/services';

/**
 * Кого користувач бачить — одним рядком поруч з ролями. Суперадмін бачить усе
 * незалежно від областей, тож для нього їх кількість нічого не каже.
 */
const describeScopes = ({ roles, scopes }: User): string => {
  const own = roles ?? [];

  if (own.includes(UserRole.SUPERADMIN)) return 'уся база';
  if ((scopes ?? []).length > 0) return `областей: ${scopes!.length}`;

  return own.includes(UserRole.ADMIN) ? 'уся база' : 'лише підопічні';
};

export const Route = createFileRoute('/_app/users')({
  beforeLoad: ({ context }) => {
    if (context.user.role !== UserRole.SUPERADMIN) throw redirect({ to: '/' });
  },
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(usersQueryOptions());
  },
  component: UsersPage,
});

function UsersPage() {
  const { user: currentUser } = Route.useRouteContext();
  const { data: users = [], isPending, error } = useUsers();
  return (
    <>
      <PageHeader
        eyebrow="Адміністрування"
        title="Користувачі CRM"
        actions={
          <CreateUserDialog>
            <Button>
              <Plus />
              Додати користувача
            </Button>
          </CreateUserDialog>
        }
      />
      <section className="bg-card border-border overflow-hidden rounded-xl border">
        {error ? (
          <p className="text-destructive p-5 text-sm">{getApiErrorMessage(error)}</p>
        ) : isPending ? (
          <div className="grid gap-2 p-5">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <UsersRound className="text-muted-foreground size-6" />
            <span className="text-[14px]">Користувачів ще немає</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Користувач</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ролі й області</TableHead>
                <TableHead>Створено</TableHead>
                <TableHead className="w-14">
                  <span className="sr-only">Дії</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isCurrentUser = user.id === currentUser.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="grid gap-0.5">
                        <span className="text-[13.5px]">{getFullName(user)}</span>
                        {isCurrentUser ? (
                          <span className="text-ink-faint text-[11.5px]">Це ви</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-soft text-[13px]">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(user.roles ?? []).length === 0 ? (
                          <span className="text-destructive text-[12px]">Без доступу</span>
                        ) : (
                          (user.roles ?? []).map((role) => (
                            <Badge key={role} variant="secondary">
                              {USER_ROLE_LABELS[role]}
                            </Badge>
                          ))
                        )}
                        <span className="text-ink-faint text-[11.5px]">{describeScopes(user)}</span>
                        <UserAccessDialog user={user}>
                          <Button type="button" variant="outline" size="sm" className="ml-auto">
                            <KeyRound />
                            Доступи
                          </Button>
                        </UserAccessDialog>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-faint text-[12.5px]">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {isCurrentUser ? null : (
                        <DeleteUserDialog user={user}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            title="Видалити користувача"
                            aria-label={`Видалити ${getFullName(user)}`}
                          >
                            <Trash2 />
                          </Button>
                        </DeleteUserDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </>
  );
}
