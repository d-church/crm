import { RestService } from './abstracts/rest-service';

class UserServiceClass extends RestService<User> {
  protected anchor = 'user';

  public async updateName(name: string): Promise<User> {
    const response = await this.api.patch<User>(`${this.anchor}/me`, { name });

    return response.data;
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
  name: string;
  role: UserRole | null;
  createdAt: string;
  updatedAt: string;
}

export const UserService = new UserServiceClass();
