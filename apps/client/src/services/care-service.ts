import { ApiService } from './abstracts/api-service';

/** Звідки взялася опіка: призначена руками чи виводиться з участі. */
export const CareOrigin = {
  ASSIGNED: 'ASSIGNED',
  HOME_GROUP: 'HOME_GROUP',
  CONNECT: 'CONNECT',
} as const;

export type CareOrigin = (typeof CareOrigin)[keyof typeof CareOrigin];

export interface Care {
  id: string;
  personId: string;
  caregiverId: string;
  caregiver: { id: string; firstName: string; lastName: string | null };
  origin: CareOrigin;
  since: string;
  /** Порожнє означає, що опіка триває. */
  until: string | null;
}

class CareServiceClass extends ApiService {
  public async findForPerson(personId: string): Promise<Care[]> {
    const response = await this.api.get<Care[]>(`people/${personId}/cares`);

    return response.data;
  }

  public async assign(personId: string, caregiverId: string): Promise<Care> {
    const response = await this.api.post<Care>(`people/${personId}/cares`, { caregiverId });

    return response.data;
  }

  /** Опіку не видаляють, а завершують: історія лишається наступному попечителю. */
  public async close(personId: string, id: string): Promise<Care> {
    const response = await this.api.delete<Care>(`people/${personId}/cares/${id}`);

    return response.data;
  }
}

export const CareService = new CareServiceClass();
