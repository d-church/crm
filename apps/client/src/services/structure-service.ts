import { ApiService } from './abstracts/api-service';
import type { PersonChoice } from './person-service';

/** Частини церкви, які можна роздивлятися в структурі. */
export const StructureKind = {
  COMMUNITY: 'community',
  HOME_GROUP: 'home-group',
  MINISTRY: 'ministry',
  TRAINING: 'training',
} as const;

export type StructureKind = (typeof StructureKind)[keyof typeof StructureKind];

class StructureServiceClass extends ApiService {
  /** Лише імена: у структурі картки не відкривають. */
  public async peopleOf(kind: StructureKind, id: string): Promise<PersonChoice[]> {
    const response = await this.api.get<PersonChoice[]>(`structure/${kind}/${id}/people`);

    return response.data;
  }
}

export const StructureService = new StructureServiceClass();
