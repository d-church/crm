import { queryOptions } from '@tanstack/react-query';

import { StepService } from '@/services';

export const STEP_TYPES_KEY = ['step-types'] as const;

export const stepTypesQueryOptions = (includeArchived = false) =>
  queryOptions({
    queryKey: [...STEP_TYPES_KEY, { includeArchived }] as const,
    queryFn: () => StepService.types(includeArchived),
    // Довідник змінюється рідко, тож не перезапитуємо його на кожен фокус.
    staleTime: 5 * 60 * 1000,
  });
