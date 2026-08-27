import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Ports live in the monorepo's root .env, next to the API's own config, so the
// dev proxy below always points at whatever port the API is actually using.
const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, ROOT_DIR, '');
  // A real shell variable wins over the file, as it does everywhere else.
  const read = (name: string) => process.env[name] ?? rootEnv[name];

  const apiTarget = read('API_TARGET') ?? `http://localhost:${read('PORT') ?? 3000}`;

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
      port: Number(read('CLIENT_PORT') ?? 3001),
      // Keeps dev on one origin: the client calls /api and /uploads relatively,
      // exactly as it will in production.
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/uploads': { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
