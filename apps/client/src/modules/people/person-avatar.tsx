import * as Tooltip from '@radix-ui/react-tooltip';
import { useState, type ReactElement } from 'react';

import { getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';

export function PersonAvatarPreview({
  name,
  url,
  children,
}: {
  name: string;
  url?: string | null;
  children: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string>();
  const hasPreview = !!url && failedUrl !== url;

  return (
    <Tooltip.Root open={hasPreview && open} onOpenChange={(next) => setOpen(hasPreview && next)}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      {hasPreview && (
        <Tooltip.Portal>
          <Tooltip.Content
            aria-label={`Збільшене фото · ${name}`}
            side="right"
            sideOffset={10}
            collisionPadding={12}
            className="bg-card border-border z-50 rounded-xl border p-1 shadow-lg"
          >
            <img
              src={url}
              alt={name}
              referrerPolicy="no-referrer"
              onError={() => {
                setFailedUrl(url);
                setOpen(false);
              }}
              className="bg-muted size-[min(16rem,70vw,70svh)] rounded-lg object-cover"
            />
          </Tooltip.Content>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );
}

export function PersonAvatar({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e6ece5] text-[11.5px] text-[#3f4a43]',
        className,
      )}
    >
      {getInitials(name)}
      {url && <AvatarPhoto url={url} />}
    </span>
  );
}

function AvatarPhoto({ url }: { url: string }) {
  const [loadedUrl, setLoadedUrl] = useState<string>();
  // A renewed signed URL can take time to load even when the photo itself is unchanged.
  const sources = loadedUrl && loadedUrl !== url ? [loadedUrl, url] : [url];

  return sources.map((src) => (
    <img
      key={src}
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onLoad={() => {
        if (src === url) setLoadedUrl(src);
      }}
      className={cn('absolute inset-0 size-full object-cover', src !== loadedUrl && 'opacity-0')}
    />
  ));
}
