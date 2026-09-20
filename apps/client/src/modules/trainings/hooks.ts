import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TrainingService } from '@/services';

import {
  TRAINING_KEY,
  TRAININGS_QUERY_KEY,
  trainingQueryOptions,
  trainingsQueryOptions,
} from './queries';

export const useTrainings = () => useQuery(trainingsQueryOptions());

export const useTraining = (id: string) => useQuery(trainingQueryOptions(id));

export const useCreateTraining = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: { name: string }) => TrainingService.createTraining(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRAININGS_QUERY_KEY }),
  });

  return {
    createTraining: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useUpdateTraining = (id: string) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: { name: string; leaderId: string | null }) =>
      TrainingService.updateTraining(id, data),
    onSuccess: async (training) => {
      queryClient.setQueryData([...TRAINING_KEY, id], training);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TRAININGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['people'] }),
      ]);
    },
  });

  return {
    updateTraining: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useDeleteTraining = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => TrainingService.deleteTraining(id),
    onSuccess: async (_training, id) => {
      queryClient.removeQueries({ queryKey: [...TRAINING_KEY, id] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TRAININGS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['people'] }),
      ]);
    },
  });

  return {
    deleteTraining: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
