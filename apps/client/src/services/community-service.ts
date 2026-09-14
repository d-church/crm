import { RestService, type Writable } from './abstracts/rest-service';
import type { PersonChoice } from './person-service';

export interface Community {
  id: string;
  name: string;
  leader: PersonChoice | null;
  peopleCount: number;
  createdAt: string;
  updatedAt: string;
}

class CommunityServiceClass extends RestService<Community> {
  protected anchor = 'communities';

  public createCommunity(data: Pick<Writable<Community>, 'name'>): Promise<Community> {
    return this.create(data);
  }

  public updateCommunity(
    id: string,
    data: Pick<Writable<Community>, 'name'> & { leaderId?: string | null },
  ): Promise<Community> {
    return this.update(id, data);
  }

  public deleteCommunity(id: string): Promise<Community> {
    return this.delete(id);
  }
}

export const CommunityService = new CommunityServiceClass();
