module.exports = {
  apps: [
    {
      name: 'school-backend-erpnext',
      script: './server-erpnext.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 7001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'erpnext-sync-service',
      script: './erpnext-sync-service.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/sync-error.log',
      out_file: './logs/sync-out.log',
      log_file: './logs/sync-combined.log',
      time: true,
      cron_restart: '0 */6 * * *', // Restart every 6 hours to prevent memory leaks
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};