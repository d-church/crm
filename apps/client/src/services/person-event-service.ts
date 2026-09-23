import { ApiService } from './abstracts/api-service';

/** Подія життя або спілкування представника церкви з людиною. */
export const PersonEventKind = {
  EVENT: 'EVENT',
  CALL: 'CALL',
  MEETING: 'MEETING',
  CONSULTATION: 'CONSULTATION',
} as const;

export type PersonEventKind = (typeof PersonEventKind)[keyof typeof PersonEventKind];

export type PersonEvent = {
  id: string;
  personId: string;
  kind: PersonEventKind;
  /** Є лише в події життя: у спілкування назву заміняють вид і співрозмовник. */
  title: string | null;
  occurredAt: string;
  note: string | null;
  withPersonId: string | null;
  withPerson: { id: string; firstName: string; lastName: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonEventPayload = {
  kind?: PersonEventKind;
  title?: string | null;
  occurredAt?: string;
  note?: string | null;
  withPersonId?: string | null;
};

class PersonEventServiceClass extends ApiService {
  public async listForPerson(personId: string): Promise<PersonEvent[]> {
    const response = await this.api.get<PersonEvent[]>(`people/${personId}/events`);

    return response.data;
  }

  public async create(personId: string, payload: PersonEventPayload): Promise<PersonEvent> {
    const response = await this.api.post<PersonEvent>(`people/${personId}/events`, payload);

    return response.data;
  }

  public async update(
    personId: string,
    id: string,
    payload: PersonEventPayload,
  ): Promise<PersonEvent> {
    const response = await this.api.patch<PersonEvent>(`people/${personId}/events/${id}`, payload);

    return response.data;
  }

  public async remove(personId: string, id: string): Promise<PersonEvent> {
    const response = await this.api.delete<PersonEvent>(`people/${personId}/events/${id}`);

    return response.data;
  }
}

export const PersonEventService = new PersonEventServiceClass();
