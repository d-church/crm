import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Ports live in the monorepo's root .env, next to the API's own config, so the
// dev proxy below always points at whatever port the API is actually using.
const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url));
const ROOT_ENV_FILE = fileURLToPath(new URL('../../.env', import.meta.url));

/**
 * Значення саме з файла. `loadEnv` з порожнім префіксом підмішує весь
 * `process.env`, а там `PORT` — це порт, який слухає цей же дев-сервер.
 */
const fromEnvFile = (name: string): string | undefined => {
  if (!existsSync(ROOT_ENV_FILE)) return undefined;

  const line = readFileSync(ROOT_ENV_FILE, 'utf8')
    .split('\n')
    .find((row) => row.trimStart().startsWith(`${name}=`));

  return (
    line
      ?.slice(line.indexOf('=') + 1)
      .trim()
      .replace(/^["']|["']$/g, '') || undefined
  );
};

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, ROOT_DIR, '');
  // A real shell variable wins over the file, as it does everywhere else.
  const read = (name: string) => process.env[name] ?? rootEnv[name];

  const clientPort = Number(read('CLIENT_PORT') ?? 3001);

  // `PORT` у власному оточенні означає «порт, який слухаю я» — його підставляють
  // лаунчери дев-сервера. Якщо взяти його за порт API, проксі почне ходити сам
  // у себе: кожен /api множиться рекурсивно, за секунду зʼїдає всі ефемерні
  // порти системи й валиться в EAGAIN. Тому порт API беремо з файла, а з
  // оточення приймаємо лише явний API_TARGET.
  const apiTarget =
    process.env.API_TARGET ??
    fromEnvFile('API_TARGET') ??
    `http://127.0.0.1:${fromEnvFile('PORT') ?? 3000}`;

  if (new URL(apiTarget).port === String(clientPort)) {
    throw new Error(
      `API (${apiTarget}) і дев-сервер (${clientPort}) на одному порту — проксі ходив би сам у себе`,
    );
  }

  return {
    plugins: [
      // Must come before the react plugin so the route tree is generated first.
      tanstackRouter({
        target: 'react',
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: clientPort,
      // Keeps dev on one origin: the client calls /api and /uploads relatively,
      // exactly as it will in production.
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/uploads': { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
