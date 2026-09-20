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
import type { Community } from '@/services';

import { useDeleteCommunity } from './hooks';

type DeleteCommunityDialogProps = {
  community: Community;
  onDeleted?: () => void;
  children: ReactNode;
};

export const DeleteCommunityDialog = ({
  community,
  onDeleted,
  children,
}: DeleteCommunityDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteCommunity, isPending } = useDeleteCommunity();

  const onConfirm = async () => {
    try {
      await deleteCommunity(community.id);
      toast.success(`Спільноту «${community.name}» видалено`);
      setIsOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося видалити спільноту'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Видалити «{community.name}»?</DialogTitle>
          <DialogDescription>
            Спільноту буде видалено назавжди. Люди залишаться у базі, але їхнє членство в цій
            спільноті буде прибрано. Її служіння залишаться й перейдуть до «Інших».
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
