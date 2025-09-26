import { Request, Response } from 'express';
export declare class AIController {
    static chat(req: Request, res: Response): Promise<void>;
    static getChatHistory(req: Request, res: Response): Promise<void>;
    static getStudySuggestions(req: Request, res: Response): Promise<void>;
    static analyzePerformance(req: Request, res: Response): Promise<void>;
    static getAIStats(req: Request, res: Response): Promise<void>;
    static updateAIPreferences(req: Request, res: Response): Promise<void>;
    static healthCheck(req: Request, res: Response): Promise<void>;
    private static canAccessStudentAI;
    private static canUpdateStudentAI;
    private static requestParentApproval;
}
export default AIController;
//# sourceMappingURL=aiController.d.ts.map