import { AxiosError } from 'axios';

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

/** Turns an unknown thrown value into a message safe to show in the UI. */
export const getApiErrorMessage = (error: unknown, fallback = 'Щось пішло не так'): string => {
  if (error instanceof AxiosError) {
    const { message } = (error.response?.data as ApiErrorBody | undefined) ?? {};

    if (Array.isArray(message) && message.length > 0) return message.join('. ');
    if (typeof message === 'string' && message) return message;
    if (!error.response) return 'Немає зʼєднання з сервером';
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
};
