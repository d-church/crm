import { useState } from 'react';

import { getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';

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
