import { RestService } from './abstracts/rest-service';

class UserServiceClass extends RestService<User> {
  protected anchor = 'user';

  public async createUser(payload: CreateUserPayload): Promise<User> {
    const response = await this.api.post<User>(this.anchor, payload);

    return response.data;
  }

  public async updateUserRole(id: string, role: UserRole): Promise<User> {
    const response = await this.api.patch<User>(`${this.anchor}/${id}/role`, { role });

    return response.data;
  }

  /** Ролі набором: лідер домашки цілком може служити ще й у конекті. */
  public async updateRoles(id: string, roles: UserRole[]): Promise<User> {
    const response = await this.api.patch<User>(`${this.anchor}/${id}/roles`, { roles });

    return response.data;
  }

  /** Ким користувач є в базі людей — звідси беруться його підопічні. */
  public async linkPerson(id: string, personId: string | null): Promise<User> {
    const response = await this.api.patch<User>(`${this.anchor}/${id}/person`, { personId });

    return response.data;
  }

  /** Що людина веде, але ще не довірене її обліковому запису. */
  public async suggestedScopes(id: string): Promise<SuggestedScope[]> {
    const response = await this.api.get<SuggestedScope[]>(`${this.anchor}/${id}/suggested-scopes`);

    return response.data;
  }

  public async addScope(id: string, payload: ScopePayload): Promise<UserScope> {
    const response = await this.api.post<UserScope>(`${this.anchor}/${id}/scopes`, payload);

    return response.data;
  }

  public async removeScope(id: string, scopeId: string): Promise<void> {
    await this.api.delete(`${this.anchor}/${id}/scopes/${scopeId}`);
  }

  public async deleteUser(id: string): Promise<User> {
    return this.delete(id);
  }

  public async updateProfile(profile: UpdateProfilePayload): Promise<User> {
    const response = await this.api.patch<User>(`${this.anchor}/me`, profile);

    return response.data;
  }

  public async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await this.api.patch(`${this.anchor}/me/password`, payload);
  }
}

export const UserRole = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  LEADER: 'LEADER',
  CONNECT: 'CONNECT',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ScopeLevel = {
  VIEW: 'VIEW',
  MANAGE: 'MANAGE',
} as const;

export type ScopeLevel = (typeof ScopeLevel)[keyof typeof ScopeLevel];

/** Область вказує рівно на одну сутність — яку саме, видно з того, що заповнене. */
export interface UserScope {
  id: string;
  level: ScopeLevel;
  community: NamedRef | null;
  homeGroup: NamedRef | null;
  ministry: NamedRef | null;
  training: NamedRef | null;
}

export interface NamedRef {
  id: string;
  name: string;
}

export type SuggestedScope = {
  id: string;
  name: string;
  kind: 'community' | 'homeGroup' | 'ministry' | 'training';
};

export type ScopePayload = {
  communityId?: string;
  homeGroupId?: string;
  ministryId?: string;
  trainingId?: string;
  level?: ScopeLevel;
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Стара одинична роль — лишається, поки її не зняли з моделі. */
  role: UserRole;
  roles: UserRole[];
  personId: string | null;
  person?: { id: string; firstName: string; lastName: string | null } | null;
  scopes?: UserScope[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export const UserService = new UserServiceClass();
