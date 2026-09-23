import { createFileRoute } from '@tanstack/react-router';
import { ListChecks, ShieldCheck, Wrench } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { CatalogManager } from '@/components/catalog-manager';
import { PageHeader } from '@/components/layout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth';
import {
  churchRoleTypesQueryOptions,
  useChurchRoleTypeActions,
  useChurchRoleTypes,
} from '@/modules/church-roles';
import { stepTypesQueryOptions, useStepTypeActions, useStepTypes } from '@/modules/steps';
import { isActingAsSystem, setActingAsSystem, subscribeToSystemActor, UserRole } from '@/services';

export const Route = createFileRoute('/_app/admin')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(stepTypesQueryOptions(true));
    void context.queryClient.prefetchQuery(churchRoleTypesQueryOptions(true));
  },
  component: AdminPage,
});

const TABS = [
  { value: 'steps', label: 'Кроки зростання', icon: ListChecks },
  { value: 'church-roles', label: 'Сани', icon: ShieldCheck },
] as const;

type Tab = (typeof TABS)[number]['value'];

function AdminPage() {
  const [tab, setTab] = useState<Tab>('steps');

  return (
    <>
      <PageHeader
        eyebrow="Структура"
        title="Адміністрування"
        description="Довідники, з яких команда обирає значення в картках людей."
      />

      <div className="grid gap-4">
        <SystemActorToggle />

        <nav className="border-border-muted bg-card flex flex-wrap gap-1 rounded-xl border p-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-current={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors',
                tab === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-ink hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        {tab === 'steps' ? <StepsCatalog /> : <ChurchRolesCatalog />}
      </div>
    </>
  );
}

const StepsCatalog = () => {
  const { data: stepTypes = [], isPending, error } = useStepTypes(true);
  const { addType, updateType, reorderTypes, removeType } = useStepTypeActions();

  return (
    <CatalogManager
      items={stepTypes}
      isPending={isPending}
      error={error}
      placeholder="Новий крок, напр. «Курс для подружжя»"
      usageLabel={(count) => (count === 0 ? 'не призначений' : `у ${count} людей`)}
      hint="Крок, який комусь призначений, видалити не можна — заархівуйте його. Архівний крок не пропонується для нових людей, але лишається в їхніх картках."
      onAdd={addType}
      onUpdate={updateType}
      onReorder={reorderTypes}
      onRemove={removeType}
    />
  );
};

const ChurchRolesCatalog = () => {
  const { data: roleTypes = [], isPending, error } = useChurchRoleTypes(true);
  const { addType, updateType, reorderTypes, removeType } = useChurchRoleTypeActions();

  return (
    <CatalogManager
      items={roleTypes}
      isPending={isPending}
      error={error}
      placeholder="Новий сан, напр. «Єпископ»"
      usageLabel={(count) => (count === 0 ? 'нікому' : `у ${count} людей`)}
      hint="Сан, який комусь призначений, видалити не можна — заархівуйте його. Архівний сан не пропонується для нових призначень, але лишається в картках."
      onAdd={addType}
      onUpdate={updateType}
      onReorder={reorderTypes}
      onRemove={removeType}
    />
  );
};

/**
 * Масові правки зручніше підписувати системою, ніж собою: у журналі людини тоді
 * видно «D.Church CRM», а не імʼя того, хто саме натиснув кнопку імпорту.
 */
const SystemActorToggle = () => {
  const { user } = useAuth();
  const isEnabled = useSyncExternalStore(subscribeToSystemActor, isActingAsSystem, () => false);

  if (user?.role !== UserRole.SUPERADMIN) return null;

  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
        isEnabled ? 'border-primary bg-primary/5' : 'border-border-muted bg-card',
      )}
    >
      <input
        type="checkbox"
        checked={isEnabled}
        className="accent-primary mt-0.5 size-4"
        onChange={(event) => {
          setActingAsSystem(event.target.checked);
          toast.success(
            event.target.checked
              ? 'Операції підписуються як D.Church CRM'
              : 'Операції знову підписуються вашим імʼям',
          );
        }}
      />

      <span className="grid gap-0.5">
        <span className="flex items-center gap-2 text-[13.5px]">
          <Wrench className="text-ink-faint size-4" />
          Операції від імені системи
        </span>
        <span className="text-ink-faint text-[12px]">
          У журналі людей замість вашого імені буде «D.Church CRM». Зручно для імпорту й масових
          правок. Діє лише у цьому браузері й лише для суперадмінів.
        </span>
      </span>
    </label>
  );
};
