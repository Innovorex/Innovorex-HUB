// middleware/auth.ts - Authentication and authorization middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '@/models/User';
import { logger } from '@/utils/logger';

// Extend Express Request type to include user
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

export class AuthMiddleware {
  // Verify JWT token and attach user to request
  static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = AuthMiddleware.extractToken(req);

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access token required'
        });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      // Find user and check if still active
      const user = await User.findById(decoded.userId)
        .select('-password -refreshTokens')
        .lean();

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
        return;
      }

      if (user.status !== 'active') {
        res.status(401).json({
          success: false,
          message: `Account is ${user.status}. Please contact administration.`
        });
        return;
      }

      // Attach user information to request
      req.user = user as IUser;
      req.userId = user._id.toString();
      req.userRole = user.role;

      // Update last active timestamp
      await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });

      next();
    } catch (error) {
      logger.error('Authentication error:', error);

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
        return;
      }

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expired'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }

  // Optional authentication - doesn't fail if no token
  static async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = AuthMiddleware.extractToken(req);

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const user = await User.findById(decoded.userId)
        .select('-password -refreshTokens')
        .lean();

      if (user && user.status === 'active') {
        req.user = user as IUser;
        req.userId = user._id.toString();
        req.userRole = user.role;
      }
    } catch (error) {
      // Ignore errors in optional auth
      logger.debug('Optional auth failed:', error);
    }

    next();
  }

  // Role-based authorization
  static authorize(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user || !req.userRole) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!allowedRoles.includes(req.userRole)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  }

  // Permission-based authorization for granular access
  static requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user has the required permission
      const hasPermission = AuthMiddleware.checkPermission(req.user, permission);

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `Permission '${permission}' required`
        });
        return;
      }

      next();
    };
  }

  // Resource ownership check
  static requireOwnership(resourceIdParam: string = 'id') {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.userId;

      // Admin can access any resource
      if (req.userRole === 'admin') {
        next();
        return;
      }

      // Check if user owns the resource
      if (resourceId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own resources'
        });
        return;
      }

      next();
    };
  }

  // Parent access to child resources
  static requireParentAccess() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const studentId = req.params.studentId || req.params.id;

      // Admin can access any student
      if (req.userRole === 'admin') {
        next();
        return;
      }

      // Student can access their own data
      if (req.userRole === 'student' && studentId === req.userId) {
        next();
        return;
      }

      // Parent can access their children's data
      if (req.userRole === 'parent') {
        try {
          const student = await User.findById(studentId);
          if (!student) {
            res.status(404).json({
              success: false,
              message: 'Student not found'
            });
            return;
          }

          const isParent = student.studentInfo?.parentIds?.some(
            parentId => parentId.toString() === req.userId
          );

          if (!isParent) {
            res.status(403).json({
              success: false,
              message: 'Access denied: You can only access your children\'s data'
            });
            return;
          }
        } catch (error) {
          logger.error('Parent access check failed:', error);
          res.status(500).json({
            success: false,
            message: 'Access validation failed'
          });
          return;
        }
      }

      next();
    };
  }

  // Teacher access to their students
  static requireTeacherAccess() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Admin can access anything
      if (req.userRole === 'admin') {
        next();
        return;
      }

      // Teacher can access their assigned classes/students
      if (req.userRole === 'teacher') {
        const classId = req.params.classId;
        const studentId = req.params.studentId;

        try {
          // Check if teacher has access to the class or student
          const teacher = req.user;
          const assignedClasses = teacher.teacherInfo?.classesAssigned || [];

          if (classId && !assignedClasses.includes(classId)) {
            res.status(403).json({
              success: false,
              message: 'Access denied: You can only access your assigned classes'
            });
            return;
          }

          // Additional checks for student access can be added here
          // For now, allow if teacher has any assigned classes
        } catch (error) {
          logger.error('Teacher access check failed:', error);
          res.status(500).json({
            success: false,
            message: 'Access validation failed'
          });
          return;
        }
      }

      next();
    };
  }

  // Account status check
  static requireActiveAccount(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (req.user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Account is ${req.user.status}. Please contact administration.`
      });
      return;
    }

    next();
  }

  // Email verification check
  static requireVerifiedEmail(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!req.user.emailVerified) {
      res.status(403).json({
        success: false,
        message: 'Email verification required'
      });
      return;
    }

    next();
  }

  // Helper methods
  private static extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies
    const cookieToken = req.cookies?.token;
    if (cookieToken) {
      return cookieToken;
    }

    // Check query parameter (for websocket connections)
    const queryToken = req.query?.token as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }

  private static checkPermission(user: IUser, permission: string): boolean {
    // Admin has all permissions
    if (user.role === 'admin') {
      return true;
    }

    // Check specific permissions based on role
    const rolePermissions: Record<string, string[]> = {
      student: [
        'read:own_profile',
        'update:own_profile',
        'read:own_grades',
        'read:own_attendance',
        'create:ai_chat',
        'read:assignments'
      ],
      teacher: [
        'read:own_profile',
        'update:own_profile',
        'read:assigned_classes',
        'update:assigned_classes',
        'create:assignments',
        'update:assignments',
        'read:student_progress',
        'update:grades',
        'read:attendance',
        'update:attendance'
      ],
      parent: [
        'read:own_profile',
        'update:own_profile',
        'read:child_progress',
        'read:child_grades',
        'read:child_attendance',
        'communicate:teachers'
      ],
      admin: [] // Admin has all permissions by default
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  }

  // Generate JWT tokens
  static generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
  }
}

// Export individual middleware functions for convenience
export const authenticate = AuthMiddleware.authenticate;
export const optionalAuth = AuthMiddleware.optionalAuth;
export const authorize = AuthMiddleware.authorize;
export const requirePermission = AuthMiddleware.requirePermission;
export const requireOwnership = AuthMiddleware.requireOwnership;
export const requireParentAccess = AuthMiddleware.requireParentAccess;
export const requireTeacherAccess = AuthMiddleware.requireTeacherAccess;
export const requireActiveAccount = AuthMiddleware.requireActiveAccount;
export const requireVerifiedEmail = AuthMiddleware.requireVerifiedEmail;

export default AuthMiddleware;