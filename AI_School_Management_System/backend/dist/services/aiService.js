"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/utils/logger");
const User_1 = require("@/models/User");
class AIService {
    constructor() {
        this.config = {
            apiKey: process.env.OPENROUTER_API_KEY || '',
            baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
            models: {
                default: process.env.AI_MODEL_DEFAULT || 'meta-llama/llama-4-maverick:free',
                tutor: process.env.AI_MODEL_TUTOR || 'meta-llama/llama-3.1-8b-instruct:free',
                advanced: process.env.AI_MODEL_ADVANCED || 'mistralai/mistral-7b-instruct:free',
                creative: process.env.AI_MODEL_CREATIVE || 'google/gemini-flash-1.5:free'
            }
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseURL,
            timeout: 60000,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-school-management.com',
                'X-Title': 'AI School Management System'
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.client.interceptors.request.use((config) => {
            logger_1.logger.debug(`AI API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            logger_1.logger.error('AI Request Error:', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug(`AI API Response: ${response.status}`);
            return response;
        }, (error) => {
            logger_1.logger.error('AI Response Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    async tutorChat(message, context, conversationHistory = []) {
        try {
            const student = await User_1.User.findById(context.studentId);
            if (!student) {
                throw new Error('Student not found');
            }
            if (!student.aiPreferences?.allowAITutor) {
                throw new Error('AI tutor is disabled for this student');
            }
            const safetyCheck = await this.checkContentSafety(message);
            if (safetyCheck.appropriateness === 'inappropriate') {
                return {
                    response: "I understand you have a question, but I can't help with that topic. Let's focus on your studies! What subject would you like to learn about?",
                    model: 'safety-filter',
                    tokensUsed: { prompt: 0, completion: 0, total: 0 },
                    appropriatenessScore: 0,
                    metadata: {
                        intent: 'inappropriate_content',
                        appropriateness: 'inappropriate',
                        confidence: 100
                    }
                };
            }
            const systemPrompt = this.buildEducationalPrompt(student, context);
            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.slice(-6),
                { role: 'user', content: message }
            ];
            const response = await this.client.post('/chat/completions', {
                model: this.config.models.tutor,
                messages,
                max_tokens: 500,
                temperature: 0.7,
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1,
                stream: false
            });
            const aiResponse = response.data.choices[0].message.content;
            const usage = response.data.usage;
            const analysis = await this.analyzeResponse(aiResponse, message, context);
            await this.logAIInteraction(context.studentId, {
                prompt: message,
                response: aiResponse,
                model: this.config.models.tutor,
                tokensUsed: usage.total_tokens,
                appropriatenessScore: analysis.appropriatenessScore,
                context
            });
            return {
                response: aiResponse,
                model: this.config.models.tutor,
                tokensUsed: {
                    prompt: usage.prompt_tokens,
                    completion: usage.completion_tokens,
                    total: usage.total_tokens
                },
                appropriatenessScore: analysis.appropriatenessScore,
                metadata: analysis
            };
        }
        catch (error) {
            logger_1.logger.error('AI Tutor Chat Error:', error);
            return {
                response: "I'm having trouble right now, but I'm here to help you learn! Please try asking your question again in a moment, or reach out to your teacher for assistance.",
                model: 'error-fallback',
                tokensUsed: { prompt: 0, completion: 0, total: 0 },
                appropriatenessScore: 100,
                metadata: {
                    intent: 'error',
                    appropriateness: 'appropriate',
                    confidence: 0
                }
            };
        }
    }
    async generateStudySuggestions(studentId, subject) {
        try {
            const student = await User_1.User.findById(studentId);
            if (!student)
                return [];
            const prompt = `Based on the student's profile and learning analytics, suggest 5 personalized study activities for ${subject || 'their current subjects'}.

      Student Profile:
      - Grade Level: ${student.studentInfo?.grade || 'Unknown'}
      - Learning Style: ${student.learningAnalytics?.learningStyle || 'visual'}
      - Strengths: ${student.learningAnalytics?.strengths?.join(', ') || 'None identified'}
      - Improvement Areas: ${student.learningAnalytics?.improvementAreas?.join(', ') || 'None identified'}

      Provide exactly 5 short, actionable study suggestions (each under 50 words).`;
            const response = await this.client.post('/chat/completions', {
                model: this.config.models.default,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300,
                temperature: 0.8
            });
            const suggestions = response.data.choices[0].message.content
                .split('\n')
                .filter((line) => line.trim() && /^\d+\./.test(line.trim()))
                .map((line) => line.replace(/^\d+\.\s*/, '').trim())
                .slice(0, 5);
            return suggestions;
        }
        catch (error) {
            logger_1.logger.error('Study suggestions error:', error);
            return [
                'Review your class notes and highlight key concepts',
                'Practice with flashcards for vocabulary or formulas',
                'Explain concepts out loud to reinforce understanding',
                'Create mind maps to connect related ideas',
                'Take practice quizzes to test your knowledge'
            ];
        }
    }
    async analyzeStudentPerformance(studentId, assessmentData) {
        try {
            const student = await User_1.User.findById(studentId);
            if (!student)
                throw new Error('Student not found');
            const prompt = `Analyze this student's performance and provide insights:

      Assessment Data: ${JSON.stringify(assessmentData, null, 2)}

      Student Context:
      - Current GPA: ${student.studentInfo?.currentGPA || 'Unknown'}
      - Learning Style: ${student.learningAnalytics?.learningStyle || 'Unknown'}

      Provide:
      1. Performance summary (2-3 sentences)
      2. Top 3 strengths
      3. Top 3 areas for improvement
      4. 2-3 specific recommendations

      Keep responses encouraging and constructive.`;
            const response = await this.client.post('/chat/completions', {
                model: this.config.models.advanced,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 400,
                temperature: 0.6
            });
            return {
                analysis: response.data.choices[0].message.content,
                model: this.config.models.advanced,
                timestamp: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Performance analysis error:', error);
            return {
                analysis: 'Performance analysis is currently unavailable. Please consult with your teacher for detailed feedback.',
                model: 'error-fallback',
                timestamp: new Date()
            };
        }
    }
    async checkContentSafety(content) {
        try {
            const inappropriateKeywords = [
                'hack', 'cheat', 'answer key', 'homework answers', 'test answers',
                'plagiarize', 'copy', 'steal', 'violence', 'hate', 'discrimination'
            ];
            const lowerContent = content.toLowerCase();
            const hasInappropriateContent = inappropriateKeywords.some(keyword => lowerContent.includes(keyword));
            if (hasInappropriateContent) {
                return {
                    appropriateness: 'inappropriate',
                    confidence: 95,
                    reason: 'Contains inappropriate content or academic dishonesty'
                };
            }
            const homeworkPatterns = [
                /do my homework/i,
                /complete.*assignment/i,
                /write.*essay.*for me/i,
                /solve.*all.*problems/i,
                /give.*me.*answers/i
            ];
            const hasHomeworkRequest = homeworkPatterns.some(pattern => pattern.test(content));
            if (hasHomeworkRequest) {
                return {
                    appropriateness: 'needs_guidance',
                    confidence: 85,
                    reason: 'Request for homework completion detected'
                };
            }
            return {
                appropriateness: 'appropriate',
                confidence: 90
            };
        }
        catch (error) {
            logger_1.logger.error('Content safety check error:', error);
            return {
                appropriateness: 'appropriate',
                confidence: 50
            };
        }
    }
    buildEducationalPrompt(student, context) {
        return `You are an AI tutor for "${student.name}", a ${student.studentInfo?.grade || 'high school'} student. Your role is to guide learning, not provide direct answers.

CORE PRINCIPLES:
- Encourage critical thinking and understanding
- Never do homework for students
- Ask guiding questions to help students discover answers
- Provide hints and explanations, not solutions
- Stay focused on educational topics
- Be encouraging and supportive

STUDENT CONTEXT:
- Grade Level: ${student.studentInfo?.grade || 'Unknown'}
- Current Subject: ${context.subject || 'General'}
- Learning Style: ${student.learningAnalytics?.learningStyle || 'visual'}
- Strengths: ${student.learningAnalytics?.strengths?.join(', ') || 'Still identifying'}

GUIDELINES:
- If asked to do homework: Guide the student through the thinking process
- If asked about inappropriate topics: Redirect to educational content
- If student seems frustrated: Provide encouragement and alternative approaches
- If question is off-topic: Gently redirect to academic subjects

Remember: Your goal is to help students LEARN, not to give them answers.`;
    }
    async analyzeResponse(response, originalQuestion, context) {
        try {
            const hasDirectAnswer = /answer.*is|solution.*is|result.*is/i.test(response);
            const hasGuidingQuestions = /what.*do.*think|how.*would|why.*might|consider/i.test(response);
            const hasExplanation = /because|since|explanation|understand/i.test(response);
            let appropriateness = 'appropriate';
            let appropriatenessScore = 100;
            if (hasDirectAnswer && !hasGuidingQuestions) {
                appropriateness = 'needs_guidance';
                appropriatenessScore = 60;
            }
            let intent = 'general_help';
            if (context.subject)
                intent = `${context.subject}_help`;
            if (originalQuestion.includes('homework'))
                intent = 'homework_guidance';
            if (originalQuestion.includes('test') || originalQuestion.includes('exam'))
                intent = 'test_preparation';
            return {
                intent,
                subject: context.subject,
                confidence: 85,
                appropriateness,
                suggestions: hasGuidingQuestions ? undefined : ['Try asking follow-up questions', 'Encourage student exploration']
            };
        }
        catch (error) {
            logger_1.logger.error('Response analysis error:', error);
            return {
                intent: 'unknown',
                confidence: 50,
                appropriateness: 'appropriate'
            };
        }
    }
    async logAIInteraction(studentId, interaction) {
        try {
            await User_1.User.findByIdAndUpdate(studentId, {
                $push: {
                    'aiPreferences.aiInteractionHistory': {
                        date: new Date(),
                        model: interaction.model,
                        promptTokens: interaction.tokensUsed,
                        responseTokens: 0,
                        appropriatenessScore: interaction.appropriatenessScore
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log AI interaction:', error);
        }
    }
    async getStudentAIStats(studentId) {
        try {
            const student = await User_1.User.findById(studentId);
            if (!student)
                return null;
            const interactions = student.aiPreferences?.aiInteractionHistory || [];
            const today = new Date();
            const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return {
                totalInteractions: interactions.length,
                weeklyInteractions: interactions.filter(i => i.date >= thisWeek).length,
                monthlyInteractions: interactions.filter(i => i.date >= thisMonth).length,
                averageAppropriatenessScore: interactions.length > 0
                    ? interactions.reduce((sum, i) => sum + i.appropriatenessScore, 0) / interactions.length
                    : 100,
                allowedToUseAI: student.aiPreferences?.allowAITutor || false,
                parentalControls: student.aiPreferences?.parentalControls
            };
        }
        catch (error) {
            logger_1.logger.error('AI stats error:', error);
            return null;
        }
    }
    async healthCheck() {
        try {
            const response = await this.client.post('/chat/completions', {
                model: this.config.models.default,
                messages: [{ role: 'user', content: 'Say hello' }],
                max_tokens: 10
            });
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('AI service health check failed:', error);
            return false;
        }
    }
}
exports.aiService = new AIService();
exports.default = exports.aiService;
//# sourceMappingURL=aiService.js.map