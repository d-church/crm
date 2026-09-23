import { queryOptions } from '@tanstack/react-query';

import { ChurchRoleService } from '@/services';

export const CHURCH_ROLE_TYPES_KEY = ['church-role-types'] as const;

export const churchRoleTypesQueryOptions = (includeArchived = false) =>
  queryOptions({
    queryKey: [...CHURCH_ROLE_TYPES_KEY, { includeArchived }] as const,
    queryFn: () => ChurchRoleService.types(includeArchived),
    // Довідник санів змінюється раз на рік, тож не перезапитуємо його на кожен фокус.
    staleTime: 5 * 60 * 1000,
  });
