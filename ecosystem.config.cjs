module.exports = {
  apps: [{
    name: "nexxus-app",
    script: "dist/index.cjs",
    cwd: "/home/ubuntu/Claude-store/nexxus2.2_replit",
    node_args: "--env-file=.env",
    env: {
      NODE_ENV: "production",
      PORT: "5000"
    },
    max_restarts: 10,
    min_uptime: "5s",
    restart_delay: 2000,
    autorestart: true,
  }]
};
