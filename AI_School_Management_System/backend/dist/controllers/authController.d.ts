import { Request, Response } from 'express';
export declare class AuthController {
    static register(req: Request, res: Response): Promise<void>;
    static login(req: Request, res: Response): Promise<void>;
    static refreshToken(req: Request, res: Response): Promise<void>;
    static logout(req: Request, res: Response): Promise<void>;
    static logoutAll(req: Request, res: Response): Promise<void>;
    static verifyEmail(req: Request, res: Response): Promise<void>;
    static forgotPassword(req: Request, res: Response): Promise<void>;
    static resetPassword(req: Request, res: Response): Promise<void>;
    static getProfile(req: Request, res: Response): Promise<void>;
    static updateProfile(req: Request, res: Response): Promise<void>;
    static changePassword(req: Request, res: Response): Promise<void>;
}
export default AuthController;
//# sourceMappingURL=authController.d.ts.map