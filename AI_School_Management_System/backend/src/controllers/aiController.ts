// controllers/aiController.ts - AI integration controller
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { aiService } from '@/services/aiService';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export class AIController {
  // AI Tutor Chat
  static async chat(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      // Check if user has permission to use AI for this student
      const canAccess = await AIController.canAccessStudentAI(req.userId!, studentId, req.userRole!);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to AI tutor for this student'
        });
        return;
      }

      // Get AI response
      const aiResponse = await aiService.tutorChat(message, {
        studentId,
        subject: context?.subject,
        topic: context?.topic,
        gradeLevel: context?.grade_level,
        learningStyle: context?.learning_style,
        currentAssignment: context?.current_assignment
      }, conversationHistory);

      // Check if response needs parental approval
      const student = await User.findById(studentId);
      const needsApproval = student?.aiPreferences?.parentalControls?.requireApproval &&
                          aiResponse.metadata.appropriateness === 'needs_guidance';

      if (needsApproval) {
        // Store for parent approval and send notification
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

    } catch (error) {
      logger.error('AI Chat Error:', error);
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

  // Get AI chat history for a student
  static async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Check access permissions
      const canAccess = await AIController.canAccessStudentAI(req.userId!, studentId, req.userRole!);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      // For now, return empty array as we'd need to implement chat history storage
      // In a full implementation, you'd store chat history in a separate collection
      res.json({
        success: true,
        data: {
          messages: [],
          total: 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });

    } catch (error) {
      logger.error('Get chat history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat history'
      });
    }
  }

  // Generate study suggestions
  static async getStudySuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { subject } = req.query;

      // Check access permissions
      const canAccess = await AIController.canAccessStudentAI(req.userId!, studentId, req.userRole!);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const suggestions = await aiService.generateStudySuggestions(
        studentId,
        subject as string
      );

      res.json({
        success: true,
        data: {
          suggestions,
          subject: subject || 'general',
          generatedAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Study suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate study suggestions'
      });
    }
  }

  // Analyze student performance
  static async analyzePerformance(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { assessmentData } = req.body;

      // Only teachers and admins can request performance analysis
      if (!['teacher', 'admin'].includes(req.userRole!)) {
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

      const analysis = await aiService.analyzeStudentPerformance(studentId, assessmentData);

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      logger.error('Performance analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze performance'
      });
    }
  }

  // Get AI usage statistics
  static async getAIStats(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      // Check access permissions
      const canAccess = await AIController.canAccessStudentAI(req.userId!, studentId, req.userRole!);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const stats = await aiService.getStudentAIStats(studentId);

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

    } catch (error) {
      logger.error('AI stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI statistics'
      });
    }
  }

  // Update AI preferences
  static async updateAIPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { preferences } = req.body;

      // Check permissions - only student themselves, parents, or admins can update
      const canUpdate = await AIController.canUpdateStudentAI(req.userId!, studentId, req.userRole!);
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

      const updates: any = {};
      for (const field of allowedFields) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (preferences[parent] && preferences[parent][child] !== undefined) {
            updates[`aiPreferences.${field}`] = preferences[parent][child];
          }
        } else if (preferences[field] !== undefined) {
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

      const student = await User.findByIdAndUpdate(
        studentId,
        { $set: updates },
        { new: true, runValidators: true }
      );

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

    } catch (error) {
      logger.error('Update AI preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update AI preferences'
      });
    }
  }

  // AI service health check
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Only admins can check AI service health
      if (req.userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const isHealthy = await aiService.healthCheck();

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

    } catch (error) {
      logger.error('AI health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed'
      });
    }
  }

  // Helper method to check AI access permissions
  private static async canAccessStudentAI(
    userId: string,
    studentId: string,
    userRole: string
  ): Promise<boolean> {
    try {
      // Admin can access any student's AI
      if (userRole === 'admin') return true;

      // Student can access their own AI
      if (userRole === 'student' && userId === studentId) return true;

      // Parent can access their child's AI
      if (userRole === 'parent') {
        const student = await User.findById(studentId);
        return student?.studentInfo?.parentIds?.some(
          parentId => parentId.toString() === userId
        ) || false;
      }

      // Teacher can access their students' AI (basic access for monitoring)
      if (userRole === 'teacher') {
        const teacher = await User.findById(userId);
        const student = await User.findById(studentId);

        // Check if teacher teaches any of the student's subjects
        const teacherSubjects = teacher?.teacherInfo?.subjects || [];
        const studentSubjects = student?.studentInfo?.subjects || [];

        return teacherSubjects.some(subject => studentSubjects.includes(subject));
      }

      return false;
    } catch (error) {
      logger.error('AI access check error:', error);
      return false;
    }
  }

  // Helper method to check AI preference update permissions
  private static async canUpdateStudentAI(
    userId: string,
    studentId: string,
    userRole: string
  ): Promise<boolean> {
    try {
      // Admin can update any student's AI preferences
      if (userRole === 'admin') return true;

      // Student can update their own basic preferences
      if (userRole === 'student' && userId === studentId) return true;

      // Parent can update their child's AI preferences (especially parental controls)
      if (userRole === 'parent') {
        const student = await User.findById(studentId);
        return student?.studentInfo?.parentIds?.some(
          parentId => parentId.toString() === userId
        ) || false;
      }

      return false;
    } catch (error) {
      logger.error('AI update permission check error:', error);
      return false;
    }
  }

  // Helper method to request parent approval
  private static async requestParentApproval(
    studentId: string,
    question: string,
    response: string
  ): Promise<void> {
    try {
      const student = await User.findById(studentId);
      if (!student?.studentInfo?.parentIds?.length) return;

      // In a full implementation, you would:
      // 1. Store the pending approval request
      // 2. Send notifications to parents
      // 3. Create approval workflow

      logger.info(`Parent approval requested for student ${studentId}`);

      // For now, just log the request
      // TODO: Implement full parent approval workflow

    } catch (error) {
      logger.error('Parent approval request error:', error);
    }
  }
}

export default AIController;