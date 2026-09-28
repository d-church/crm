import { Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { PersonCombobox } from '@/components/person-combobox';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Select,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { getFullName } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCommunities } from '@/modules/communities';
import { useHomeGroups } from '@/modules/home-groups';
import { useMinistries } from '@/modules/ministries';
import { usePersonChoices } from '@/modules/people';
import { useTrainings } from '@/modules/trainings';
import { UserRole, type ScopePayload, type User, type UserScope } from '@/services';

import {
  useAddUserScope,
  useLinkUserPerson,
  useRemoveUserScope,
  useUpdateUserRoles,
} from './hooks';
import { USER_ROLE_HINTS, USER_ROLE_LABELS, USER_ROLES } from './user-form';

type ScopeKind = 'community' | 'homeGroup' | 'ministry' | 'training';

const SCOPE_LABELS: Record<ScopeKind, string> = {
  community: 'Спільнота',
  homeGroup: 'Домашня група',
  ministry: 'Служіння',
  training: 'Навчання',
};

/** Яку сутність показує область — видно з того, яке посилання заповнене. */
const describeScope = (scope: UserScope): string => {
  const entries: [ScopeKind, { name: string } | null][] = [
    ['community', scope.community],
    ['homeGroup', scope.homeGroup],
    ['ministry', scope.ministry],
    ['training', scope.training],
  ];
  const found = entries.find(([, value]) => value !== null);

  return found ? `${SCOPE_LABELS[found[0]]} · ${found[1]!.name}` : 'Невідома область';
};

/**
 * Доступи одного користувача: ролі, звʼязок з людиною і області відповідальності.
 * Три різні речі, але дивляться на них разом — саме з них складається те,
 * що людина побачить у системі.
 */
export const UserAccessDialog = ({ user, children }: { user: User; children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle>Доступи · {getFullName(user)}</DialogTitle>
          <DialogDescription>
            Роль каже, що людина вміє робити. Область і опіка кажуть, кого вона при цьому бачить.
          </DialogDescription>
        </DialogHeader>

        <RolesSection user={user} />
        <PersonSection user={user} />
        <ScopesSection user={user} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Готово
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RolesSection = ({ user }: { user: User }) => {
  const { updateRoles, isPending } = useUpdateUserRoles();
  const roles = user.roles ?? [];

  const toggle = async (role: (typeof USER_ROLES)[number]) => {
    const next = roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role];

    try {
      await updateRoles({ id: user.id, roles: next });
      toast.success('Ролі оновлено');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося оновити ролі'));
    }
  };

  return (
    <section className="grid gap-2">
      <Label>Ролі</Label>
      {USER_ROLES.map((role) => (
        <label
          key={role}
          className={cn(
            'border-border-muted flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2',
            roles.includes(role) && 'border-primary/40 bg-accent',
          )}
        >
          <input
            type="checkbox"
            checked={roles.includes(role)}
            disabled={isPending}
            className="accent-primary mt-0.5 size-3.5 cursor-pointer"
            onChange={() => void toggle(role)}
          />
          <span className="grid gap-0.5">
            <span className="text-[13px]">{USER_ROLE_LABELS[role]}</span>
            <span className="text-ink-faint text-[11.5px]">{USER_ROLE_HINTS[role]}</span>
          </span>
        </label>
      ))}
      {roles.length === 0 ? (
        <p className="text-destructive text-[12px]">
          Без жодної ролі користувач не бачить нічого — це відсутність доступу, а не помилка.
        </p>
      ) : null}
    </section>
  );
};

const PersonSection = ({ user }: { user: User }) => {
  const { data: choices = [] } = usePersonChoices();
  const { linkPerson } = useLinkUserPerson();

  const link = async (personId: string) => {
    try {
      await linkPerson({ id: user.id, personId: personId || null });
      toast.success(personId ? 'Звʼязок збережено' : 'Звʼязок розірвано');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти звʼязок'));
    }
  };

  return (
    <section className="grid gap-1.5">
      <PersonCombobox
        id={`user-person-${user.id}`}
        label="Ким є в базі людей"
        people={choices}
        value={user.personId ?? ''}
        placeholder="Пошук людини"
        emptyLabel="Не повʼязано"
        onChange={(personId) => void link(personId)}
      />
      <p className="text-ink-faint text-[11.5px]">
        Звідси беруться підопічні: без цього звʼязку опіка не працює.
      </p>
    </section>
  );
};

const ScopesSection = ({ user }: { user: User }) => {
  const scopes = user.scopes ?? [];
  const { addScope, isPending } = useAddUserScope();
  const { removeScope } = useRemoveUserScope();
  const [kind, setKind] = useState<ScopeKind>('homeGroup');

  const { data: communities = [] } = useCommunities();
  const { data: homeGroups = [] } = useHomeGroups();
  const { data: ministries = [] } = useMinistries();
  const { data: trainings = [] } = useTrainings();

  const options: { id: string; name: string }[] =
    kind === 'community'
      ? communities
      : kind === 'homeGroup'
        ? homeGroups
        : kind === 'ministry'
          ? ministries
          : trainings;

  const add = async (targetId: string) => {
    if (!targetId) return;

    const payload: ScopePayload = { [`${kind}Id`]: targetId };

    try {
      await addScope({ id: user.id, ...payload });
      toast.success('Область додано');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося додати область'));
    }
  };

  const remove = async (scopeId: string) => {
    try {
      await removeScope({ id: user.id, scopeId });
      toast.success('Область прибрано');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося прибрати область'));
    }
  };

  return (
    <section className="grid gap-2">
      <Label>Області відповідальності</Label>

      {scopes.length === 0 ? (
        <p className="text-ink-faint text-[12px]">
          {user.roles?.includes(UserRole.ADMIN)
            ? 'Без областей адміністратор бачить усю базу.'
            : 'Областей немає — користувач бачить лише своїх підопічних.'}
        </p>
      ) : (
        <ul className="divide-border-subtle divide-y">
          {scopes.map((scope) => (
            <li key={scope.id} className="flex items-center gap-2 py-1.5">
              <span className="flex-1 text-[13px]">{describeScope(scope)}</span>
              <button
                type="button"
                title="Прибрати область"
                aria-label={`Прибрати область ${describeScope(scope)}`}
                onClick={() => void remove(scope.id)}
                className="text-ink-faint hover:text-destructive cursor-pointer transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Select
          value={kind}
          aria-label="Тип області"
          className="h-9 w-40 text-[13px]"
          onChange={(event) => setKind(event.target.value as ScopeKind)}
        >
          {Object.entries(SCOPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value=""
          disabled={isPending || options.length === 0}
          aria-label="Що довірити"
          className="h-9 min-w-[10rem] flex-1 text-[13px]"
          onChange={(event) => void add(event.target.value)}
        >
          <option value="">Додати…</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </Select>
      </div>
    </section>
  );
};
