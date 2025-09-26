"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AddressSchema = new mongoose_1.Schema({
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'United States' }
}, { _id: false });
const EmergencyContactSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true }
}, { _id: false });
const GoalSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    targetDate: { type: Date, required: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: {
        type: String,
        enum: ['active', 'completed', 'paused'],
        default: 'active'
    }
}, { _id: false });
const AIInteractionSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now },
    model: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    responseTokens: { type: Number, default: 0 },
    appropriatenessScore: { type: Number, min: 0, max: 100, default: 100 }
}, { _id: false });
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: {
            values: ['student', 'teacher', 'parent', 'admin'],
            message: 'Role must be student, teacher, parent, or admin'
        },
        required: [true, 'Role is required'],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'pending', 'suspended', 'inactive'],
            message: 'Status must be active, pending, suspended, or inactive'
        },
        default: 'pending',
        index: true
    },
    profile: {
        avatar: { type: String, trim: true },
        phone: {
            type: String,
            trim: true,
            match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
        },
        dateOfBirth: { type: Date },
        address: AddressSchema,
        emergencyContact: EmergencyContactSchema
    },
    erpnextId: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        index: true
    },
    erpnextData: { type: mongoose_1.Schema.Types.Mixed },
    studentInfo: {
        studentId: { type: String, trim: true, unique: true, sparse: true },
        grade: { type: String, trim: true },
        section: { type: String, trim: true },
        rollNumber: { type: String, trim: true },
        admissionDate: { type: Date },
        parentIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
        subjects: [{ type: String, trim: true }],
        currentGPA: { type: Number, min: 0, max: 4.0, default: 0 },
        academicYear: { type: String, trim: true }
    },
    teacherInfo: {
        employeeId: { type: String, trim: true, unique: true, sparse: true },
        department: { type: String, trim: true },
        subjects: [{ type: String, trim: true }],
        qualifications: [{ type: String, trim: true }],
        experience: { type: Number, min: 0, default: 0 },
        joinDate: { type: Date },
        classesAssigned: [{ type: String, trim: true }]
    },
    parentInfo: {
        children: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
        occupation: { type: String, trim: true },
        workplace: { type: String, trim: true }
    },
    adminInfo: {
        permissions: [{ type: String, trim: true }],
        level: {
            type: String,
            enum: ['super_admin', 'principal', 'vice_principal', 'department_head']
        },
        departments: [{ type: String, trim: true }]
    },
    refreshTokens: [{ type: String }],
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    aiPreferences: {
        allowAITutor: { type: Boolean, default: true },
        aiInteractionHistory: [AIInteractionSchema],
        parentalControls: {
            allowDirectAI: { type: Boolean, default: true },
            requireApproval: { type: Boolean, default: false },
            restrictedTopics: [{ type: String, trim: true }]
        }
    },
    learningAnalytics: {
        totalStudyHours: { type: Number, default: 0 },
        subjectPerformance: {
            type: Map,
            of: Number,
            default: new Map()
        },
        learningStyle: {
            type: String,
            enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
            default: 'visual'
        },
        strengths: [{ type: String, trim: true }],
        improvementAreas: [{ type: String, trim: true }],
        goals: [GoalSchema]
    },
    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        categories: {
            academic: { type: Boolean, default: true },
            attendance: { type: Boolean, default: true },
            assignments: { type: Boolean, default: true },
            events: { type: Boolean, default: true },
            system: { type: Boolean, default: false }
        }
    },
    lastActiveAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.refreshTokens;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.emailVerificationToken;
            return ret;
        }
    },
    toObject: { virtuals: true }
});
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ status: 1, role: 1 });
UserSchema.index({ 'studentInfo.studentId': 1 });
UserSchema.index({ 'teacherInfo.employeeId': 1 });
UserSchema.index({ erpnextId: 1 });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ lastActiveAt: 1 });
UserSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > new Date());
});
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
UserSchema.methods.isAccountLocked = function () {
    return !!(this.lockUntil && this.lockUntil > new Date());
};
UserSchema.methods.incrementLoginAttempts = async function () {
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000;
    if (this.lockUntil && this.lockUntil < new Date()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    const updates = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
        updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
    }
    return this.updateOne(updates);
};
UserSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { lastLogin: new Date(), lastActiveAt: new Date() }
    });
};
UserSchema.statics.findActiveByRole = function (role) {
    return this.find({ role, status: 'active' });
};
UserSchema.statics.authenticate = async function (email, password) {
    const user = await this.findOne({ email, status: { $ne: 'inactive' } }).select('+password');
    if (!user) {
        throw new Error('Invalid credentials');
    }
    if (user.isAccountLocked()) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        await user.incrementLoginAttempts();
        throw new Error('Invalid credentials');
    }
    if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
    }
    return user;
};
exports.User = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map