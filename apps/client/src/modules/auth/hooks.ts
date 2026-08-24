import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AuthService, type LoginCredentials, type RegisterCredentials } from '@/services';

import { ME_QUERY_KEY, meQueryOptions } from './queries';

export const useAuth = () => {
  const { data: user, isLoading, error, isFetched: isInitialLoaded } = useQuery(meQueryOptions());

  return { user: user ?? null, isLoading, error, isAuthenticated: Boolean(user), isInitialLoaded };
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: login,
    isPending,
    error,
  } = useMutation({
    mutationFn: (dto: LoginCredentials) => AuthService.login(dto),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });

  return { login, isPending, error };
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: register,
    isPending,
    error,
  } = useMutation({
    mutationFn: (dto: RegisterCredentials) => AuthService.register(dto),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });

  return { register, isPending, error };
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  const { mutate: logout, isPending } = useMutation({
    mutationFn: () => Promise.resolve(AuthService.logout()),
    onSuccess: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
    },
  });

  return { logout, isPending };
};
