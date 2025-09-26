// services/aiService.ts - AI service with OpenRouter integration for education
import axios, { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger';
import { User, IUser } from '@/models/User';

interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  models: {
    default: string;
    tutor: string;
    advanced: string;
    creative: string;
  };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  response: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  appropriatenessScore: number;
  metadata: {
    intent: string;
    subject?: string;
    confidence: number;
    appropriateness: 'appropriate' | 'needs_guidance' | 'inappropriate';
    suggestions?: string[];
  };
}

interface TutorContext {
  studentId: string;
  subject?: string;
  topic?: string;
  gradeLevel?: string;
  learningStyle?: string;
  currentAssignment?: string;
}

class AIService {
  private client: AxiosInstance;
  private config: OpenRouterConfig;

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

    this.client = axios.create({
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

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`AI API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('AI Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`AI API Response: ${response.status}`);
        return response;
      },
      (error) => {
        logger.error('AI Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // Main AI Tutor Chat Function
  async tutorChat(
    message: string,
    context: TutorContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    try {
      // Get student information for personalized responses
      const student = await User.findById(context.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Check if AI is allowed for this student
      if (!student.aiPreferences?.allowAITutor) {
        throw new Error('AI tutor is disabled for this student');
      }

      // Content safety check first
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

      // Build educational context prompt
      const systemPrompt = this.buildEducationalPrompt(student, context);

      // Prepare conversation for API
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: 'user', content: message }
      ];

      // Call OpenRouter API
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

      // Analyze response appropriateness and educational value
      const analysis = await this.analyzeResponse(aiResponse, message, context);

      // Log AI interaction
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

    } catch (error) {
      logger.error('AI Tutor Chat Error:', error);

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

  // AI-powered study suggestions
  async generateStudySuggestions(studentId: string, subject?: string): Promise<string[]> {
    try {
      const student = await User.findById(studentId);
      if (!student) return [];

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
        .filter((line: string) => line.trim() && /^\d+\./.test(line.trim()))
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5);

      return suggestions;

    } catch (error) {
      logger.error('Study suggestions error:', error);
      return [
        'Review your class notes and highlight key concepts',
        'Practice with flashcards for vocabulary or formulas',
        'Explain concepts out loud to reinforce understanding',
        'Create mind maps to connect related ideas',
        'Take practice quizzes to test your knowledge'
      ];
    }
  }

  // AI assessment analysis
  async analyzeStudentPerformance(studentId: string, assessmentData: any): Promise<any> {
    try {
      const student = await User.findById(studentId);
      if (!student) throw new Error('Student not found');

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

    } catch (error) {
      logger.error('Performance analysis error:', error);
      return {
        analysis: 'Performance analysis is currently unavailable. Please consult with your teacher for detailed feedback.',
        model: 'error-fallback',
        timestamp: new Date()
      };
    }
  }

  // Content safety and appropriateness checker
  private async checkContentSafety(content: string): Promise<{
    appropriateness: 'appropriate' | 'needs_guidance' | 'inappropriate';
    confidence: number;
    reason?: string;
  }> {
    try {
      // Simple keyword-based filtering for inappropriate content
      const inappropriateKeywords = [
        'hack', 'cheat', 'answer key', 'homework answers', 'test answers',
        'plagiarize', 'copy', 'steal', 'violence', 'hate', 'discrimination'
      ];

      const lowerContent = content.toLowerCase();
      const hasInappropriateContent = inappropriateKeywords.some(keyword =>
        lowerContent.includes(keyword)
      );

      if (hasInappropriateContent) {
        return {
          appropriateness: 'inappropriate',
          confidence: 95,
          reason: 'Contains inappropriate content or academic dishonesty'
        };
      }

      // Check for homework completion requests
      const homeworkPatterns = [
        /do my homework/i,
        /complete.*assignment/i,
        /write.*essay.*for me/i,
        /solve.*all.*problems/i,
        /give.*me.*answers/i
      ];

      const hasHomeworkRequest = homeworkPatterns.some(pattern =>
        pattern.test(content)
      );

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

    } catch (error) {
      logger.error('Content safety check error:', error);
      return {
        appropriateness: 'appropriate',
        confidence: 50
      };
    }
  }

  // Build educational context prompt
  private buildEducationalPrompt(student: IUser, context: TutorContext): string {
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

  // Analyze AI response for educational value
  private async analyzeResponse(
    response: string,
    originalQuestion: string,
    context: TutorContext
  ): Promise<AIResponse['metadata']> {
    try {
      // Simple analysis based on response content
      const hasDirectAnswer = /answer.*is|solution.*is|result.*is/i.test(response);
      const hasGuidingQuestions = /what.*do.*think|how.*would|why.*might|consider/i.test(response);
      const hasExplanation = /because|since|explanation|understand/i.test(response);

      let appropriateness: 'appropriate' | 'needs_guidance' | 'inappropriate' = 'appropriate';
      let appropriatenessScore = 100;

      if (hasDirectAnswer && !hasGuidingQuestions) {
        appropriateness = 'needs_guidance';
        appropriatenessScore = 60;
      }

      // Determine intent
      let intent = 'general_help';
      if (context.subject) intent = `${context.subject}_help`;
      if (originalQuestion.includes('homework')) intent = 'homework_guidance';
      if (originalQuestion.includes('test') || originalQuestion.includes('exam')) intent = 'test_preparation';

      return {
        intent,
        subject: context.subject,
        confidence: 85,
        appropriateness,
        suggestions: hasGuidingQuestions ? undefined : ['Try asking follow-up questions', 'Encourage student exploration']
      };

    } catch (error) {
      logger.error('Response analysis error:', error);
      return {
        intent: 'unknown',
        confidence: 50,
        appropriateness: 'appropriate'
      };
    }
  }

  // Log AI interactions for monitoring and analytics
  private async logAIInteraction(studentId: string, interaction: any): Promise<void> {
    try {
      await User.findByIdAndUpdate(studentId, {
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
    } catch (error) {
      logger.error('Failed to log AI interaction:', error);
    }
  }

  // Get AI usage statistics for a student
  async getStudentAIStats(studentId: string): Promise<any> {
    try {
      const student = await User.findById(studentId);
      if (!student) return null;

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
    } catch (error) {
      logger.error('AI stats error:', error);
      return null;
    }
  }

  // Health check for AI service
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.config.models.default,
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10
      });

      return response.status === 200;
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;