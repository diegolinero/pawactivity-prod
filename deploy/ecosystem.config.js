module.exports = {
  apps: [
    {
      name: "pawactivity-api",
      cwd: "/var/www/pawactivity",
      script: "apps/api/dist/main.js",
      interpreter: "node",
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },
    {
      name: "pawactivity-web",
      cwd: "/var/www/pawactivity/apps/web",
      script: "pnpm",
      args: "start",
      interpreter: "none",
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
