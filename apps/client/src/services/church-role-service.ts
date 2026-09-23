import { ApiService } from './abstracts/api-service';

/** Сан у церкві — диякон, пресвітер, пастор. Довідник веде сама церква. */
export type ChurchRoleType = {
  id: string;
  name: string;
  sortOrder: number;
  isArchived: boolean;
  usageCount: number;
};

export type ChurchRole = {
  id: string;
  personId: string;
  roleTypeId: string;
  roleType: ChurchRoleType;
  /** Порожній `until` означає, що людина служить у сані досі. */
  since: string | null;
  until: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChurchRolePayload = {
  roleTypeId?: string;
  since?: string | null;
  until?: string | null;
};

export type ChurchRoleTypePayload = { name?: string; isArchived?: boolean };

class ChurchRoleServiceClass extends ApiService {
  public async types(includeArchived = false): Promise<ChurchRoleType[]> {
    const response = await this.api.get<ChurchRoleType[]>('church-role-types', {
      params: includeArchived ? { includeArchived: true } : {},
    });

    return response.data;
  }

  public async createType(name: string): Promise<ChurchRoleType> {
    const response = await this.api.post<ChurchRoleType>('church-role-types', { name });

    return response.data;
  }

  public async updateType(id: string, payload: ChurchRoleTypePayload): Promise<ChurchRoleType> {
    const response = await this.api.patch<ChurchRoleType>(`church-role-types/${id}`, payload);

    return response.data;
  }

  public async reorderTypes(ids: string[]): Promise<ChurchRoleType[]> {
    const response = await this.api.post<ChurchRoleType[]>('church-role-types/reorder', { ids });

    return response.data;
  }

  public async removeType(id: string): Promise<ChurchRoleType> {
    const response = await this.api.delete<ChurchRoleType>(`church-role-types/${id}`);

    return response.data;
  }

  public async create(personId: string, payload: ChurchRolePayload): Promise<ChurchRole> {
    const response = await this.api.post<ChurchRole>(`people/${personId}/church-roles`, payload);

    return response.data;
  }

  public async update(
    personId: string,
    id: string,
    payload: ChurchRolePayload,
  ): Promise<ChurchRole> {
    const response = await this.api.patch<ChurchRole>(
      `people/${personId}/church-roles/${id}`,
      payload,
    );

    return response.data;
  }

  public async remove(personId: string, id: string): Promise<ChurchRole> {
    const response = await this.api.delete<ChurchRole>(`people/${personId}/church-roles/${id}`);

    return response.data;
  }
}

export const ChurchRoleService = new ChurchRoleServiceClass();
