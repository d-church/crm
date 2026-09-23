import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PEOPLE_QUERY_KEY } from '@/modules/people/queries';
import { ChurchRoleService, type ChurchRolePayload, type ChurchRoleTypePayload } from '@/services';

import { CHURCH_ROLE_TYPES_KEY, churchRoleTypesQueryOptions } from './queries';

export const useChurchRoleTypes = (includeArchived = false) =>
  useQuery(churchRoleTypesQueryOptions(includeArchived));

/** Сан видно і в картці людини, і в списках, тож оновлюємо обидві гілки. */
const useInvalidation = (withCatalog = false) => {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY }),
      ...(withCatalog ? [queryClient.invalidateQueries({ queryKey: CHURCH_ROLE_TYPES_KEY })] : []),
    ]);
  };
};

export const usePersonChurchRoles = (personId: string) => {
  const invalidate = useInvalidation();

  const { mutateAsync: addRole } = useMutation({
    mutationFn: (payload: ChurchRolePayload) => ChurchRoleService.create(personId, payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateRole } = useMutation({
    mutationFn: ({ id, ...payload }: ChurchRolePayload & { id: string }) =>
      ChurchRoleService.update(personId, id, payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: removeRole } = useMutation({
    mutationFn: (id: string) => ChurchRoleService.remove(personId, id),
    onSuccess: invalidate,
  });

  return { addRole, updateRole, removeRole };
};

export const useChurchRoleTypeActions = () => {
  const invalidate = useInvalidation(true);

  const { mutateAsync: addType, isPending: isAdding } = useMutation({
    mutationFn: (name: string) => ChurchRoleService.createType(name),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateType } = useMutation({
    mutationFn: ({ id, ...payload }: ChurchRoleTypePayload & { id: string }) =>
      ChurchRoleService.updateType(id, payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: reorderTypes } = useMutation({
    mutationFn: (ids: string[]) => ChurchRoleService.reorderTypes(ids),
    onSuccess: invalidate,
  });

  const { mutateAsync: removeType } = useMutation({
    mutationFn: (id: string) => ChurchRoleService.removeType(id),
    onSuccess: invalidate,
  });

  return { addType, isAdding, updateType, reorderTypes, removeType };
};
