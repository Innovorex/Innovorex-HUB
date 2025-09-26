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
declare class AIService {
    private client;
    private config;
    constructor();
    private setupInterceptors;
    tutorChat(message: string, context: TutorContext, conversationHistory?: ChatMessage[]): Promise<AIResponse>;
    generateStudySuggestions(studentId: string, subject?: string): Promise<string[]>;
    analyzeStudentPerformance(studentId: string, assessmentData: any): Promise<any>;
    private checkContentSafety;
    private buildEducationalPrompt;
    private analyzeResponse;
    private logAIInteraction;
    getStudentAIStats(studentId: string): Promise<any>;
    healthCheck(): Promise<boolean>;
}
export declare const aiService: AIService;
export default aiService;
//# sourceMappingURL=aiService.d.ts.map