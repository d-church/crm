import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { PersonService, type PeopleQuery } from '@/services';

import {
  PEOPLE_LIST_KEY,
  PEOPLE_CHOICES_KEY,
  PEOPLE_STATS_KEY,
  PERSON_KEY,
  peopleChoicesQueryOptions,
  peopleQueryOptions,
  peopleStatsQueryOptions,
  personQueryOptions,
} from './queries';
import type { PersonPayload } from './person-form';

export type { PersonPayload } from './person-form';

export const usePeople = (query: PeopleQuery) => useQuery(peopleQueryOptions(query));

export const usePeopleStats = (includeInactive = false) =>
  useQuery(peopleStatsQueryOptions(includeInactive));

export const usePersonChoices = () => useQuery(peopleChoicesQueryOptions());

export const usePerson = (id: string) => useQuery(personQueryOptions(id));

/** A write changes the page, totals and available people for relation pickers. */
const invalidateCollections = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: PEOPLE_LIST_KEY }),
    queryClient.invalidateQueries({ queryKey: PEOPLE_STATS_KEY }),
    queryClient.invalidateQueries({ queryKey: PEOPLE_CHOICES_KEY }),
  ]);

export const useCreatePerson = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createPerson,
    isPending,
    error,
  } = useMutation({
    mutationFn: (dto: PersonPayload) => PersonService.create(dto),
    onSuccess: () => invalidateCollections(queryClient),
  });

  return { createPerson, isPending, error };
};

export const useUpdatePerson = (id: string) => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updatePerson,
    isPending,
    error,
  } = useMutation({
    mutationFn: (dto: PersonPayload) => PersonService.update(id, dto),
    onSuccess: async () => {
      await Promise.all([
        invalidateCollections(queryClient),
        queryClient.invalidateQueries({ queryKey: [...PERSON_KEY, id] }),
      ]);
    },
  });

  return { updatePerson, isPending, error };
};

export const useDeletePerson = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deletePerson,
    isPending,
    error,
  } = useMutation({
    mutationFn: (id: string) => PersonService.delete(id),
    onSuccess: async (_person, id) => {
      // Removed rather than invalidated — refetching a deleted person would 404.
      queryClient.removeQueries({ queryKey: [...PERSON_KEY, id] });

      await invalidateCollections(queryClient);
    },
  });

  return { deletePerson, isPending, error };
};
