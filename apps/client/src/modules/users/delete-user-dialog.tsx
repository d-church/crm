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
import { getFullName } from '@/lib/format';
import type { User } from '@/services';

import { useDeleteUser } from './hooks';

export const DeleteUserDialog = ({ user, children }: { user: User; children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteUser, isPending } = useDeleteUser();

  const onConfirm = async () => {
    try {
      await deleteUser(user.id);
      toast.success(`Користувача «${getFullName(user)}» видалено`);
      setIsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося видалити користувача'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Видалити «{getFullName(user)}»?</DialogTitle>
          <DialogDescription>Користувач одразу втратить доступ до CRM.</DialogDescription>
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
