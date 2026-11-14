import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Image, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { PersonService, type Person } from '@/services';

import { PersonAvatar } from './person-avatar';
import { PEOPLE_LIST_KEY, PERSON_KEY } from './queries';

const INPUT_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

async function cropAvatar(source: string, area: Area): Promise<Blob> {
  const image = new window.Image();
  image.src = source;
  await image.decode();
  const size = Math.min(512, area.width, area.height);
  if (size < 1) throw new Error('Не вдалося обрізати фото');
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Не вдалося обрізати фото');
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Не вдалося підготувати фото'));
      },
      'image/webp',
      0.92,
    );
  });
}

export function PersonAvatarActions({ person, name }: { person: Person; name: string }) {
  const { id, avatarUrl } = person;
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<'view' | 'crop' | 'delete' | null>(null);
  const [source, setSource] = useState<string>();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area>();
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );

  function closeDialog() {
    setMode(null);
    setSource(undefined);
    setPreviewFailed(false);
  }

  const changeAvatar = useMutation({
    mutationFn: async (operation: 'save' | 'delete') => {
      if (operation === 'delete') return PersonService.removeAvatar(id);
      if (!source || !area) throw new Error('Оберіть область фото');
      return PersonService.replaceAvatar(id, await cropAvatar(source, area));
    },
    onSuccess: async (_, operation) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PEOPLE_LIST_KEY }),
        queryClient.invalidateQueries({ queryKey: [...PERSON_KEY, id] }),
      ]);
      toast.success(operation === 'delete' ? 'Фото видалено' : 'Фото збережено');
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Не вдалося змінити фото')),
  });

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!INPUT_FORMATS.includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.error('Оберіть фото JPEG, PNG або WebP до 10 МБ');
      return;
    }
    setSource(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(undefined);
    setMode('crop');
  }

  return (
    <div className="shrink-0">
      <input
        ref={input}
        type="file"
        accept={INPUT_FORMATS.join(',')}
        className="hidden"
        onChange={pickFile}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            ref={trigger}
            type="button"
            aria-label={avatarUrl ? 'Дії з фото' : 'Додати фото'}
            className="focus-visible:ring-ring relative block rounded-full focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <PersonAvatar name={name} url={avatarUrl} className="size-11 text-sm" />
            <span className="bg-card border-border absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border">
              <Camera className="size-3" />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {avatarUrl && (
            <DropdownMenuItem onSelect={() => setMode('view')}>
              <Image />
              Переглянути фото
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => input.current?.click()}>
            <Camera />
            {avatarUrl ? 'Замінити фото' : 'Додати фото'}
          </DropdownMenuItem>
          {avatarUrl && (
            <DropdownMenuItem onSelect={() => setMode('delete')}>
              <Trash2 />
              Видалити фото
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open && !changeAvatar.isPending) closeDialog();
        }}
      >
        {mode === 'view' && (
          <DialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle>Фото · {name}</DialogTitle>
              <DialogDescription>Аватарка людини</DialogDescription>
            </DialogHeader>
            {avatarUrl && !previewFailed ? (
              <img
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                onError={() => setPreviewFailed(true)}
                className="bg-muted mx-auto aspect-square w-full max-w-sm rounded-lg object-cover"
              />
            ) : (
              <p role="status">Не вдалося завантажити фото.</p>
            )}
          </DialogContent>
        )}
        {mode === 'crop' && source && (
          <DialogContent
            className="data-[state=open]:animate-none"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle>Обрізати фото</DialogTitle>
              <DialogDescription>
                Перетягніть фото або використайте стрілки, щоб розташувати обличчя в колі.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted relative aspect-square max-h-[45svh] w-full overflow-hidden rounded-lg">
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                maxZoom={3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                disableAutomaticStylesInjection
                onCropAreaChange={(_, pixels) => setArea(pixels)}
                mediaProps={{
                  alt: 'Фото для обрізання',
                  onError: () => {
                    toast.error('Не вдалося відкрити фото');
                    closeDialog();
                  },
                }}
              />
            </div>
            <label className="grid gap-2 text-sm">
              Масштаб
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(event.target.valueAsNumber)}
                className="accent-primary w-full"
              />
            </label>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={changeAvatar.isPending}>
                Скасувати
              </Button>
              <Button
                disabled={!area || changeAvatar.isPending}
                onClick={() => changeAvatar.mutate('save')}
              >
                {changeAvatar.isPending ? 'Зберігаємо…' : 'Зберегти фото'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
        {mode === 'delete' && (
          <DialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle>Видалити фото?</DialogTitle>
              <DialogDescription>
                Замість фото для {name} відображатимуться ініціали.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={changeAvatar.isPending}>
                Скасувати
              </Button>
              <Button
                variant="destructive"
                onClick={() => changeAvatar.mutate('delete')}
                disabled={changeAvatar.isPending}
              >
                {changeAvatar.isPending ? 'Видаляємо…' : 'Видалити фото'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
