// routes/ai.ts - AI integration routes
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '@/middleware/auth';
import AIController from '@/controllers/aiController';

const router = Router();

// Validation schemas
const chatValidation = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('student_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('context.subject')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Subject must be less than 100 characters'),
  body('context.topic')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Topic must be less than 100 characters'),
  body('conversationHistory')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Conversation history must be an array with max 20 messages')
];

const studentIdValidation = [
  param('studentId')
    .isMongoId()
    .withMessage('Invalid student ID')
];

const preferencesValidation = [
  body('preferences.allowAITutor')
    .optional()
    .isBoolean()
    .withMessage('allowAITutor must be a boolean'),
  body('preferences.parentalControls.allowDirectAI')
    .optional()
    .isBoolean()
    .withMessage('allowDirectAI must be a boolean'),
  body('preferences.parentalControls.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval must be a boolean'),
  body('preferences.parentalControls.restrictedTopics')
    .optional()
    .isArray()
    .withMessage('restrictedTopics must be an array')
];

/**
 * @route POST /api/ai/chat
 * @desc AI tutor chat
 * @access Private (Students, Parents, Teachers)
 */
router.post(
  '/chat',
  authenticate,
  authorize('student', 'parent', 'teacher', 'admin'),
  chatValidation,
  AIController.chat
);

/**
 * @route GET /api/ai/history/:studentId
 * @desc Get AI chat history for a student
 * @access Private (Student themselves, Parents, Teachers, Admin)
 */
router.get(
  '/history/:studentId',
  authenticate,
  studentIdValidation,
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  AIController.getChatHistory
);

/**
 * @route GET /api/ai/suggestions/:studentId
 * @desc Generate personalized study suggestions
 * @access Private (Student themselves, Parents, Teachers, Admin)
 */
router.get(
  '/suggestions/:studentId',
  authenticate,
  studentIdValidation,
  query('subject').optional().isLength({ max: 100 }),
  AIController.getStudySuggestions
);

/**
 * @route POST /api/ai/analyze-performance/:studentId
 * @desc Analyze student performance using AI
 * @access Private (Teachers, Admin)
 */
router.post(
  '/analyze-performance/:studentId',
  authenticate,
  authorize('teacher', 'admin'),
  studentIdValidation,
  body('assessmentData')
    .notEmpty()
    .withMessage('Assessment data is required'),
  AIController.analyzePerformance
);

/**
 * @route GET /api/ai/stats/:studentId
 * @desc Get AI usage statistics for a student
 * @access Private (Student themselves, Parents, Teachers, Admin)
 */
router.get(
  '/stats/:studentId',
  authenticate,
  studentIdValidation,
  AIController.getAIStats
);

/**
 * @route PUT /api/ai/preferences/:studentId
 * @desc Update AI preferences for a student
 * @access Private (Student themselves, Parents, Admin)
 */
router.put(
  '/preferences/:studentId',
  authenticate,
  studentIdValidation,
  preferencesValidation,
  AIController.updateAIPreferences
);

/**
 * @route GET /api/ai/health
 * @desc Check AI service health
 * @access Private (Admin only)
 */
router.get(
  '/health',
  authenticate,
  authorize('admin'),
  AIController.healthCheck
);

export default router;