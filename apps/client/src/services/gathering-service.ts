import { ApiService } from './abstracts/api-service';

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
} as const;

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const RepeatMode = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
} as const;

export type RepeatMode = (typeof RepeatMode)[keyof typeof RepeatMode];

export interface GatheringType {
  id: string;
  name: string;
  sortOrder: number;
  isArchived: boolean;
  usageCount: number;
}

type NamedRef = { id: string; name: string };

/** Зібрання без жодної області — загальноцерковне. */
export interface Gathering {
  id: string;
  type: NamedRef;
  title: string | null;
  startsAt: string;
  note: string | null;
  guestCount: number;
  community: NamedRef | null;
  homeGroup: NamedRef | null;
  ministry: NamedRef | null;
  training: NamedRef | null;
  _count: { attendances: number };
  /** Скільки людей було. Окремо від загальної кількості відміток. */
  presentCount?: number;
}

/** Відмітка в списку присутності: людина і чи була вона. */
export interface AttendanceEntry {
  id: string;
  firstName: string;
  lastName: string | null;
  status: AttendanceStatus;
}

export interface RosterEntry {
  id: string;
  firstName: string;
  lastName: string | null;
  /** `null` означає «ще не відмічено» — це не те саме, що «не був». */
  status: AttendanceStatus | null;
}

export type GatheringPayload = {
  typeId: string;
  startsAt: string;
  title?: string | null;
  note?: string | null;
  guestCount?: number;
  communityId?: string;
  homeGroupId?: string;
  ministryId?: string;
  trainingId?: string;
  repeat?: RepeatMode;
  occurrences?: number;
};

class GatheringServiceClass extends ApiService {
  public async findAll(from: string, to: string): Promise<Gathering[]> {
    const response = await this.api.get<Gathering[]>('gatherings', { params: { from, to } });

    return response.data;
  }

  public async get(id: string): Promise<Gathering> {
    const response = await this.api.get<Gathering>(`gatherings/${id}`);

    return response.data;
  }

  public async create(payload: GatheringPayload): Promise<Gathering[]> {
    const response = await this.api.post<Gathering[]>('gatherings', payload);

    return response.data;
  }

  public async update(id: string, payload: Partial<GatheringPayload>): Promise<Gathering> {
    const response = await this.api.patch<Gathering>(`gatherings/${id}`, payload);

    return response.data;
  }

  public async remove(id: string): Promise<Gathering> {
    const response = await this.api.delete<Gathering>(`gatherings/${id}`);

    return response.data;
  }

  /** Хто був і кого не було — серед видимих користувачу людей. */
  public async attendance(id: string): Promise<AttendanceEntry[]> {
    const response = await this.api.get<AttendanceEntry[]>(`gatherings/${id}/attendance`);

    return response.data;
  }

  /** Кого поточний користувач може відмітити на цьому зібранні. */
  public async roster(id: string): Promise<RosterEntry[]> {
    const response = await this.api.get<RosterEntry[]>(`gatherings/${id}/roster`);

    return response.data;
  }

  public async mark(
    id: string,
    marks: { personId: string; status: AttendanceStatus }[],
  ): Promise<{ saved: number }> {
    const response = await this.api.post<{ saved: number }>(`gatherings/${id}/attendance`, {
      marks,
    });

    return response.data;
  }

  public async types(includeArchived = false): Promise<GatheringType[]> {
    const response = await this.api.get<GatheringType[]>('gathering-types', {
      params: includeArchived ? { includeArchived: true } : undefined,
    });

    return response.data;
  }
}

export const GatheringService = new GatheringServiceClass();

/** Де саме відбувається зібрання. Порожньо означає «уся церква». */
export const gatheringScope = (gathering: Gathering): string =>
  gathering.homeGroup?.name ??
  gathering.ministry?.name ??
  gathering.training?.name ??
  gathering.community?.name ??
  'Уся церква';

export const gatheringTitle = (gathering: Gathering): string =>
  gathering.title?.trim() || gathering.type.name;

/** Довідник видів зібрань — керується в адмініструванні. */
class GatheringTypeServiceClass extends ApiService {
  public async findAll(includeArchived = false): Promise<GatheringType[]> {
    const response = await this.api.get<GatheringType[]>('gathering-types', {
      params: includeArchived ? { includeArchived: true } : undefined,
    });

    return response.data;
  }

  public async create(name: string): Promise<GatheringType> {
    const response = await this.api.post<GatheringType>('gathering-types', { name });

    return response.data;
  }

  public async update({
    id,
    ...patch
  }: {
    id: string;
    name?: string;
    isArchived?: boolean;
  }): Promise<GatheringType> {
    const response = await this.api.patch<GatheringType>(`gathering-types/${id}`, patch);

    return response.data;
  }

  public async reorder(ids: string[]): Promise<GatheringType[]> {
    const response = await this.api.post<GatheringType[]>('gathering-types/reorder', { ids });

    return response.data;
  }

  public async remove(id: string): Promise<GatheringType> {
    const response = await this.api.delete<GatheringType>(`gathering-types/${id}`);

    return response.data;
  }
}

export const GatheringTypeService = new GatheringTypeServiceClass();
