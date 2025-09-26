import { Request, Response, NextFunction } from 'express';
import { IUser } from '@/models/User';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            userId?: string;
            userRole?: string;
        }
    }
}
interface JWTPayload {
    userId: string;
    role: string;
    email: string;
    iat: number;
    exp: number;
}
export declare class AuthMiddleware {
    static authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
    static optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
    static authorize(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
    static requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => void;
    static requireOwnership(resourceIdParam?: string): (req: Request, res: Response, next: NextFunction) => void;
    static requireParentAccess(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    static requireTeacherAccess(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    static requireActiveAccount(req: Request, res: Response, next: NextFunction): void;
    static requireVerifiedEmail(req: Request, res: Response, next: NextFunction): void;
    private static extractToken;
    private static checkPermission;
    static generateTokens(user: IUser): {
        accessToken: string;
        refreshToken: string;
    };
    static verifyRefreshToken(token: string): JWTPayload;
}
export declare const authenticate: typeof AuthMiddleware.authenticate;
export declare const optionalAuth: typeof AuthMiddleware.optionalAuth;
export declare const authorize: typeof AuthMiddleware.authorize;
export declare const requirePermission: typeof AuthMiddleware.requirePermission;
export declare const requireOwnership: typeof AuthMiddleware.requireOwnership;
export declare const requireParentAccess: typeof AuthMiddleware.requireParentAccess;
export declare const requireTeacherAccess: typeof AuthMiddleware.requireTeacherAccess;
export declare const requireActiveAccount: typeof AuthMiddleware.requireActiveAccount;
export declare const requireVerifiedEmail: typeof AuthMiddleware.requireVerifiedEmail;
export default AuthMiddleware;
//# sourceMappingURL=auth.d.ts.map