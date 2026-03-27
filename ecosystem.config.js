module.exports = {
  apps: [
    {
      name: 'pawactivity-api',
      cwd: '/var/www/pawactivity/apps/api',
      script: '/bin/bash',
      args: '-lc "set -a; source /etc/pawactivity/api.env; exec node dist/main.js"',
      interpreter: 'none'
    },
    {
      name: 'pawactivity-web',
      cwd: '/var/www/pawactivity/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      interpreter: 'node',
      env_file: '/etc/pawactivity/web.env'
    }
  ]
};
