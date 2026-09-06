import { RestService } from './abstracts/rest-service';

class UserServiceClass extends RestService<User> {
  protected anchor = 'user';

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
  role: UserRole | null;
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

export const UserService = new UserServiceClass();
