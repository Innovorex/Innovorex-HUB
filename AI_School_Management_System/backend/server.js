// server.js - Production-ready Express server with CORS and security
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const app = express();
const PORT = process.env.PORT || 7001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Compression
app.use(compression());

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://portal.innovorex.co.in',
      'https://www.portal.innovorex.co.in',
      'http://localhost:7000', // For development
      'http://localhost:3000'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'AI School Management System API',
    version: '1.0.0',
    documentation: 'https://server.innovorex.co.in/api/docs'
  });
});

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;

  // Demo authentication for testing
  const demoUsers = {
    'student@demo.com': { password: 'password123', role: 'student', name: 'John Student' },
    'teacher@demo.com': { password: 'password123', role: 'teacher', name: 'Jane Teacher' },
    'parent@demo.com': { password: 'password123', role: 'parent', name: 'Bob Parent' },
    'admin@demo.com': { password: 'password123', role: 'admin', name: 'Alice Admin' }
  };

  const user = demoUsers[email];

  if (user && user.password === password && user.role === role) {
    res.json({
      user: {
        id: Math.random().toString(36).substr(2, 9),
        name: user.name,
        email: email,
        role: user.role,
        status: 'active'
      },
      token: 'jwt-token-' + Math.random().toString(36).substr(2, 9)
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  // Demo registration
  res.status(201).json({
    message: 'Registration successful. Please wait for admin approval.',
    userId: Math.random().toString(36).substr(2, 9)
  });
});

// Student dashboard endpoint
app.get('/api/students/dashboard', (req, res) => {
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║     AI School Management System Backend           ║
║     Environment: ${process.env.NODE_ENV || 'development'}                      ║
║     Server running on port ${PORT}                ║
║     API: http://localhost:${PORT}/api             ║
║     Health: http://localhost:${PORT}/health       ║
╚════════════════════════════════════════════════════╝
  `);
});

module.exports = app;