import { RestService, type Writable } from './abstracts/rest-service';

export interface Community {
  id: string;
  name: string;
  peopleCount: number;
  createdAt: string;
  updatedAt: string;
}

class CommunityServiceClass extends RestService<Community> {
  protected anchor = 'communities';

  public createCommunity(data: Pick<Writable<Community>, 'name'>): Promise<Community> {
    return this.create(data);
  }
}

export const CommunityService = new CommunityServiceClass();
