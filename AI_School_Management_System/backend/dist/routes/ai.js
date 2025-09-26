"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("@/middleware/auth");
const aiController_1 = __importDefault(require("@/controllers/aiController"));
const router = (0, express_1.Router)();
const chatValidation = [
    (0, express_validator_1.body)('message')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters'),
    (0, express_validator_1.body)('student_id')
        .optional()
        .isMongoId()
        .withMessage('Invalid student ID'),
    (0, express_validator_1.body)('context.subject')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Subject must be less than 100 characters'),
    (0, express_validator_1.body)('context.topic')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Topic must be less than 100 characters'),
    (0, express_validator_1.body)('conversationHistory')
        .optional()
        .isArray({ max: 20 })
        .withMessage('Conversation history must be an array with max 20 messages')
];
const studentIdValidation = [
    (0, express_validator_1.param)('studentId')
        .isMongoId()
        .withMessage('Invalid student ID')
];
const preferencesValidation = [
    (0, express_validator_1.body)('preferences.allowAITutor')
        .optional()
        .isBoolean()
        .withMessage('allowAITutor must be a boolean'),
    (0, express_validator_1.body)('preferences.parentalControls.allowDirectAI')
        .optional()
        .isBoolean()
        .withMessage('allowDirectAI must be a boolean'),
    (0, express_validator_1.body)('preferences.parentalControls.requireApproval')
        .optional()
        .isBoolean()
        .withMessage('requireApproval must be a boolean'),
    (0, express_validator_1.body)('preferences.parentalControls.restrictedTopics')
        .optional()
        .isArray()
        .withMessage('restrictedTopics must be an array')
];
router.post('/chat', auth_1.authenticate, (0, auth_1.authorize)('student', 'parent', 'teacher', 'admin'), chatValidation, aiController_1.default.chat);
router.get('/history/:studentId', auth_1.authenticate, studentIdValidation, (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }), (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }), aiController_1.default.getChatHistory);
router.get('/suggestions/:studentId', auth_1.authenticate, studentIdValidation, (0, express_validator_1.query)('subject').optional().isLength({ max: 100 }), aiController_1.default.getStudySuggestions);
router.post('/analyze-performance/:studentId', auth_1.authenticate, (0, auth_1.authorize)('teacher', 'admin'), studentIdValidation, (0, express_validator_1.body)('assessmentData')
    .notEmpty()
    .withMessage('Assessment data is required'), aiController_1.default.analyzePerformance);
router.get('/stats/:studentId', auth_1.authenticate, studentIdValidation, aiController_1.default.getAIStats);
router.put('/preferences/:studentId', auth_1.authenticate, studentIdValidation, preferencesValidation, aiController_1.default.updateAIPreferences);
router.get('/health', auth_1.authenticate, (0, auth_1.authorize)('admin'), aiController_1.default.healthCheck);
exports.default = router;
//# sourceMappingURL=ai.js.map