// services/erpnextService.ts - ERPNext integration service
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '@/utils/logger';

interface ERPNextConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  username?: string;
  password?: string;
}

interface ERPNextResponse<T = any> {
  message: T;
  exc?: string;
  exc_type?: string;
  _server_messages?: string;
}

interface StudentData {
  name: string;
  student_name: string;
  student_email_id: string;
  mobile_number?: string;
  date_of_birth?: string;
  gender?: string;
  student_category?: string;
  program?: string;
  academic_year?: string;
  student_batch_name?: string;
  parent_guardian?: string;
  parent_guardian_name?: string;
  parent_mobile_number?: string;
  current_address?: string;
}

interface TeacherData {
  name: string;
  instructor_name: string;
  email?: string;
  mobile_no?: string;
  date_of_joining?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience?: number;
}

interface CourseData {
  name: string;
  course_name: string;
  course_code?: string;
  department?: string;
  duration?: number;
  course_intro?: string;
  learning_outcomes?: string;
}

interface ProgramEnrollmentData {
  student: string;
  program: string;
  academic_year: string;
  academic_term?: string;
  enrollment_date?: string;
  student_batch_name?: string;
  student_category?: string;
}

class ERPNextService {
  private client: AxiosInstance;
  private config: ERPNextConfig;

