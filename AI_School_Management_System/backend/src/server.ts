// server.ts - Main application server (simplified for testing)
import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

class Server {
  public app: Application;
  public server: any;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '7001', 10);

    // Create HTTP server
    this.server = createServer(this.app);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Trust proxy for accurate client IP
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: ['http://localhost:7000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // Body parsing middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        port: this.port
      });
    });
  }

  private initializeRoutes(): void {
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: '🎓 AI School Management System API',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        status: 'running',
        frontend: 'http://localhost:7000'
      });
    });

    // Test API endpoints
    this.app.get('/api/test', (req, res) => {
      res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString()
      });
    });

    // Student dashboard endpoint (mock data)
    this.app.get('/api/students/dashboard', (req, res) => {
      res.json({
        progress: {
          overall_gpa: 3.8,
          subjects: [
            { name: 'Mathematics', understanding: 85, trend: 'up', color: 'blue' },
            { name: 'Science', understanding: 92, trend: 'up', color: 'green' },
            { name: 'English', understanding: 78, trend: 'stable', color: 'purple' },
            { name: 'History', understanding: 88, trend: 'up', color: 'orange' }
          ]
        },
        goals: [
          {
            id: '1',
            title: 'Improve Math Score',
            description: 'Reach 90% in mathematics',
            progress: 75,
            target_date: '2025-12-01',
            subject: 'Mathematics'
          }
        ],
        collaboration: {
          study_group_hours: 12,
          classmates_helped: 5,
          questions_asked: 18,
          peer_teaching_hours: 3
        },
        independence: {
          problems_solved_alone: 45,
          ai_usage_appropriateness: 85,
          original_thinking_score: 'Excellent',
          ready_for_next_level: true
        },
        upcoming_schedule: [],
        recent_achievements: [],
        ai_chat_available: true
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Global error handler
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      console.error('Error:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Start server
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`🚀 AI School Management Server running on port ${this.port}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 Frontend URL: http://localhost:7000`);
        console.log(`🔗 Backend URL: http://localhost:${this.port}`);
        console.log(`❤️  Health Check: http://localhost:${this.port}/health`);
      });

      // Graceful shutdown handling
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`🛑 Received ${signal}, shutting down gracefully...`);

    // Close server
    this.server.close(() => {
      console.log('🔌 HTTP server closed');
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public getServer() {
    return this.server;
  }
}

// Create and start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default Server;