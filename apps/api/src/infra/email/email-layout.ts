import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getClientDistPath } from '@/bootstrap/client-app';

const ICON_FILENAME = 'apple-touch-icon.png';
const TEMPLATE_DIR = join(process.cwd(), '..', '..', 'email-templates');

async function loadIcon() {
  const bytes = await readFile(join(getClientDistPath(), ICON_FILENAME)).catch(() =>
    readFile(join(process.cwd(), '..', 'client', 'public', ICON_FILENAME)).catch(() => undefined),
  );
  return bytes && new Blob([new Uint8Array(bytes)], { type: 'image/png' });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export async function renderEmailLayout(
  template: string,
  title: string,
  values: Record<string, string>,
) {
  const [base, body, icon] = await Promise.all([
    readFile(join(TEMPLATE_DIR, 'base.html'), 'utf8'),
    readFile(join(TEMPLATE_DIR, template), 'utf8'),
    loadIcon(),
  ]);
  const content = body.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`Missing email template value: ${name}`);
    return escapeHtml(value);
  });
  const layout = icon ? base : base.replace(/<!-- icon:start -->[\s\S]*?<!-- icon:end -->/, '');
  const slots = { title: escapeHtml(title), content, iconFilename: ICON_FILENAME };
  const html = layout.replace(
    /\{\{(title|content|iconFilename)\}\}/g,
    (_, name: keyof typeof slots) => slots[name],
  );

  return { html, inline: icon && { name: ICON_FILENAME, data: icon } };
}
