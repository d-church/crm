import { createFileRoute, redirect } from '@tanstack/react-router';
import { Plus, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import {
  Badge,
  Button,
  Select,
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
  useUpdateUserRole,
  useUsers,
  usersQueryOptions,
} from '@/modules/users';
import { UserRole, type UserRole as UserRoleType } from '@/services';

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
  const { updateUserRole, isPending: isUpdatingRole } = useUpdateUserRole();

  const onRoleChange = async (id: string, role: UserRoleType) => {
    try {
      await updateUserRole({ id, role });
      toast.success('Роль оновлено');
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, 'Не вдалося оновити роль'));
    }
  };

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
                <TableHead>Роль</TableHead>
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
                      {isCurrentUser ? (
                        <Badge variant="secondary">{USER_ROLE_LABELS[user.role]}</Badge>
                      ) : (
                        <Select
                          aria-label={`Роль ${getFullName(user)}`}
                          value={user.role}
                          disabled={isUpdatingRole}
                          className="h-9 min-w-36 text-[12.5px]"
                          onChange={(event) =>
                            void onRoleChange(user.id, event.target.value as UserRoleType)
                          }
                        >
                          {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
                            <option key={role} value={role}>
                              {label}
                            </option>
                          ))}
                        </Select>
                      )}
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
