import { ApiService } from './abstracts/api-service';

export interface Slice {
  label: string;
  value: number;
}

export interface Statistics {
  /** Скільки активних людей потрапило в розрахунок демографії. */
  active: number;
  age: {
    average: number | null;
    median: number | null;
    /** По скількох порахували — решта без дати народження. */
    counted: number;
    /** Скільки дат виявились неправдоподібними й не рахувалися. */
    ignored: number;
    groups: Slice[];
  };
  gender: Slice[];
  membership: Slice[];
  engagement: { inMinistry: number; inHomeGroup: number; withCaregiver: number };
  /** Рух за останні 12 місяців — по всіх, а не лише по активних. */
  year: { arrived: number; baptized: number; becameMembers: number; left: number };
  filled: { birthDate: number; phone: number; community: number; firstVisit: number };
}

class StatisticsServiceClass extends ApiService {
  public async get(segment?: string): Promise<Statistics> {
    const response = await this.api.get<Statistics>('statistics', {
      params: segment && segment !== 'all' ? { segment } : undefined,
    });

    return response.data;
  }
}

export const StatisticsService = new StatisticsServiceClass();
