import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PEOPLE_QUERY_KEY } from '@/modules/people/queries';
import { StepService, type StepPayload, type StepTypePayload } from '@/services';

import { STEP_TYPES_KEY, stepTypesQueryOptions } from './queries';

export const useStepTypes = (includeArchived = false) =>
  useQuery(stepTypesQueryOptions(includeArchived));

/** Довідник впливає і на картки людей, тож після зміни оновлюємо обидві гілки. */
const useCatalogInvalidation = () => {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: STEP_TYPES_KEY }),
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY }),
    ]);
  };
};

export const useStepTypeActions = () => {
  const invalidate = useCatalogInvalidation();

  const { mutateAsync: addType, isPending: isAdding } = useMutation({
    mutationFn: (name: string) => StepService.createType(name),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateType } = useMutation({
    mutationFn: ({ id, ...payload }: StepTypePayload & { id: string }) =>
      StepService.updateType(id, payload),
    onSuccess: invalidate,
  });

  const { mutateAsync: reorderTypes } = useMutation({
    mutationFn: (ids: string[]) => StepService.reorderTypes(ids),
    onSuccess: invalidate,
  });

  const { mutateAsync: removeType } = useMutation({
    mutationFn: (id: string) => StepService.removeType(id),
    onSuccess: invalidate,
  });

  return { addType, isAdding, updateType, reorderTypes, removeType };
};

/** Кроки живуть у картці людини, тож після зміни оновлюємо саме її запити. */
const usePeopleInvalidation = () => {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY });
};

export const useAddStep = (personId: string) => {
  const invalidate = usePeopleInvalidation();

  const { mutateAsync: addStep, isPending } = useMutation({
    mutationFn: (payload: StepPayload) => StepService.create(personId, payload),
    onSuccess: invalidate,
  });

  return { addStep, isPending };
};

export const useUpdateStep = (personId: string) => {
  const invalidate = usePeopleInvalidation();

  const { mutateAsync: updateStep, isPending } = useMutation({
    mutationFn: ({ id, ...payload }: StepPayload & { id: string }) =>
      StepService.update(personId, id, payload),
    onSuccess: invalidate,
  });

  return { updateStep, isPending };
};

export const useRemoveStep = (personId: string) => {
  const invalidate = usePeopleInvalidation();

  const { mutateAsync: removeStep, isPending } = useMutation({
    mutationFn: (id: string) => StepService.remove(personId, id),
    onSuccess: invalidate,
  });

  return { removeStep, isPending };
};
