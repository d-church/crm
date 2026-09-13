import { z } from 'zod';

/** Matches PostgreSQL UUIDs, including legacy imported identifiers without an RFC version bit. */
export const DATABASE_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const databaseUuidSchema = z.string().regex(DATABASE_UUID_PATTERN, 'Некоректний UUID');
