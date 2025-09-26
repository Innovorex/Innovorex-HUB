"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '7001', 10);
        this.server = (0, http_1.createServer)(this.app);
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        this.app.set('trust proxy', 1);
        this.app.use((0, helmet_1.default)({
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
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:7000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api', limiter);
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((0, cookie_parser_1.default)());
        this.app.use((req, res, next) => {
            console.log(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });
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
    initializeRoutes() {
        this.app.get('/', (req, res) => {
            res.json({
                message: '🎓 AI School Management System API',
                version: '1.0.0',
                environment: process.env.NODE_ENV,
                status: 'running',
                frontend: 'http://localhost:7000'
            });
        });
        this.app.get('/api/test', (req, res) => {
            res.json({
                message: 'API is working!',
                timestamp: new Date().toISOString()
            });
        });
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
    initializeErrorHandling() {
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                path: req.originalUrl,
                method: req.method
            });
        });
        this.app.use((error, req, res, next) => {
            console.error('Error:', error);
            res.status(error.status || 500).json({
                error: error.message || 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            });
        });
    }
    async start() {
        try {
            this.server.listen(this.port, '0.0.0.0', () => {
                console.log(`🚀 AI School Management Server running on port ${this.port}`);
                console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`🌐 Frontend URL: http://localhost:7000`);
                console.log(`🔗 Backend URL: http://localhost:${this.port}`);
                console.log(`❤️  Health Check: http://localhost:${this.port}/health`);
            });
            process.on('SIGTERM', this.gracefulShutdown.bind(this));
            process.on('SIGINT', this.gracefulShutdown.bind(this));
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    async gracefulShutdown(signal) {
        console.log(`🛑 Received ${signal}, shutting down gracefully...`);
        this.server.close(() => {
            console.log('🔌 HTTP server closed');
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
        });
    }
    getApp() {
        return this.app;
    }
    getServer() {
        return this.server;
    }
}
if (require.main === module) {
    const server = new Server();
    server.start().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
exports.default = Server;
//# sourceMappingURL=server.js.map