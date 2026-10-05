/**
 * PM2 process manager config.
 * Usage: pm2 start deploy/ecosystem.config.cjs
 *
 * - API runs in cluster mode (2 instances) on port 4000.
 * - Web runs `next start` (or `node .next/standalone/server.js` with output: "standalone").
 */
module.exports = {
  apps: [
    {
      name: "bookedforreal-api",
      cwd: "./apps/api",
      script: "dist/server.js",
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "bookedforreal-web",
      cwd: "./apps/web",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