  constructor() {
    this.config = {
      url: process.env.ERPNEXT_URL || 'https://erpeducation.innovorex.co.in',
      apiKey: process.env.ERPNEXT_API_KEY || '4f48dc387a162db',
      apiSecret: process.env.ERPNEXT_API_SECRET || '3dff1a1cc12600f',
      username: process.env.ERPNEXT_USERNAME,
      password: process.env.ERPNEXT_PASSWORD
    };

    this.client = axios.create({
      baseURL: this.config.url,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add API key authentication
        config.headers['Authorization'] = `token ${this.config.apiKey}:${this.config.apiSecret}`;

        logger.debug(`ERPNext API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('ERPNext Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`ERPNext API Response: ${response.status} ${response.config.url}`);

        // Check for ERPNext-specific errors in response
        if (response.data?.exc) {
          const error = new Error(response.data.exc);
          error.name = 'ERPNextError';
          throw error;
        }

        return response;
      },
      (error) => {
        logger.error('ERPNext Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });

        return Promise.reject(error);
      }
    );
  }

  // Generic API methods
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.get<ERPNextResponse<T>>(endpoint, { params });
      return response.data.message;
    } catch (error) {
      logger.error(`ERPNext GET ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }

  async post<T = any>(endpoint: string, data: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.post<ERPNextResponse<T>>(endpoint, data);
      return response.data.message;
    } catch (error) {
      logger.error(`ERPNext POST ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }

  async put<T = any>(endpoint: string, data: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.put<ERPNextResponse<T>>(endpoint, data);
      return response.data.message;
    } catch (error) {
      logger.error(`ERPNext PUT ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.delete<ERPNextResponse<T>>(endpoint);
      return response.data.message;
    } catch (error) {
      logger.error(`ERPNext DELETE ${endpoint} failed:`, error);
      throw this.handleError(error);
    }
  }

  // Student Management
  async getStudents(filters?: Record<string, any>): Promise<StudentData[]> {
    const params = {
      fields: JSON.stringify([
        'name', 'student_name', 'student_email_id', 'mobile_number',
        'date_of_birth', 'gender', 'student_category', 'program',
        'academic_year', 'student_batch_name', 'parent_guardian',
        'parent_guardian_name', 'parent_mobile_number', 'current_address'
      ]),
      filters: filters ? JSON.stringify(filters) : undefined,
      limit_page_length: 'None'
    };

    return this.get<StudentData[]>('/api/resource/Student', params);
  }

  async getStudent(studentId: string): Promise<StudentData> {
    return this.get<StudentData>(`/api/resource/Student/${studentId}`);
  }

  async createStudent(studentData: Partial<StudentData>): Promise<StudentData> {
    return this.post<StudentData>('/api/resource/Student', studentData);
  }

  async updateStudent(studentId: string, updateData: Partial<StudentData>): Promise<StudentData> {
    return this.put<StudentData>(`/api/resource/Student/${studentId}`, updateData);
  }

  // Teacher/Instructor Management
  async getInstructors(filters?: Record<string, any>): Promise<TeacherData[]> {
    const params = {
      fields: JSON.stringify([
        'name', 'instructor_name', 'email', 'mobile_no',
        'date_of_joining', 'department', 'designation',
        'qualification', 'experience'
      ]),
      filters: filters ? JSON.stringify(filters) : undefined,
      limit_page_length: 'None'
    };

    return this.get<TeacherData[]>('/api/resource/Instructor', params);
  }

  async getInstructor(instructorId: string): Promise<TeacherData> {
    return this.get<TeacherData>(`/api/resource/Instructor/${instructorId}`);
  }

  async createInstructor(instructorData: Partial<TeacherData>): Promise<TeacherData> {
    return this.post<TeacherData>('/api/resource/Instructor', instructorData);
  }

  async updateInstructor(instructorId: string, updateData: Partial<TeacherData>): Promise<TeacherData> {
    return this.put<TeacherData>(`/api/resource/Instructor/${instructorId}`, updateData);
  }

  // Course Management
  async getCourses(filters?: Record<string, any>): Promise<CourseData[]> {
    const params = {
      fields: JSON.stringify([
        'name', 'course_name', 'course_code', 'department',
        'duration', 'course_intro', 'learning_outcomes'
      ]),
      filters: filters ? JSON.stringify(filters) : undefined,
      limit_page_length: 'None'
    };

    return this.get<CourseData[]>('/api/resource/Course', params);
  }

  async getCourse(courseId: string): Promise<CourseData> {
    return this.get<CourseData>(`/api/resource/Course/${courseId}`);
  }

  // Program Enrollment
  async getStudentEnrollments(studentId?: string): Promise<ProgramEnrollmentData[]> {
    const filters = studentId ? { student: studentId } : undefined;
    const params = {
      fields: JSON.stringify([
        'student', 'program', 'academic_year', 'academic_term',
        'enrollment_date', 'student_batch_name', 'student_category'
      ]),
      filters: filters ? JSON.stringify(filters) : undefined,
      limit_page_length: 'None'
    };

    return this.get<ProgramEnrollmentData[]>('/api/resource/Program Enrollment', params);
  }

  async enrollStudent(enrollmentData: ProgramEnrollmentData): Promise<ProgramEnrollmentData> {
    return this.post<ProgramEnrollmentData>('/api/resource/Program Enrollment', enrollmentData);
  }

  // Academic Year and Terms
  async getAcademicYears(): Promise<any[]> {
    return this.get('/api/resource/Academic Year', {
      fields: JSON.stringify(['name', 'year_start_date', 'year_end_date']),
      limit_page_length: 'None'
    });
  }

  async getAcademicTerms(academicYear?: string): Promise<any[]> {
    const filters = academicYear ? { academic_year: academicYear } : undefined;
    return this.get('/api/resource/Academic Term', {
      fields: JSON.stringify(['name', 'academic_year', 'term_start_date', 'term_end_date']),
      filters: filters ? JSON.stringify(filters) : undefined,
      limit_page_length: 'None'
    });
  }

  // Attendance Management
  async getStudentAttendance(studentId: string, fromDate?: string, toDate?: string): Promise<any[]> {
    const filters: any = { student: studentId };
    if (fromDate) filters.date = ['>=', fromDate];
    if (toDate) filters.date = ['<=', toDate];

    return this.get('/api/resource/Student Attendance', {
      fields: JSON.stringify(['student', 'date', 'status', 'course_schedule']),
      filters: JSON.stringify(filters),
      limit_page_length: 'None'
    });
  }

  async markAttendance(attendanceData: any): Promise<any> {
    return this.post('/api/resource/Student Attendance', attendanceData);
  }

  // Assessment and Grades
  async getStudentAssessments(studentId: string, academicYear?: string): Promise<any[]> {
    const filters: any = { student: studentId };
    if (academicYear) filters.academic_year = academicYear;

    return this.get('/api/resource/Assessment Result', {
      fields: JSON.stringify([
        'student', 'assessment_plan', 'course', 'grade',
        'total_score', 'maximum_score', 'academic_year'
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: 'None'
    });
  }

  // Fee Management
  async getStudentFees(studentId: string): Promise<any[]> {
    return this.get('/api/resource/Fees', {
      fields: JSON.stringify([
        'student', 'academic_year', 'academic_term',
        'total_amount', 'paid_amount', 'outstanding_amount', 'due_date'
      ]),
      filters: JSON.stringify({ student: studentId }),
      limit_page_length: 'None'
    });
  }

  // Curriculum and Course Schedule
  async getCourseSchedule(filters?: Record<string, any>): Promise<any[]> {
    return this.get('/api/resource/Course Schedule', {
      fields: JSON.stringify([
        'course', 'instructor', 'room', 'schedule_date',
        'from_time', 'to_time', 'student_group', 'color'
      ]),
      filters: filters ? JSON.stringify(filters) : undefined,
      limit_page_length: 'None'
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/api/method/ping');
      return true;
    } catch (error) {
      logger.error('ERPNext health check failed:', error);
      return false;
    }
  }

  // Sync user data between our system and ERPNext
  async syncUser(userId: string, userData: any, userType: 'student' | 'instructor'): Promise<any> {
    try {
      if (userType === 'student') {
        const studentData: Partial<StudentData> = {
          student_name: userData.name,
          student_email_id: userData.email,
          mobile_number: userData.profile?.phone,
          date_of_birth: userData.profile?.dateOfBirth,
          // Map other fields as needed
        };

        if (userData.erpnextId) {
          return await this.updateStudent(userData.erpnextId, studentData);
        } else {
          return await this.createStudent(studentData);
        }
      } else if (userType === 'instructor') {
        const instructorData: Partial<TeacherData> = {
          instructor_name: userData.name,
          email: userData.email,
          mobile_no: userData.profile?.phone,
          department: userData.teacherInfo?.department,
          // Map other fields as needed
        };

        if (userData.erpnextId) {
          return await this.updateInstructor(userData.erpnextId, instructorData);
        } else {
          return await this.createInstructor(instructorData);
        }
      }
    } catch (error) {
      logger.error(`Failed to sync ${userType} ${userId} with ERPNext:`, error);
      throw error;
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.exc) {
      const erpError = new Error(error.response.data.exc);
      erpError.name = 'ERPNextError';
      return erpError;
    }

    if (error.code === 'ECONNREFUSED') {
      const connError = new Error('Unable to connect to ERPNext server');
      connError.name = 'ERPNextConnectionError';
      return connError;
    }

    return error;
  }
}

// Export singleton instance
export const erpnextService = new ERPNextService();
export default erpnextService;