// controllers/authController.ts - Authentication controller
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User, IUser } from '@/models/User';
import { AuthMiddleware } from '@/middleware/auth';
import { erpnextService } from '@/services/erpnextService';
import { logger } from '@/utils/logger';
import { sendEmail } from '@/utils/email';
import crypto from 'crypto';

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { name, email, password, role, ...additionalData } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Create user data
      const userData: any = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
        status: 'pending', // Require admin approval
        emailVerificationToken: crypto.randomBytes(32).toString('hex'),
        ...additionalData
      };

      // Role-specific data validation and setup
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
            studentId: `STU${Date.now()}`, // Generate unique student ID
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
            employeeId: `EMP${Date.now()}`, // Generate unique employee ID
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
          // Admin accounts require special approval
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

      // Create user
      const user = new User(userData);
      await user.save();

      // Try to sync with ERPNext (non-blocking)
      if (role === 'student' || role === 'teacher') {
        try {
          const erpnextUser = await erpnextService.syncUser(
            user._id.toString(),
            user,
            role === 'teacher' ? 'instructor' : 'student'
          );

          if (erpnextUser?.name) {
            user.erpnextId = erpnextUser.name;
            user.erpnextData = erpnextUser;
            await user.save();
          }
        } catch (erpError) {
          logger.warn(`ERPNext sync failed for user ${user._id}:`, erpError);
          // Continue with registration even if ERPNext sync fails
        }
      }

      // Send email verification
      try {
        await sendEmail({
          to: user.email,
          subject: 'Verify Your Email - AI School Management',
          template: 'email-verification',
          data: {
            name: user.name,
            verificationToken: user.emailVerificationToken,
            verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`
          }
        });
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }

      // Notify admins of new registration
      try {
        const admins = await User.find({ role: 'admin', status: 'active' });
        for (const admin of admins) {
          await sendEmail({
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
      } catch (notificationError) {
        logger.error('Failed to notify admins:', notificationError);
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

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      // Authenticate user
      const user = await (User as any).authenticate(email.toLowerCase(), password);

      // Check account status
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

      // Generate tokens
      const { accessToken, refreshToken } = AuthMiddleware.generateTokens(user);

      // Save refresh token
      user.refreshTokens.push(refreshToken);
      await user.save();

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Update last login
      await User.findByIdAndUpdate(user._id, {
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

    } catch (error) {
      logger.error('Login error:', error);

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

  // Refresh access token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      // Verify refresh token
      const decoded = AuthMiddleware.verifyRefreshToken(refreshToken);

      // Find user and check if refresh token is valid
      const user = await User.findById(decoded.userId);
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

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = AuthMiddleware.generateTokens(user);

      // Replace old refresh token with new one
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      user.refreshTokens.push(newRefreshToken);
      await user.save();

      // Set new refresh token cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          tokenType: 'Bearer'
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  }

  // Logout user
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken && req.userId) {
        // Remove refresh token from database
        await User.findByIdAndUpdate(req.userId, {
          $pull: { refreshTokens: refreshToken }
        });
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Logout from all devices
  static async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Clear all refresh tokens
      await User.findByIdAndUpdate(req.userId, {
        refreshTokens: []
      });

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logged out from all devices'
      });

    } catch (error) {
      logger.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Verify email
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Verification token required'
        });
        return;
      }

      const user = await User.findOne({
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

      // Mark email as verified
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed'
      });
    }
  }

  // Request password reset
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await User.findOne({
        email: email.toLowerCase(),
        status: { $ne: 'inactive' }
      });

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

      if (!user) {
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await user.save();

      // Send reset email
      try {
        await sendEmail({
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
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        // Reset the token if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
      }

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset request failed'
      });
    }
  }

  // Reset password
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          message: 'Reset token and new password are required'
        });
        return;
      }

      const user = await User.findOne({
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

      // Update password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      // Clear all refresh tokens to force re-login
      user.refreshTokens = [];

      await user.save();

      res.json({
        success: true,
        message: 'Password reset successful. Please log in with your new password.'
      });

    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed'
      });
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const allowedUpdates = ['name', 'profile', 'notifications'];
      const updates: any = {};

      // Filter allowed updates
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

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');

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

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Profile update failed'
      });
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.userId).select('+password');
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      user.password = newPassword;

      // Clear all refresh tokens except current session
      const currentRefreshToken = req.cookies.refreshToken;
      user.refreshTokens = currentRefreshToken ? [currentRefreshToken] : [];

      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password change failed'
      });
    }
  }
}

export default AuthController;