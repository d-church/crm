import type { AxiosError } from 'axios';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

import { TokenStorage } from './token-storage';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export abstract class ApiService {
  protected static readonly tokenStorage = new TokenStorage();

  /** Shared across instances so parallel 401s trigger a single refresh call. */
  private static refreshing: Promise<string | null> | null = null;

  private static onUnauthorized: (() => void) | null = null;

  protected api: AxiosInstance = axios.create({
    baseURL: API_URL,
  });

  constructor() {
    this.setupInterceptors();
  }

  /** Lets the app react to a dead session (clear caches, bounce to /login). */
  public static setUnauthorizedHandler(handler: (() => void) | null): void {
    ApiService.onUnauthorized = handler;
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config) => {
        const { accessToken } = ApiService.tokenStorage;

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetriableConfig | undefined;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          const accessToken = await ApiService.refreshTokens();

          if (accessToken) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            return this.api(originalRequest);
          }

          ApiService.onUnauthorized?.();
        }

        return Promise.reject(error);
      },
    );
  }

  private static async refreshTokens(): Promise<string | null> {
    ApiService.refreshing ??= (async () => {
      const { refreshToken } = ApiService.tokenStorage;
      if (!refreshToken) return null;

      try {
        const { data } = await axios.post<RefreshResponse>(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        ApiService.tokenStorage.setTokens(data.accessToken, data.refreshToken);

        return data.accessToken;
      } catch {
        ApiService.tokenStorage.clearTokens();

        return null;
      }
    })().finally(() => {
      ApiService.refreshing = null;
    });

    return ApiService.refreshing;
  }
}

type RetriableConfig = NonNullable<AxiosError['config']> & { _retry?: boolean };

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};
