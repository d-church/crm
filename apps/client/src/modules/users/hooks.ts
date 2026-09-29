import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { UserService, type CreateUserPayload, type ScopePayload, type UserRole } from '@/services';

import { USERS_QUERY_KEY, usersQueryOptions } from './queries';

export const useUsers = () => useQuery(usersQueryOptions());

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => UserService.createUser(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });

  return { createUser: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      UserService.updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });

  return { updateUserRole: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });

  return { deleteUser: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useUpdateUserRoles = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: UserRole[] }) =>
      UserService.updateRoles(id, roles),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });

  return { updateRoles: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useLinkUserPerson = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, personId }: { id: string; personId: string | null }) =>
      UserService.linkPerson(id, personId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });

  return { linkPerson: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useSuggestedScopes = (id: string) =>
  useQuery({
    queryKey: [...USERS_QUERY_KEY, id, 'suggested-scopes'] as const,
    queryFn: () => UserService.suggestedScopes(id),
  });

export const useAddUserScope = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & ScopePayload) =>
      UserService.addScope(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });

  return { addScope: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useRemoveUserScope = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, scopeId }: { id: string; scopeId: string }) =>
      UserService.removeScope(id, scopeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });

  return { removeScope: mutation.mutateAsync, isPending: mutation.isPending };
};
