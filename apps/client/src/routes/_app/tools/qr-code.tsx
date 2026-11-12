import { createFileRoute } from '@tanstack/react-router';
import { Download, QrCode, RotateCw } from 'lucide-react';
import { create } from 'qrcode';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { PageHeader } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  Label,
  Select,
  Textarea,
} from '@/components/ui';

export const Route = createFileRoute('/_app/tools/qr-code')({
  component: QrCodePage,
});

const formats = {
  '5:4': { width: 1350, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '3:2': { width: 1620, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
};

const maxQrInputLength = 7089;
const quietZone = 4;

function QrCodePage() {
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<keyof typeof formats>('1:1');
  const [isPortrait, setIsPortrait] = useState(false);
  const [background, setBackground] = useState('#ffffff');
  const [foreground, setForeground] = useState('#000000');
  const [caption, setCaption] = useState('');
  const [exportFailed, setExportFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { width: formatWidth, height: formatHeight } = formats[format];
  const width = isPortrait ? formatHeight : formatWidth;
  const height = isPortrait ? formatWidth : formatHeight;
  const hasContent = Boolean(content.trim());

  const modules = useMemo(() => {
    if (!hasContent || content.length > maxQrInputLength) return null;

    try {
      return create(content).modules;
    } catch {
      return null;
    }
  }, [content, hasContent]);

  const error =
    (background === foreground && 'Оберіть різні кольори для тла й QR-коду.') ||
    (hasContent && !modules && 'Цей текст завеликий для одного QR-коду.');
  const canDownload = Boolean(modules && !error);

  useLayoutEffect(() => {
    if (!canDownload || !modules) return;

    const context = canvas.current?.getContext('2d');
    if (!context) return;

    const label = caption.trim();
    const padding = 64;
    const captionHeight = label ? 108 : 0;
    const codeHeight = height - captionHeight;
    const moduleCount = modules.size + quietZone * 2;
    const moduleSize = Math.floor((Math.min(width, codeHeight) - padding * 2) / moduleCount);
    const codeSize = moduleSize * moduleCount;
    const left = Math.floor((width - codeSize) / 2) + quietZone * moduleSize;
    const top = Math.floor((codeHeight - codeSize) / 2) + quietZone * moduleSize;

    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = foreground;

    for (let row = 0; row < modules.size; row++) {
      for (let column = 0; column < modules.size; column++) {
        if (modules.get(row, column)) {
          context.fillRect(
            left + column * moduleSize,
            top + row * moduleSize,
            moduleSize,
            moduleSize,
          );
        }
      }
    }

    if (label) {
      context.font = '600 48px system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, width / 2, codeHeight, width - padding * 2);
    }
  }, [background, canDownload, caption, foreground, height, modules, width]);

  const download = () => {
    if (!canDownload || !canvas.current) return;

    setExportFailed(false);
    canvas.current.toBlob((blob) => {
      if (!blob) {
        setExportFailed(true);
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr-code.png';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  return (
    <>
      <PageHeader title="QR-коди" />
      <div className="grid max-w-6xl items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Налаштування</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="qr-content">Посилання або текст</Label>
              <Textarea
                id="qr-content"
                rows={3}
                spellCheck={false}
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="qr-format">Пропорції зображення</Label>
              <Select
                id="qr-format"
                value={format}
                onChange={(event) => {
                  setFormat(event.target.value as keyof typeof formats);
                  setIsPortrait(false);
                }}
              >
                {Object.keys(formats).map((ratio) => (
                  <option key={ratio}>{ratio}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="qr-background"
                label="Колір тла"
                type="color"
                className="w-16 cursor-pointer px-1.5"
                hint={background.toUpperCase()}
                value={background}
                onChange={(event) => setBackground(event.target.value)}
              />
              <Field
                id="qr-foreground"
                label="Колір QR-коду"
                type="color"
                className="w-16 cursor-pointer px-1.5"
                hint={foreground.toUpperCase()}
                value={foreground}
                onChange={(event) => setForeground(event.target.value)}
              />
            </div>
            <Field
              id="qr-caption"
              label="Підпис (необов’язково)"
              maxLength={80}
              spellCheck={false}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            />
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <CardTitle>Попередній перегляд</CardTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-ink-soft text-xs tabular-nums">
                {width} × {height} пікс.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={isPortrait}
                disabled={format === '1:1'}
                onClick={() => setIsPortrait((portrait) => !portrait)}
              >
                <RotateCw aria-hidden />
                Перевернути
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted border-border-muted grid min-h-56 min-w-0 place-items-center rounded-lg border p-3 sm:p-5">
              <canvas
                ref={canvas}
                width={width}
                height={height}
                hidden={!canDownload}
                role="img"
                aria-label="Попередній перегляд QR-коду"
                className="border-border h-auto max-h-[min(60vh,560px)] w-auto max-w-full rounded-md border"
              />
              {!canDownload && (
                <div className="text-ink-soft grid justify-items-center gap-3 px-3 text-center text-sm">
                  <QrCode className="text-primary size-10" aria-hidden />
                  <p>
                    {error ? 'Перевірте налаштування QR-коду.' : 'Введіть посилання або текст.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-border-muted flex-wrap gap-3 border-t pt-4">
            <Button type="button" disabled={!canDownload} onClick={download}>
              <Download aria-hidden />
              Завантажити PNG
            </Button>
            {canDownload && exportFailed && (
              <p role="alert" className="text-destructive text-sm">
                Не вдалося зберегти PNG. Спробуйте ще раз.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
