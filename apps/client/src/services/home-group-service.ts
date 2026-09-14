import { RestService, type Writable } from './abstracts/rest-service';
import type { PersonChoice } from './person-service';

export interface HomeGroup {
  id: string;
  name: string;
  address: string | null;
  leader: PersonChoice | null;
  peopleCount: number;
  createdAt: string;
  updatedAt: string;
}

class HomeGroupServiceClass extends RestService<HomeGroup> {
  protected anchor = 'home-groups';

  public createHomeGroup(data: Pick<Writable<HomeGroup>, 'name' | 'address'>): Promise<HomeGroup> {
    return this.create(data);
  }

  public updateHomeGroup(
    id: string,
    data: Pick<Writable<HomeGroup>, 'name' | 'address'> & { leaderId?: string | null },
  ): Promise<HomeGroup> {
    return this.update(id, data);
  }

  public deleteHomeGroup(id: string): Promise<HomeGroup> {
    return this.delete(id);
  }
}

export const HomeGroupService = new HomeGroupServiceClass();
