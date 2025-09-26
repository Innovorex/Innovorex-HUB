import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
    status: 'active' | 'pending' | 'suspended' | 'inactive';
    profile: {
        avatar?: string;
        phone?: string;
        dateOfBirth?: Date;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            zipCode?: string;
            country?: string;
        };
        emergencyContact?: {
            name: string;
            phone: string;
            relationship: string;
        };
    };
    erpnextId?: string;
    erpnextData?: Record<string, any>;
    studentInfo?: {
        studentId: string;
        grade: string;
        section?: string;
        rollNumber?: string;
        admissionDate: Date;
        parentIds: mongoose.Types.ObjectId[];
        subjects: string[];
        currentGPA: number;
        academicYear: string;
    };
    teacherInfo?: {
        employeeId: string;
        department: string;
        subjects: string[];
        qualifications: string[];
        experience: number;
        joinDate: Date;
        classesAssigned: string[];
    };
    parentInfo?: {
        children: mongoose.Types.ObjectId[];
        occupation?: string;
        workplace?: string;
    };
    adminInfo?: {
        permissions: string[];
        level: 'super_admin' | 'principal' | 'vice_principal' | 'department_head';
        departments: string[];
    };
    refreshTokens: string[];
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    emailVerificationToken?: string;
    emailVerified: boolean;
    lastLogin?: Date;
    loginAttempts: number;
    lockUntil?: Date;
    aiPreferences: {
        allowAITutor: boolean;
        aiInteractionHistory: {
            date: Date;
            model: string;
            promptTokens: number;
            responseTokens: number;
            appropriatenessScore: number;
        }[];
        parentalControls: {
            allowDirectAI: boolean;
            requireApproval: boolean;
            restrictedTopics: string[];
        };
    };
    learningAnalytics?: {
        totalStudyHours: number;
        subjectPerformance: Map<string, number>;
        learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
        strengths: string[];
        improvementAreas: string[];
        goals: {
            id: string;
            title: string;
            description: string;
            targetDate: Date;
            progress: number;
            status: 'active' | 'completed' | 'paused';
        }[];
    };
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
        categories: {
            academic: boolean;
            attendance: boolean;
            assignments: boolean;
            events: boolean;
            system: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthTokens(): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    isAccountLocked(): boolean;
    incrementLoginAttempts(): Promise<void>;
    resetLoginAttempts(): Promise<void>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
//# sourceMappingURL=User.d.ts.map