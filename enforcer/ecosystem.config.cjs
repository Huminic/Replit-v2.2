module.exports = {
  apps: [{
    name: "nexxus-enforcer",
    script: "node_modules/.bin/tsx",
    args: "server.ts",
    cwd: __dirname,
    env: {
      ENFORCER_PORT: "8004",
      NODE_ENV: "production"
    },
    max_restarts: 10,
    min_uptime: "5s",
    restart_delay: 2000,
    autorestart: true,
  }]
};
