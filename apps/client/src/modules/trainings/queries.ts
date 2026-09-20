import { queryOptions } from '@tanstack/react-query';

import { TrainingService } from '@/services';

export const TRAININGS_QUERY_KEY = ['trainings'] as const;
export const TRAINING_KEY = [...TRAININGS_QUERY_KEY, 'detail'] as const;

export const trainingsQueryOptions = () =>
  queryOptions({
    queryKey: TRAININGS_QUERY_KEY,
    queryFn: () => TrainingService.getAll(),
  });

export const trainingQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...TRAINING_KEY, id],
    queryFn: () => TrainingService.get(id),
  });
