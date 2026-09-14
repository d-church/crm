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
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
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
