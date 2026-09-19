import { Bookmark, BookmarkPlus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PeopleFilter } from '@/services';

import { SavedFilterNameDialog } from './saved-filter-name-dialog';
import {
  isSameFilter,
  MAX_SAVED_FILTERS,
  useSavedPeopleFilters,
  validateSavedFilterName,
  type SavedPeopleFilter,
} from './saved-filters';

type SavedFiltersBarProps = {
  /** The conditions on screen right now. */
  current: PeopleFilter | undefined;
  /** Applies a set, or clears the filter when the active one is clicked again. */
  onApply: (filter: PeopleFilter | undefined) => void;
};

type NameDialogState = { mode: 'save' } | { mode: 'rename'; item: SavedPeopleFilter } | null;

const STORAGE_ERROR = 'Браузер не дозволив зберегти — можливо, увімкнено приватний режим';

/** Named sets of conditions, kept in this browser. */
export const SavedFiltersBar = ({ current, onApply }: SavedFiltersBarProps) => {
  const { saved, save, rename, replaceFilter, remove, restore } = useSavedPeopleFilters();
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null);

  const activeId = saved.find((item) => isSameFilter(item.filter, current))?.id;
  const canSave = Boolean(current) && !activeId && saved.length < MAX_SAVED_FILTERS;

  if (saved.length === 0 && !canSave) return null;

  const removeWithUndo = (item: SavedPeopleFilter) => {
    const index = saved.findIndex(({ id }) => id === item.id);

    if (!remove(item.id)) {
      toast.error(STORAGE_ERROR);
      return;
    }

    toast(`Фільтр «${item.name}» видалено`, {
      action: { label: 'Повернути', onClick: () => restore(item, index) },
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-ink-faint mr-1 flex items-center gap-1 text-[12px]">
        <Bookmark className="size-3.5" />
        Збережені
      </span>

      {saved.map((item) => {
        const isActive = item.id === activeId;

        return (
          <span
            key={item.id}
            className={cn(
              'flex max-w-full items-center rounded-full border text-[12.5px] transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input-border bg-card text-ink hover:border-foreground',
            )}
          >
            <button
              type="button"
              aria-pressed={isActive}
              title={isActive ? 'Натисніть, щоб зняти' : 'Застосувати'}
              onClick={() => onApply(isActive ? undefined : item.filter)}
              className="min-w-0 cursor-pointer truncate py-1 pr-1 pl-3"
            >
              {item.name}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Дії з фільтром «${item.name}»`}
                className={cn(
                  'grid size-6 shrink-0 cursor-pointer place-items-center rounded-full transition-colors',
                  isActive
                    ? 'text-primary-foreground/80 hover:text-primary-foreground'
                    : 'text-ink-faint hover:text-foreground',
                )}
              >
                <MoreHorizontal className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onSelect={() => setNameDialog({ mode: 'rename', item })}>
                  Перейменувати
                </DropdownMenuItem>
                {/* Only offered when there is something new on screen to store. */}
                {current && !isActive ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      if (!replaceFilter(item.id, current)) {
                        toast.error(STORAGE_ERROR);
                        return;
                      }

                      toast.success(`Фільтр «${item.name}» оновлено`);
                    }}
                  >
                    Замінити поточними умовами
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => removeWithUndo(item)}>
                  Видалити
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        );
      })}

      {canSave ? (
        <button
          type="button"
          onClick={() => setNameDialog({ mode: 'save' })}
          className="text-primary hover:text-primary-hover flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[12.5px] transition-colors"
        >
          <BookmarkPlus className="size-3.5" />
          Зберегти поточний
        </button>
      ) : null}

      <SavedFilterNameDialog
        open={nameDialog !== null}
        onOpenChange={(open) => {
          if (!open) setNameDialog(null);
        }}
        title={nameDialog?.mode === 'rename' ? 'Перейменувати фільтр' : 'Зберегти фільтр'}
        description={
          nameDialog?.mode === 'rename'
            ? 'Умови фільтра не зміняться.'
            : 'Умови фільтра збережуться в цьому браузері під цією назвою.'
        }
        initialName={nameDialog?.mode === 'rename' ? nameDialog.item.name : ''}
        submitLabel={nameDialog?.mode === 'rename' ? 'Перейменувати' : 'Зберегти'}
        validate={(name) =>
          validateSavedFilterName(
            name,
            saved,
            nameDialog?.mode === 'rename' ? nameDialog.item.id : undefined,
          )
        }
        onSubmit={(name) => {
          const isStored =
            nameDialog?.mode === 'rename'
              ? rename(nameDialog.item.id, name)
              : current && save(name, current);

          if (!isStored) toast.error(STORAGE_ERROR);
        }}
      />
    </div>
  );
};
