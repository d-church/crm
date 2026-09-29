import { ApiService } from './abstracts/api-service';
import type { PersonChoice } from './person-service';

export interface Overview {
  wards: PersonChoice[];
  teams: { id: string; kind: string; name: string; peopleCount: number }[];
  needsAttention: PersonChoice[];
  overdueSteps: { id: string; person: PersonChoice; step: string; dueAt: string }[];
  birthdays: (PersonChoice & { birthDate: string })[];
}

class OverviewServiceClass extends ApiService {
  public async get(): Promise<Overview> {
    const response = await this.api.get<Overview>('overview');

    return response.data;
  }
}

export const OverviewService = new OverviewServiceClass();
