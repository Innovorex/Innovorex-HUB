// models/User.ts - Comprehensive user model with role-based access control
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  // Basic Information
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  status: 'active' | 'pending' | 'suspended' | 'inactive';

  // Profile Information
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

  // ERPNext Integration
  erpnextId?: string;
  erpnextData?: Record<string, any>;

  // Role-specific Information
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

  // Authentication & Security
  refreshTokens: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerified: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;

  // AI Integration
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

  // Learning Analytics
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

  // Notifications & Communication
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

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthTokens(): Promise<{ accessToken: string; refreshToken: string }>;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const AddressSchema = new Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'United States' }
}, { _id: false });

const EmergencyContactSchema = new Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  relationship: { type: String, required: true, trim: true }
}, { _id: false });

const GoalSchema = new Schema({
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

const AIInteractionSchema = new Schema({
  date: { type: Date, default: Date.now },
  model: { type: String, required: true },
  promptTokens: { type: Number, default: 0 },
  responseTokens: { type: Number, default: 0 },
  appropriatenessScore: { type: Number, min: 0, max: 100, default: 100 }
}, { _id: false });

const UserSchema = new Schema<IUser>({
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
    select: false // Don't include password in queries by default
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
  erpnextData: { type: Schema.Types.Mixed },

  studentInfo: {
    studentId: { type: String, trim: true, unique: true, sparse: true },
    grade: { type: String, trim: true },
    section: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    admissionDate: { type: Date },
    parentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
    children: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
    transform: function(doc, ret) {
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

// Indexes for performance
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ status: 1, role: 1 });
UserSchema.index({ 'studentInfo.studentId': 1 });
UserSchema.index({ 'teacherInfo.employeeId': 1 });
UserSchema.index({ erpnextId: 1 });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ lastActiveAt: 1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
UserSchema.methods.isAccountLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to increment login attempts
UserSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
UserSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date(), lastActiveAt: new Date() }
  });
};

// Static method to find active users by role
UserSchema.statics.findActiveByRole = function(role: string) {
  return this.find({ role, status: 'active' });
};

// Static method for authentication
UserSchema.statics.authenticate = async function(email: string, password: string) {
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

export const User = mongoose.model<IUser>('User', UserSchema);