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
import type { HomeGroup } from '@/services';

import { useDeleteHomeGroup } from './hooks';

export const DeleteHomeGroupDialog = ({
  homeGroup,
  onDeleted,
  children,
}: {
  homeGroup: HomeGroup;
  onDeleted?: () => void;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteHomeGroup, isPending } = useDeleteHomeGroup();
  const onConfirm = async () => {
    try {
      await deleteHomeGroup(homeGroup.id);
      toast.success(`Домашню групу «${homeGroup.name}» видалено`);
      setIsOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося видалити домашню групу'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Видалити «{homeGroup.name}»?</DialogTitle>
          <DialogDescription>
            Люди залишаться у базі, але більше не будуть учасниками цієї домашньої групи.
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
