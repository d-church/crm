import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PersonService, type Person } from '@/services';

import { PEOPLE_QUERY_KEY, peopleQueryOptions, personQueryOptions } from './queries';

export const usePeople = () => useQuery(peopleQueryOptions());

export const usePerson = (id: string) => useQuery(personQueryOptions(id));

export const useCreatePerson = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createPerson,
    isPending,
    error,
  } = useMutation({
    mutationFn: (dto: Partial<Person>) => PersonService.create(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY });
    },
  });

  return { createPerson, isPending, error };
};
