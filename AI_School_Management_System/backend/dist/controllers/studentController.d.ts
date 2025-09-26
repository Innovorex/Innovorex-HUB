import { Request, Response } from 'express';
export declare class StudentController {
    static getDashboard(req: Request, res: Response): Promise<void>;
    static getProgress(req: Request, res: Response): Promise<void>;
    static getAttendance(req: Request, res: Response): Promise<void>;
    static getGrades(req: Request, res: Response): Promise<void>;
    static updateGoals(req: Request, res: Response): Promise<void>;
    static getSchedule(req: Request, res: Response): Promise<void>;
    private static getERPNextData;
    private static generateProgressData;
    private static generateCollaborationMetrics;
    private static generateIndependenceMetrics;
    private static getUpcomingSchedule;
    private static getRecentAchievements;
    private static getDetailedProgress;
    private static processAttendanceData;
    private static calculateAttendanceSummary;
    private static processGradesData;
    private static calculateGPA;
    private static generateGradesSummary;
    private static filterStudentSchedule;
    private static generateMockSchedule;
    private static calculateMockGPA;
    private static generateMockUnderstanding;
    private static generateTrend;
    private static getSubjectColor;
}
export default StudentController;
//# sourceMappingURL=studentController.d.ts.map