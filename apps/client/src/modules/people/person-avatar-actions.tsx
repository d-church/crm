import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from 'react';
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
  DialogTrigger,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
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
  const dropZone = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'upload' | 'crop' | 'delete' | null>(null);
  const [source, setSource] = useState<string>();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area>();
  const [previewFailed, setPreviewFailed] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );

  useEffect(() => {
    if (mode === 'upload') dropZone.current?.focus();
    if (mode === 'crop' || mode === 'delete') dialog.current?.focus();
  }, [mode]);

  function resetDialog(nextMode: 'upload' | null = null) {
    setMode(nextMode);
    setSource(undefined);
    setPreviewFailed(false);
    setDragging(false);
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
      resetDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Не вдалося змінити фото')),
  });

  function openCrop(file: Blob) {
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

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) openCrop(file);
  }

  function pasteFile(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = Array.from(event.clipboardData.files).find(({ type }) =>
      INPUT_FORMATS.includes(type),
    );
    if (file) openCrop(file);
    else toast.error('Скопіюйте зображення JPEG, PNG або WebP');
  }

  return (
    <Dialog
      open={mode !== null}
      onOpenChange={(open) => {
        if (open) setMode('upload');
        else if (!changeAvatar.isPending) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={avatarUrl ? 'Дії з фото' : 'Додати фото'}
          className="focus-visible:ring-ring relative block w-fit shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <PersonAvatar name={name} url={avatarUrl} className="size-11 text-sm" />
          <span className="bg-card border-border absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border">
            <Camera className="size-3" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent
        ref={dialog}
        onPaste={mode === 'upload' ? pasteFile : undefined}
        className={mode === 'crop' ? 'data-[state=open]:animate-none' : undefined}
      >
        {mode === 'upload' && (
          <>
            <DialogHeader className="pr-6">
              <DialogTitle>{avatarUrl ? `Фото · ${name}` : 'Додати фото'}</DialogTitle>
              <DialogDescription>JPEG, PNG або WebP до 10 МБ.</DialogDescription>
            </DialogHeader>
            {avatarUrl &&
              (previewFailed ? (
                <p role="status">Не вдалося завантажити фото.</p>
              ) : (
                <img
                  src={avatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  onError={() => setPreviewFailed(true)}
                  className="bg-muted mx-auto aspect-square w-full max-w-64 rounded-lg object-cover"
                />
              ))}
            <input
              ref={input}
              type="file"
              accept={INPUT_FORMATS.join(',')}
              className="hidden"
              onChange={pickFile}
            />
            <button
              ref={dropZone}
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(event) => {
                if (!event.dataTransfer.types.includes('Files')) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) openCrop(file);
              }}
              className={cn(
                'border-input-border bg-input hover:border-primary hover:bg-accent focus-visible:ring-ring grid w-full cursor-pointer justify-items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
                dragging && 'border-primary bg-accent',
              )}
            >
              <ImagePlus aria-hidden="true" className="text-primary pointer-events-none size-6" />
              <span className="pointer-events-none text-sm font-medium">
                Перетягніть фото або виберіть файл
              </span>
              <span className="text-ink-faint pointer-events-none text-xs">
                Вставити з буфера можна через Ctrl+V або ⌘V
              </span>
            </button>
            {avatarUrl && (
              <DialogFooter>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setMode('delete')}
                >
                  <Trash2 />
                  Видалити фото
                </Button>
              </DialogFooter>
            )}
          </>
        )}
        {mode === 'crop' && source && (
          <>
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
                    resetDialog('upload');
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
              <Button
                variant="outline"
                onClick={() => resetDialog('upload')}
                disabled={changeAvatar.isPending}
              >
                Скасувати
              </Button>
              <Button
                disabled={!area || changeAvatar.isPending}
                onClick={() => changeAvatar.mutate('save')}
              >
                {changeAvatar.isPending ? 'Зберігаємо…' : 'Зберегти фото'}
              </Button>
            </DialogFooter>
          </>
        )}
        {mode === 'delete' && (
          <>
            <DialogHeader>
              <DialogTitle>Видалити фото?</DialogTitle>
              <DialogDescription>
                Замість фото для {name} відображатимуться ініціали.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => resetDialog('upload')}
                disabled={changeAvatar.isPending}
              >
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
