"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const express_validator_1 = require("express-validator");
const aiService_1 = require("@/services/aiService");
const User_1 = require("@/models/User");
const logger_1 = require("@/utils/logger");
class AIController {
    static async chat(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { message, context, conversationHistory = [] } = req.body;
            const studentId = req.body.student_id || req.userId;
            if (!studentId) {
                res.status(400).json({
                    success: false,
                    message: 'Student ID is required'
                });
                return;
            }
            const canAccess = await AIController.canAccessStudentAI(req.userId, studentId, req.userRole);
            if (!canAccess) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied to AI tutor for this student'
                });
                return;
            }
            const aiResponse = await aiService_1.aiService.tutorChat(message, {
                studentId,
                subject: context?.subject,
                topic: context?.topic,
                gradeLevel: context?.grade_level,
                learningStyle: context?.learning_style,
                currentAssignment: context?.current_assignment
            }, conversationHistory);
            const student = await User_1.User.findById(studentId);
            const needsApproval = student?.aiPreferences?.parentalControls?.requireApproval &&
                aiResponse.metadata.appropriateness === 'needs_guidance';
            if (needsApproval) {
                await AIController.requestParentApproval(studentId, message, aiResponse.response);
                res.json({
                    success: true,
                    message: 'Your question has been sent to your parent for approval.',
                    data: {
                        response: "I've received your question! Since you have parental controls enabled, your parent will review this before I can help. They'll get a notification shortly.",
                        model: 'parental-control',
                        tokensUsed: { prompt: 0, completion: 0, total: 0 },
                        metadata: {
                            intent: 'parental_approval_required',
                            appropriateness: 'needs_approval',
                            confidence: 100
                        }
                    }
                });
                return;
            }
            res.json({
                success: true,
                data: aiResponse
            });
        }
        catch (error) {
            logger_1.logger.error('AI Chat Error:', error);
            res.status(500).json({
                success: false,
                message: 'AI chat service is currently unavailable. Please try again later.',
                data: {
                    response: "I'm having trouble right now, but I'm here to help you learn! Please try asking your question again in a moment.",
                    model: 'error-fallback',
                    tokensUsed: { prompt: 0, completion: 0, total: 0 },
                    metadata: {
                        intent: 'error',
                        appropriateness: 'appropriate',
                        confidence: 0
                    }
                }
            });
        }
    }
    static async getChatHistory(req, res) {
        try {
            const { studentId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const canAccess = await AIController.canAccessStudentAI(req.userId, studentId, req.userRole);
            if (!canAccess) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    messages: [],
                    total: 0,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get chat history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve chat history'
            });
        }
    }
    static async getStudySuggestions(req, res) {
        try {
            const { studentId } = req.params;
            const { subject } = req.query;
            const canAccess = await AIController.canAccessStudentAI(req.userId, studentId, req.userRole);
            if (!canAccess) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            const suggestions = await aiService_1.aiService.generateStudySuggestions(studentId, subject);
            res.json({
                success: true,
                data: {
                    suggestions,
                    subject: subject || 'general',
                    generatedAt: new Date()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Study suggestions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate study suggestions'
            });
        }
    }
    static async analyzePerformance(req, res) {
        try {
            const { studentId } = req.params;
            const { assessmentData } = req.body;
            if (!['teacher', 'admin'].includes(req.userRole)) {
                res.status(403).json({
                    success: false,
                    message: 'Only teachers and administrators can request performance analysis'
                });
                return;
            }
            if (!assessmentData) {
                res.status(400).json({
                    success: false,
                    message: 'Assessment data is required'
                });
                return;
            }
            const analysis = await aiService_1.aiService.analyzeStudentPerformance(studentId, assessmentData);
            res.json({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            logger_1.logger.error('Performance analysis error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to analyze performance'
            });
        }
    }
    static async getAIStats(req, res) {
        try {
            const { studentId } = req.params;
            const canAccess = await AIController.canAccessStudentAI(req.userId, studentId, req.userRole);
            if (!canAccess) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            const stats = await aiService_1.aiService.getStudentAIStats(studentId);
            if (!stats) {
                res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
                return;
            }
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('AI stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve AI statistics'
            });
        }
    }
    static async updateAIPreferences(req, res) {
        try {
            const { studentId } = req.params;
            const { preferences } = req.body;
            const canUpdate = await AIController.canUpdateStudentAI(req.userId, studentId, req.userRole);
            if (!canUpdate) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            const allowedFields = [
                'allowAITutor',
                'parentalControls.allowDirectAI',
                'parentalControls.requireApproval',
                'parentalControls.restrictedTopics'
            ];
            const updates = {};
            for (const field of allowedFields) {
                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    if (preferences[parent] && preferences[parent][child] !== undefined) {
                        updates[`aiPreferences.${field}`] = preferences[parent][child];
                    }
                }
                else if (preferences[field] !== undefined) {
                    updates[`aiPreferences.${field}`] = preferences[field];
                }
            }
            if (Object.keys(updates).length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No valid preferences provided'
                });
                return;
            }
            const student = await User_1.User.findByIdAndUpdate(studentId, { $set: updates }, { new: true, runValidators: true });
            if (!student) {
                res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'AI preferences updated successfully',
                data: {
                    preferences: student.aiPreferences
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Update AI preferences error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update AI preferences'
            });
        }
    }
    static async healthCheck(req, res) {
        try {
            if (req.userRole !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
                return;
            }
            const isHealthy = await aiService_1.aiService.healthCheck();
            res.json({
                success: true,
                data: {
                    aiServiceHealthy: isHealthy,
                    timestamp: new Date(),
                    models: {
                        default: process.env.AI_MODEL_DEFAULT,
                        tutor: process.env.AI_MODEL_TUTOR,
                        advanced: process.env.AI_MODEL_ADVANCED,
                        creative: process.env.AI_MODEL_CREATIVE
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('AI health check error:', error);
            res.status(500).json({
                success: false,
                message: 'Health check failed'
            });
        }
    }
    static async canAccessStudentAI(userId, studentId, userRole) {
        try {
            if (userRole === 'admin')
                return true;
            if (userRole === 'student' && userId === studentId)
                return true;
            if (userRole === 'parent') {
                const student = await User_1.User.findById(studentId);
                return student?.studentInfo?.parentIds?.some(parentId => parentId.toString() === userId) || false;
            }
            if (userRole === 'teacher') {
                const teacher = await User_1.User.findById(userId);
                const student = await User_1.User.findById(studentId);
                const teacherSubjects = teacher?.teacherInfo?.subjects || [];
                const studentSubjects = student?.studentInfo?.subjects || [];
                return teacherSubjects.some(subject => studentSubjects.includes(subject));
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('AI access check error:', error);
            return false;
        }
    }
    static async canUpdateStudentAI(userId, studentId, userRole) {
        try {
            if (userRole === 'admin')
                return true;
            if (userRole === 'student' && userId === studentId)
                return true;
            if (userRole === 'parent') {
                const student = await User_1.User.findById(studentId);
                return student?.studentInfo?.parentIds?.some(parentId => parentId.toString() === userId) || false;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('AI update permission check error:', error);
            return false;
        }
    }
    static async requestParentApproval(studentId, question, response) {
        try {
            const student = await User_1.User.findById(studentId);
            if (!student?.studentInfo?.parentIds?.length)
                return;
            logger_1.logger.info(`Parent approval requested for student ${studentId}`);
        }
        catch (error) {
            logger_1.logger.error('Parent approval request error:', error);
        }
    }
}
exports.AIController = AIController;
exports.default = AIController;
//# sourceMappingURL=aiController.js.map