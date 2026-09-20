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
import type { Ministry } from '@/services';

import { useDeleteMinistry } from './hooks';

export const DeleteMinistryDialog = ({
  ministry,
  onDeleted,
  children,
}: {
  ministry: Ministry;
  onDeleted?: () => void;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteMinistry, isPending } = useDeleteMinistry();
  const onConfirm = async () => {
    try {
      await deleteMinistry(ministry.id);
      toast.success(`Служіння «${ministry.name}» видалено`);
      setIsOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося видалити служіння'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Видалити «{ministry.name}»?</DialogTitle>
          <DialogDescription>
            Люди залишаться у базі, але більше не будуть учасниками цього служіння.
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
