"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerifiedEmail = exports.requireActiveAccount = exports.requireTeacherAccess = exports.requireParentAccess = exports.requireOwnership = exports.requirePermission = exports.authorize = exports.optionalAuth = exports.authenticate = exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("@/models/User");
const logger_1 = require("@/utils/logger");
class AuthMiddleware {
    static async authenticate(req, res, next) {
        try {
            const token = AuthMiddleware.extractToken(req);
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'Access token required'
                });
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await User_1.User.findById(decoded.userId)
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
            req.user = user;
            req.userId = user._id.toString();
            req.userRole = user.role;
            await User_1.User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });
            next();
        }
        catch (error) {
            logger_1.logger.error('Authentication error:', error);
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
                return;
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
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
    static async optionalAuth(req, res, next) {
        const token = AuthMiddleware.extractToken(req);
        if (!token) {
            next();
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await User_1.User.findById(decoded.userId)
                .select('-password -refreshTokens')
                .lean();
            if (user && user.status === 'active') {
                req.user = user;
                req.userId = user._id.toString();
                req.userRole = user.role;
            }
        }
        catch (error) {
            logger_1.logger.debug('Optional auth failed:', error);
        }
        next();
    }
    static authorize(...allowedRoles) {
        return (req, res, next) => {
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
    static requirePermission(permission) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
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
    static requireOwnership(resourceIdParam = 'id') {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const resourceId = req.params[resourceIdParam];
            const userId = req.userId;
            if (req.userRole === 'admin') {
                next();
                return;
            }
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
    static requireParentAccess() {
        return async (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const studentId = req.params.studentId || req.params.id;
            if (req.userRole === 'admin') {
                next();
                return;
            }
            if (req.userRole === 'student' && studentId === req.userId) {
                next();
                return;
            }
            if (req.userRole === 'parent') {
                try {
                    const student = await User_1.User.findById(studentId);
                    if (!student) {
                        res.status(404).json({
                            success: false,
                            message: 'Student not found'
                        });
                        return;
                    }
                    const isParent = student.studentInfo?.parentIds?.some(parentId => parentId.toString() === req.userId);
                    if (!isParent) {
                        res.status(403).json({
                            success: false,
                            message: 'Access denied: You can only access your children\'s data'
                        });
                        return;
                    }
                }
                catch (error) {
                    logger_1.logger.error('Parent access check failed:', error);
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
    static requireTeacherAccess() {
        return async (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            if (req.userRole === 'admin') {
                next();
                return;
            }
            if (req.userRole === 'teacher') {
                const classId = req.params.classId;
                const studentId = req.params.studentId;
                try {
                    const teacher = req.user;
                    const assignedClasses = teacher.teacherInfo?.classesAssigned || [];
                    if (classId && !assignedClasses.includes(classId)) {
                        res.status(403).json({
                            success: false,
                            message: 'Access denied: You can only access your assigned classes'
                        });
                        return;
                    }
                }
                catch (error) {
                    logger_1.logger.error('Teacher access check failed:', error);
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
    static requireActiveAccount(req, res, next) {
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
    static requireVerifiedEmail(req, res, next) {
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
    static extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        const cookieToken = req.cookies?.token;
        if (cookieToken) {
            return cookieToken;
        }
        const queryToken = req.query?.token;
        if (queryToken) {
            return queryToken;
        }
        return null;
    }
    static checkPermission(user, permission) {
        if (user.role === 'admin') {
            return true;
        }
        const rolePermissions = {
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
            admin: []
        };
        const userPermissions = rolePermissions[user.role] || [];
        return userPermissions.includes(permission);
    }
    static generateTokens(user) {
        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });
        const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
        return { accessToken, refreshToken };
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
    }
}
exports.AuthMiddleware = AuthMiddleware;
exports.authenticate = AuthMiddleware.authenticate;
exports.optionalAuth = AuthMiddleware.optionalAuth;
exports.authorize = AuthMiddleware.authorize;
exports.requirePermission = AuthMiddleware.requirePermission;
exports.requireOwnership = AuthMiddleware.requireOwnership;
exports.requireParentAccess = AuthMiddleware.requireParentAccess;
exports.requireTeacherAccess = AuthMiddleware.requireTeacherAccess;
exports.requireActiveAccount = AuthMiddleware.requireActiveAccount;
exports.requireVerifiedEmail = AuthMiddleware.requireVerifiedEmail;
exports.default = AuthMiddleware;
//# sourceMappingURL=auth.js.map