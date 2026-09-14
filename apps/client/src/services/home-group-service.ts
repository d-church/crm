import { RestService, type Writable } from './abstracts/rest-service';
import type { PersonChoice } from './person-service';

export const HomeGroupCategory = {
  YOUTH: 'YOUTH',
  FAMILY: 'FAMILY',
  SENIORS: 'SENIORS',
  FRIENDS: 'FRIENDS',
} as const;

export type HomeGroupCategory = (typeof HomeGroupCategory)[keyof typeof HomeGroupCategory];

export type HomeGroupsQuery = { category?: HomeGroupCategory };

export interface HomeGroup {
  id: string;
  name: string;
  category: HomeGroupCategory;
  address: string | null;
  leader: PersonChoice | null;
  peopleCount: number;
  createdAt: string;
  updatedAt: string;
}

class HomeGroupServiceClass extends RestService<HomeGroup> {
  protected anchor = 'home-groups';

  public async list(query: HomeGroupsQuery = {}): Promise<HomeGroup[]> {
    const response = await this.api.get<HomeGroup[]>(this.anchor, { params: query });

    return response.data;
  }

  public createHomeGroup(
    data: Pick<Writable<HomeGroup>, 'name' | 'category' | 'address'>,
  ): Promise<HomeGroup> {
    return this.create(data);
  }

  public updateHomeGroup(
    id: string,
    data: Pick<Writable<HomeGroup>, 'name' | 'category' | 'address'> & { leaderId?: string | null },
  ): Promise<HomeGroup> {
    return this.update(id, data);
  }

  public deleteHomeGroup(id: string): Promise<HomeGroup> {
    return this.delete(id);
  }
}

export const HomeGroupService = new HomeGroupServiceClass();
