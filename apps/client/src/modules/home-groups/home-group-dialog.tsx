import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
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
  Field,
  Label,
  Select,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';

import { homeGroupSchema, type HomeGroupValues } from './home-group-form';
import { useCreateHomeGroup } from './hooks';
import { HOME_GROUP_CATEGORIES, HOME_GROUP_CATEGORY_LABELS } from './category';

export const HomeGroupDialog = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { createHomeGroup, isPending } = useCreateHomeGroup();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HomeGroupValues>({
    resolver: zodResolver(homeGroupSchema),
    defaultValues: { name: '', category: 'YOUTH', address: '', leaderId: '' },
  });

  const onSubmit = handleSubmit(async ({ name, category, address }) => {
    try {
      await createHomeGroup({ name, category, address: address || null });
      toast.success('Домашню групу додано');
      reset();
      setIsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося додати домашню групу'));
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Нова домашня група</DialogTitle>
          <DialogDescription>Лідера можна призначити після створення.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          <Field label="Назва" autoFocus error={errors.name?.message} {...register('name')} />
          <div className="grid gap-1.5">
            <Label htmlFor="category">Категорія</Label>
            <Select id="category" {...register('category')}>
              {HOME_GROUP_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {HOME_GROUP_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          </div>
          <Field label="Адреса" error={errors.address?.message} {...register('address')} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Скасувати
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Додаємо…' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
