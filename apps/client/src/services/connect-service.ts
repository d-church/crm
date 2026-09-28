import { ApiService } from './abstracts/api-service';
import type { PersonChoice } from './person-service';

export interface EventType {
  id: string;
  name: string;
  sortOrder: number;
  isArchived: boolean;
  usageCount: number;
}

/** Людина на борді: хто веде, звідки знайомство, у якому стані фолов-ап. */
export interface BoardPerson {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  careReceived: { id: string; caregiver: PersonChoice }[];
  events: { id: string; occurredAt: string; eventType: { name: string } | null }[];
  steps: { id: string; state: string }[];
}

export interface QuickAddPayload {
  firstName: string;
  lastName?: string;
  eventTypeId: string;
  phone?: string;
}

class ConnectServiceClass extends ApiService {
  public async board(): Promise<BoardPerson[]> {
    const response = await this.api.get<BoardPerson[]>('connect/board');

    return response.data;
  }

  public async quickAdd(payload: QuickAddPayload): Promise<BoardPerson> {
    const response = await this.api.post<BoardPerson>('connect/people', payload);

    return response.data;
  }

  /** Передача колезі: разом ідуть і фолов-ап, і ведення. */
  public async handover(personId: string, caregiverId: string): Promise<BoardPerson> {
    const response = await this.api.patch<BoardPerson>(`connect/board/${personId}/handover`, {
      caregiverId,
    });

    return response.data;
  }

  public async eventTypes(includeArchived = false): Promise<EventType[]> {
    const response = await this.api.get<EventType[]>('event-types', {
      params: includeArchived ? { includeArchived: true } : undefined,
    });

    return response.data;
  }

  public async createEventType(name: string): Promise<EventType> {
    const response = await this.api.post<EventType>('event-types', { name });

    return response.data;
  }

  public async updateEventType({
    id,
    ...patch
  }: {
    id: string;
    name?: string;
    isArchived?: boolean;
  }): Promise<EventType> {
    const response = await this.api.patch<EventType>(`event-types/${id}`, patch);

    return response.data;
  }

  public async reorderEventTypes(ids: string[]): Promise<EventType[]> {
    const response = await this.api.post<EventType[]>('event-types/reorder', { ids });

    return response.data;
  }

  public async removeEventType(id: string): Promise<EventType> {
    const response = await this.api.delete<EventType>(`event-types/${id}`);

    return response.data;
  }
}

export const ConnectService = new ConnectServiceClass();
