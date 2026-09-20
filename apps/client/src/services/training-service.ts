import { RestService, type Writable } from './abstracts/rest-service';
import type { PersonChoice } from './person-service';

export interface Training {
  id: string;
  name: string;
  leader: PersonChoice | null;
  peopleCount: number;
  createdAt: string;
  updatedAt: string;
}

class TrainingServiceClass extends RestService<Training> {
  protected anchor = 'trainings';

  public createTraining(data: Pick<Writable<Training>, 'name'>): Promise<Training> {
    return this.create(data);
  }

  public updateTraining(
    id: string,
    data: Pick<Writable<Training>, 'name'> & { leaderId: string | null },
  ): Promise<Training> {
    return this.update(id, data);
  }

  public deleteTraining(id: string): Promise<Training> {
    return this.delete(id);
  }
}

export const TrainingService = new TrainingServiceClass();
