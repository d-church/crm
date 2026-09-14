import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { UserService, type CreateUserPayload, type UserRole } from '@/services';

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
