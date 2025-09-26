// PM2 Ecosystem Configuration for 24/7 Operation
module.exports = {
  apps: [
    {
      // Backend API Server
      name: 'school-backend',
      script: './backend/server.js',
      cwd: '/home/llm_ai/LLM/Hub_Innovorex/AI_School_Management_System',
      instances: 2, // Run 2 instances for redundancy
      exec_mode: 'cluster', // Cluster mode for load balancing
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      env: {
        NODE_ENV: 'production',
        PORT: 7001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Monitoring
      instance_var: 'INSTANCE_ID',

      // Auto restart on specific conditions
      cron_restart: '0 2 * * *', // Restart daily at 2 AM
    },

    {
      // Frontend Static Server (using Node.js to serve)
      name: 'school-frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      cwd: '/home/llm_ai/LLM/Hub_Innovorex/AI_School_Management_System/frontend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'llm_ai',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:innovorex/school-management.git',
      path: '/home/llm_ai/LLM/Hub_Innovorex/AI_School_Management_System',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};