import { ApiService } from './abstracts/api-service';
import type { User } from './user-service';

class AuthServiceClass extends ApiService {
  public async login(credentials: LoginCredentials): Promise<User> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);

    this.persist(response.data);

    return response.data.user;
  }

  public async register(credentials: RegisterCredentials): Promise<User> {
    const response = await this.api.post<AuthResponse>('/auth/register', credentials);

    this.persist(response.data);

    return response.data.user;
  }

  public logout(): void {
    AuthServiceClass.tokenStorage.clearTokens();
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    const response = await this.api.get<User>('/auth/me');

    return response.data;
  }

  public isAuthenticated(): boolean {
    return AuthServiceClass.tokenStorage.hasTokens();
  }

  private persist({ accessToken, refreshToken }: AuthResponse): void {
    if (accessToken && refreshToken) {
      AuthServiceClass.tokenStorage.setTokens(accessToken, refreshToken);
    }
  }
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
}

type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export const AuthService = new AuthServiceClass();
