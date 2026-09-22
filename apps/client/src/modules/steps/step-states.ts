import { StepState } from '@/services';

export const STEP_STATES: StepState[] = [
  StepState.PLANNED,
  StepState.IN_PROGRESS,
  StepState.DONE,
  StepState.SKIPPED,
];

export const STEP_STATE_LABELS: Record<StepState, string> = {
  [StepState.PLANNED]: 'Заплановано',
  [StepState.IN_PROGRESS]: 'В процесі',
  [StepState.DONE]: 'Зроблено',
  [StepState.SKIPPED]: 'Пропущено',
};

export const STEP_STATE_BADGES: Record<StepState, string> = {
  [StepState.PLANNED]: 'bg-[#f6ecd2] text-[#87682a]',
  [StepState.IN_PROGRESS]: 'bg-[#dde6f1] text-[#33587a]',
  [StepState.DONE]: 'bg-[#dfeadf] text-[#2f6b3d]',
  [StepState.SKIPPED]: 'bg-[#eae7e0] text-[#8a867c]',
};

/** Крок «у роботі» — запланований або початий. Саме такі можуть протермінуватися. */
export const OPEN_STEP_STATES: StepState[] = [StepState.PLANNED, StepState.IN_PROGRESS];

export const isStepOpen = (state: StepState) => OPEN_STEP_STATES.includes(state);
