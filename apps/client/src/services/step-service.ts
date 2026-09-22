import { ApiService } from './abstracts/api-service';

export const StepState = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  SKIPPED: 'SKIPPED',
} as const;

export type StepState = (typeof StepState)[keyof typeof StepState];

export type StepType = {
  id: string;
  name: string;
  sortOrder: number;
  isArchived: boolean;
  /** Скільком людям крок уже призначали — разом із завершеними. */
  usageCount: number;
};

export type StepTypePayload = { name?: string; isArchived?: boolean };

/** Крок людини — задача з довідника: у неї є стан, дедлайн і відповідальний. */
export type PersonStep = {
  id: string;
  personId: string;
  stepTypeId: string;
  stepType: StepType;
  state: StepState;
  dueAt: string | null;
  completedAt: string | null;
  responsible: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StepPayload = {
  stepTypeId?: string;
  state?: StepState;
  dueAt?: string | null;
  completedAt?: string | null;
  responsible?: string | null;
  note?: string | null;
};

class StepServiceClass extends ApiService {
  public async types(includeArchived = false): Promise<StepType[]> {
    const response = await this.api.get<StepType[]>('step-types', {
      params: includeArchived ? { includeArchived: true } : {},
    });

    return response.data;
  }

  public async createType(name: string): Promise<StepType> {
    const response = await this.api.post<StepType>('step-types', { name });

    return response.data;
  }

  public async updateType(id: string, payload: StepTypePayload): Promise<StepType> {
    const response = await this.api.patch<StepType>(`step-types/${id}`, payload);

    return response.data;
  }

  public async reorderTypes(ids: string[]): Promise<StepType[]> {
    const response = await this.api.post<StepType[]>('step-types/reorder', { ids });

    return response.data;
  }

  public async removeType(id: string): Promise<StepType> {
    const response = await this.api.delete<StepType>(`step-types/${id}`);

    return response.data;
  }

  public async listForPerson(personId: string): Promise<PersonStep[]> {
    const response = await this.api.get<PersonStep[]>(`people/${personId}/steps`);

    return response.data;
  }

  public async create(personId: string, payload: StepPayload): Promise<PersonStep> {
    const response = await this.api.post<PersonStep>(`people/${personId}/steps`, payload);

    return response.data;
  }

  public async update(personId: string, id: string, payload: StepPayload): Promise<PersonStep> {
    const response = await this.api.patch<PersonStep>(`people/${personId}/steps/${id}`, payload);

    return response.data;
  }

  public async remove(personId: string, id: string): Promise<PersonStep> {
    const response = await this.api.delete<PersonStep>(`people/${personId}/steps/${id}`);

    return response.data;
  }
}

export const StepService = new StepServiceClass();
