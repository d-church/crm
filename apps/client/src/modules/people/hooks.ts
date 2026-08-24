import { useQuery } from '@tanstack/react-query';

import { peopleQueryOptions, personQueryOptions } from './queries';

export const usePeople = () => useQuery(peopleQueryOptions());

export const usePerson = (id: string) => useQuery(personQueryOptions(id));
