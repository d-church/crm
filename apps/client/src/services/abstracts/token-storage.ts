/**
 * Access/refresh token pair persisted in localStorage.
 *
 * Reads are synchronous — the browser has no async secure store, so an
 * in-memory mirror keeps interceptors free of I/O on every request.
 */
export class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

  private memory: Tokens = {
    accessToken: TokenStorage.read(TokenStorage.ACCESS_TOKEN_KEY),
    refreshToken: TokenStorage.read(TokenStorage.REFRESH_TOKEN_KEY),
  };

  public get accessToken(): string | null {
    return this.memory.accessToken;
  }

  public get refreshToken(): string | null {
    return this.memory.refreshToken;
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    this.memory = { accessToken, refreshToken };

    TokenStorage.write(TokenStorage.ACCESS_TOKEN_KEY, accessToken);
    TokenStorage.write(TokenStorage.REFRESH_TOKEN_KEY, refreshToken);
  }

  public clearTokens(): void {
    this.memory = { accessToken: null, refreshToken: null };

    TokenStorage.remove(TokenStorage.ACCESS_TOKEN_KEY);
    TokenStorage.remove(TokenStorage.REFRESH_TOKEN_KEY);
  }

  public hasTokens(): boolean {
    return Boolean(this.accessToken && this.refreshToken);
  }

  private static read(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private static write(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Private mode or a blocked storage partition — memory copy still holds.
    }
  }

  private static remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // See write().
    }
  }
}

type Tokens = {
  accessToken: string | null;
  refreshToken: string | null;
};
