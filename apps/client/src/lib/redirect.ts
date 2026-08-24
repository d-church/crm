/**
 * Keeps post-login redirects on this origin — blocks open-redirect payloads.
 * Returns undefined for anything unusable so the `redirect` search param stays optional.
 */
export const sanitizeRedirect = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return undefined;
  }

  return value;
};
