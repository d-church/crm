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
      {url && <AvatarPhoto key={url} url={url} />}
    </span>
  );
}

function AvatarPhoto({ url }: { url: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  if (status === 'error') return null;
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setStatus('loaded')}
      onError={() => setStatus('error')}
      className={cn('absolute inset-0 size-full object-cover', status !== 'loaded' && 'opacity-0')}
    />
  );
}
