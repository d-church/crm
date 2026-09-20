import { RestService, type Writable } from './abstracts/rest-service';
import type { Community } from './community-service';
import type { PersonChoice } from './person-service';

export type MinistriesQuery = { communityId?: string };

export interface Ministry {
  id: string;
  name: string;
  community: Pick<Community, 'id' | 'name'>;
  leader: PersonChoice | null;
  peopleCount: number;
  createdAt: string;
  updatedAt: string;
}

class MinistryServiceClass extends RestService<Ministry> {
  protected anchor = 'ministries';

  public async list(query: MinistriesQuery = {}): Promise<Ministry[]> {
    const response = await this.api.get<Ministry[]>(this.anchor, { params: query });

    return response.data;
  }

  public createMinistry(
    data: Pick<Writable<Ministry>, 'name'> & { communityId: string; leaderId?: string },
  ): Promise<Ministry> {
    return this.create(data);
  }

  public updateMinistry(
    id: string,
    data: Pick<Writable<Ministry>, 'name'> & { communityId: string; leaderId: string | null },
  ): Promise<Ministry> {
    return this.update(id, data);
  }

  public deleteMinistry(id: string): Promise<Ministry> {
    return this.delete(id);
  }
}

export const MinistryService = new MinistryServiceClass();
