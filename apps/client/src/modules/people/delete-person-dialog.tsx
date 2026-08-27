import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { getPersonName, type Person } from '@/services';

import { useDeletePerson } from './hooks';

type DeletePersonDialogProps = {
  person: Person;
  /** Called after a successful delete — the detail page uses it to navigate away. */
  onDeleted?: () => void;
  children: ReactNode;
};

export const DeletePersonDialog = ({ person, onDeleted, children }: DeletePersonDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { deletePerson, isPending } = useDeletePerson();

  const name = getPersonName(person);

  const onConfirm = async () => {
    try {
      await deletePerson(person.id);

      toast.success(`${name} видалений з бази`);
      setIsOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося видалити'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Видалити {name}?</DialogTitle>
          <DialogDescription>
            Картку буде видалено назавжди разом з нотатками та історією — відновити не вийде.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Скасувати
            </Button>
          </DialogClose>

          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Видаляємо…' : 'Видалити'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
