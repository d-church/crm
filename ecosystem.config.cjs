/**
 * pm2 manifest for production. One process is the whole app: the API serves the
 * built client from its own port, so there is nothing else to run.
 *
 * Secrets and connection strings stay in the root `.env`, which the app loads
 * itself — only what genuinely differs between dev and prod belongs here. A real
 * process variable wins over that file, so the values below take effect.
 */
module.exports = {
  apps: [
    {
      name: 'dchurch-crm',
      // Relative to this file. Keeps `../client/dist` and `../../.env` resolving
      // the way the API expects them to.
      cwd: './apps/api',
      script: './dist/src/main.js',

      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        PORT: 3012,
      },

      max_memory_restart: '512M',
      // A crash loop is a bad deploy, not something to retry forever.
      min_uptime: '20s',
      max_restarts: 10,
      // Timestamp the log lines pm2 collects.
      time: true,
    },
  ],
};
