"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_validator_1 = require("express-validator");
const User_1 = require("@/models/User");
const auth_1 = require("@/middleware/auth");
const erpnextService_1 = require("@/services/erpnextService");
const logger_1 = require("@/utils/logger");
const email_1 = require("@/utils/email");
const crypto_1 = __importDefault(require("crypto"));
class AuthController {
    static async register(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { name, email, password, role, ...additionalData } = req.body;
            const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
                return;
            }
            const userData = {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password,
                role,
                status: 'pending',
                emailVerificationToken: crypto_1.default.randomBytes(32).toString('hex'),
                ...additionalData
            };
            switch (role) {
                case 'student':
                    if (!additionalData.studentInfo) {
                        res.status(400).json({
                            success: false,
                            message: 'Student information is required'
                        });
                        return;
                    }
                    userData.studentInfo = {
                        ...additionalData.studentInfo,
                        studentId: `STU${Date.now()}`,
                        admissionDate: new Date(),
                        currentGPA: 0
                    };
                    break;
                case 'teacher':
                    if (!additionalData.teacherInfo) {
                        res.status(400).json({
                            success: false,
                            message: 'Teacher information is required'
                        });
                        return;
                    }
                    userData.teacherInfo = {
                        ...additionalData.teacherInfo,
                        employeeId: `EMP${Date.now()}`,
                        joinDate: new Date(),
                        experience: additionalData.teacherInfo.experience || 0
                    };
                    break;
                case 'parent':
                    if (!additionalData.parentInfo) {
                        res.status(400).json({
                            success: false,
                            message: 'Parent information is required'
                        });
                        return;
                    }
                    userData.parentInfo = additionalData.parentInfo;
                    break;
                case 'admin':
                    userData.status = 'pending';
                    userData.adminInfo = {
                        permissions: [],
                        level: 'department_head',
                        departments: [],
                        ...additionalData.adminInfo
                    };
                    break;
                default:
                    res.status(400).json({
                        success: false,
                        message: 'Invalid role specified'
                    });
                    return;
            }
            const user = new User_1.User(userData);
            await user.save();
            if (role === 'student' || role === 'teacher') {
                try {
                    const erpnextUser = await erpnextService_1.erpnextService.syncUser(user._id.toString(), user, role === 'teacher' ? 'instructor' : 'student');
                    if (erpnextUser?.name) {
                        user.erpnextId = erpnextUser.name;
                        user.erpnextData = erpnextUser;
                        await user.save();
                    }
                }
                catch (erpError) {
                    logger_1.logger.warn(`ERPNext sync failed for user ${user._id}:`, erpError);
                }
            }
            try {
                await (0, email_1.sendEmail)({
                    to: user.email,
                    subject: 'Verify Your Email - AI School Management',
                    template: 'email-verification',
                    data: {
                        name: user.name,
                        verificationToken: user.emailVerificationToken,
                        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`
                    }
                });
            }
            catch (emailError) {
                logger_1.logger.error('Failed to send verification email:', emailError);
            }
            try {
                const admins = await User_1.User.find({ role: 'admin', status: 'active' });
                for (const admin of admins) {
                    await (0, email_1.sendEmail)({
                        to: admin.email,
                        subject: 'New User Registration - Approval Required',
                        template: 'admin-approval-required',
                        data: {
                            adminName: admin.name,
                            newUserName: user.name,
                            newUserEmail: user.email,
                            newUserRole: user.role,
                            approvalUrl: `${process.env.FRONTEND_URL}/admin/users/approve/${user._id}`
                        }
                    });
                }
            }
            catch (notificationError) {
                logger_1.logger.error('Failed to notify admins:', notificationError);
            }
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email for verification and wait for admin approval.',
                data: {
                    userId: user._id,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed. Please try again.'
            });
        }
    }
    static async login(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { email, password } = req.body;
            const user = await User_1.User.authenticate(email.toLowerCase(), password);
            if (user.status === 'pending') {
                res.status(403).json({
                    success: false,
                    message: 'Your account is pending approval. Please wait for admin approval.'
                });
                return;
            }
            if (user.status === 'suspended') {
                res.status(403).json({
                    success: false,
                    message: 'Your account has been suspended. Please contact administration.'
                });
                return;
            }
            if (user.status === 'inactive') {
                res.status(403).json({
                    success: false,
                    message: 'Your account is inactive. Please contact administration.'
                });
                return;
            }
            const { accessToken, refreshToken } = auth_1.AuthMiddleware.generateTokens(user);
            user.refreshTokens.push(refreshToken);
            await user.save();
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            await User_1.User.findByIdAndUpdate(user._id, {
                lastLogin: new Date(),
                lastActiveAt: new Date()
            });
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.status,
                        profile: user.profile,
                        emailVerified: user.emailVerified
                    },
                    accessToken,
                    tokenType: 'Bearer'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            if (error.message === 'Invalid credentials') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }
            if (error.message.includes('Account is temporarily locked')) {
                res.status(423).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Login failed. Please try again.'
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    message: 'Refresh token required'
                });
                return;
            }
            const decoded = auth_1.AuthMiddleware.verifyRefreshToken(refreshToken);
            const user = await User_1.User.findById(decoded.userId);
            if (!user || !user.refreshTokens.includes(refreshToken)) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
                return;
            }
            if (user.status !== 'active') {
                res.status(403).json({
                    success: false,
                    message: 'Account is not active'
                });
                return;
            }
            const { accessToken, refreshToken: newRefreshToken } = auth_1.AuthMiddleware.generateTokens(user);
            user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
            user.refreshTokens.push(newRefreshToken);
            await user.save();
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken,
                    tokenType: 'Bearer'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                message: 'Token refresh failed'
            });
        }
    }
    static async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken && req.userId) {
                await User_1.User.findByIdAndUpdate(req.userId, {
                    $pull: { refreshTokens: refreshToken }
                });
            }
            res.clearCookie('refreshToken');
            res.json({
                success: true,
                message: 'Logout successful'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }
    static async logoutAll(req, res) {
        try {
            if (!req.userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            await User_1.User.findByIdAndUpdate(req.userId, {
                refreshTokens: []
            });
            res.clearCookie('refreshToken');
            res.json({
                success: true,
                message: 'Logged out from all devices'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout all error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }
    static async verifyEmail(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                res.status(400).json({
                    success: false,
                    message: 'Verification token required'
                });
                return;
            }
            const user = await User_1.User.findOne({
                emailVerificationToken: token,
                emailVerified: false
            });
            if (!user) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or expired verification token'
                });
                return;
            }
            user.emailVerified = true;
            user.emailVerificationToken = undefined;
            await user.save();
            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Email verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Email verification failed'
            });
        }
    }
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await User_1.User.findOne({
                email: email.toLowerCase(),
                status: { $ne: 'inactive' }
            });
            res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
            if (!user) {
                return;
            }
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            user.passwordResetToken = resetToken;
            user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
            await user.save();
            try {
                await (0, email_1.sendEmail)({
                    to: user.email,
                    subject: 'Password Reset - AI School Management',
                    template: 'password-reset',
                    data: {
                        name: user.name,
                        resetToken,
                        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
                        expiresIn: '30 minutes'
                    }
                });
            }
            catch (emailError) {
                logger_1.logger.error('Failed to send password reset email:', emailError);
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                await user.save();
            }
        }
        catch (error) {
            logger_1.logger.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Password reset request failed'
            });
        }
    }
    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Reset token and new password are required'
                });
                return;
            }
            const user = await User_1.User.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: new Date() }
            });
            if (!user) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
                return;
            }
            user.password = password;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            user.refreshTokens = [];
            await user.save();
            res.json({
                success: true,
                message: 'Password reset successful. Please log in with your new password.'
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                message: 'Password reset failed'
            });
        }
    }
    static async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    user: req.user
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get profile'
            });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user || !req.userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const allowedUpdates = ['name', 'profile', 'notifications'];
            const updates = {};
            for (const key of allowedUpdates) {
                if (req.body[key] !== undefined) {
                    updates[key] = req.body[key];
                }
            }
            if (Object.keys(updates).length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No valid updates provided'
                });
                return;
            }
            const user = await User_1.User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true, runValidators: true }).select('-password -refreshTokens');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { user }
            });
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Profile update failed'
            });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user || !req.userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            const user = await User_1.User.findById(req.userId).select('+password');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
                return;
            }
            user.password = newPassword;
            const currentRefreshToken = req.cookies.refreshToken;
            user.refreshTokens = currentRefreshToken ? [currentRefreshToken] : [];
            await user.save();
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Password change failed'
            });
        }
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
//# sourceMappingURL=authController.js.map