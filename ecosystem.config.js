const path = require('path');

module.exports = {
  apps: [
    {
      name: 'project-athlete-api',
      script: path.join(__dirname, 'packages/backend/dist/src/main.js'),
      cwd: path.join(__dirname, 'packages/backend'),
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        API_PORT: '3661',
        API_HOST: '0.0.0.0',
      },
      env: {
        NODE_ENV: 'production',
        API_PORT: '3661',
        API_HOST: '0.0.0.0',
      },
      error_file: path.join(__dirname, 'logs/api-error.log'),
      out_file: path.join(__dirname, 'logs/api-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
    {
      name: 'project-athlete-worker',
      script: path.join(__dirname, 'packages/worker/dist/index.js'),
      cwd: path.join(__dirname, 'packages/worker'),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'project-athlete-web',
      script: path.join(__dirname, 'packages/frontend/serve.js'),
      cwd: path.join(__dirname, 'packages/frontend'),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        FRONTEND_PORT: '6680',
        API_URL: 'http://10.1.1.3:3661',
      },
      env_production: {
        NODE_ENV: 'production',
        FRONTEND_PORT: '6680',
        API_URL: 'http://10.1.1.3:3661',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      error_file: path.join(__dirname, 'logs/web-error.log'),
      out_file: path.join(__dirname, 'logs/web-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
