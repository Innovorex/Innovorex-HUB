"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.erpnextService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@/utils/logger");
class ERPNextService {
    constructor() {
        this.config = {
            url: process.env.ERPNEXT_URL || 'https://erpeducation.innovorex.co.in',
            apiKey: process.env.ERPNEXT_API_KEY || '4f48dc387a162db',
            apiSecret: process.env.ERPNEXT_API_SECRET || '3dff1a1cc12600f',
            username: process.env.ERPNEXT_USERNAME,
            password: process.env.ERPNEXT_PASSWORD
        };
        this.client = axios_1.default.create({
            baseURL: this.config.url,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.client.interceptors.request.use((config) => {
            config.headers['Authorization'] = `token ${this.config.apiKey}:${this.config.apiSecret}`;
            logger_1.logger.debug(`ERPNext API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            logger_1.logger.error('ERPNext Request Error:', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug(`ERPNext API Response: ${response.status} ${response.config.url}`);
            if (response.data?.exc) {
                const error = new Error(response.data.exc);
                error.name = 'ERPNextError';
                throw error;
            }
            return response;
        }, (error) => {
            logger_1.logger.error('ERPNext Response Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url
            });
            return Promise.reject(error);
        });
    }
    async get(endpoint, params) {
        try {
            const response = await this.client.get(endpoint, { params });
            return response.data.message;
        }
        catch (error) {
            logger_1.logger.error(`ERPNext GET ${endpoint} failed:`, error);
            throw this.handleError(error);
        }
    }
    async post(endpoint, data) {
        try {
            const response = await this.client.post(endpoint, data);
            return response.data.message;
        }
        catch (error) {
            logger_1.logger.error(`ERPNext POST ${endpoint} failed:`, error);
            throw this.handleError(error);
        }
    }
    async put(endpoint, data) {
        try {
            const response = await this.client.put(endpoint, data);
            return response.data.message;
        }
        catch (error) {
            logger_1.logger.error(`ERPNext PUT ${endpoint} failed:`, error);
            throw this.handleError(error);
        }
    }
    async delete(endpoint) {
        try {
            const response = await this.client.delete(endpoint);
            return response.data.message;
        }
        catch (error) {
            logger_1.logger.error(`ERPNext DELETE ${endpoint} failed:`, error);
            throw this.handleError(error);
        }
    }
    async getStudents(filters) {
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
        return this.get('/api/resource/Student', params);
    }
    async getStudent(studentId) {
        return this.get(`/api/resource/Student/${studentId}`);
    }
    async createStudent(studentData) {
        return this.post('/api/resource/Student', studentData);
    }
    async updateStudent(studentId, updateData) {
        return this.put(`/api/resource/Student/${studentId}`, updateData);
    }
    async getInstructors(filters) {
        const params = {
            fields: JSON.stringify([
                'name', 'instructor_name', 'email', 'mobile_no',
                'date_of_joining', 'department', 'designation',
                'qualification', 'experience'
            ]),
            filters: filters ? JSON.stringify(filters) : undefined,
            limit_page_length: 'None'
        };
        return this.get('/api/resource/Instructor', params);
    }
    async getInstructor(instructorId) {
        return this.get(`/api/resource/Instructor/${instructorId}`);
    }
    async createInstructor(instructorData) {
        return this.post('/api/resource/Instructor', instructorData);
    }
    async updateInstructor(instructorId, updateData) {
        return this.put(`/api/resource/Instructor/${instructorId}`, updateData);
    }
    async getCourses(filters) {
        const params = {
            fields: JSON.stringify([
                'name', 'course_name', 'course_code', 'department',
                'duration', 'course_intro', 'learning_outcomes'
            ]),
            filters: filters ? JSON.stringify(filters) : undefined,
            limit_page_length: 'None'
        };
        return this.get('/api/resource/Course', params);
    }
    async getCourse(courseId) {
        return this.get(`/api/resource/Course/${courseId}`);
    }
    async getStudentEnrollments(studentId) {
        const filters = studentId ? { student: studentId } : undefined;
        const params = {
            fields: JSON.stringify([
                'student', 'program', 'academic_year', 'academic_term',
                'enrollment_date', 'student_batch_name', 'student_category'
            ]),
            filters: filters ? JSON.stringify(filters) : undefined,
            limit_page_length: 'None'
        };
        return this.get('/api/resource/Program Enrollment', params);
    }
    async enrollStudent(enrollmentData) {
        return this.post('/api/resource/Program Enrollment', enrollmentData);
    }
    async getAcademicYears() {
        return this.get('/api/resource/Academic Year', {
            fields: JSON.stringify(['name', 'year_start_date', 'year_end_date']),
            limit_page_length: 'None'
        });
    }
    async getAcademicTerms(academicYear) {
        const filters = academicYear ? { academic_year: academicYear } : undefined;
        return this.get('/api/resource/Academic Term', {
            fields: JSON.stringify(['name', 'academic_year', 'term_start_date', 'term_end_date']),
            filters: filters ? JSON.stringify(filters) : undefined,
            limit_page_length: 'None'
        });
    }
    async getStudentAttendance(studentId, fromDate, toDate) {
        const filters = { student: studentId };
        if (fromDate)
            filters.date = ['>=', fromDate];
        if (toDate)
            filters.date = ['<=', toDate];
        return this.get('/api/resource/Student Attendance', {
            fields: JSON.stringify(['student', 'date', 'status', 'course_schedule']),
            filters: JSON.stringify(filters),
            limit_page_length: 'None'
        });
    }
    async markAttendance(attendanceData) {
        return this.post('/api/resource/Student Attendance', attendanceData);
    }
    async getStudentAssessments(studentId, academicYear) {
        const filters = { student: studentId };
        if (academicYear)
            filters.academic_year = academicYear;
        return this.get('/api/resource/Assessment Result', {
            fields: JSON.stringify([
                'student', 'assessment_plan', 'course', 'grade',
                'total_score', 'maximum_score', 'academic_year'
            ]),
            filters: JSON.stringify(filters),
            limit_page_length: 'None'
        });
    }
    async getStudentFees(studentId) {
        return this.get('/api/resource/Fees', {
            fields: JSON.stringify([
                'student', 'academic_year', 'academic_term',
                'total_amount', 'paid_amount', 'outstanding_amount', 'due_date'
            ]),
            filters: JSON.stringify({ student: studentId }),
            limit_page_length: 'None'
        });
    }
    async getCourseSchedule(filters) {
        return this.get('/api/resource/Course Schedule', {
            fields: JSON.stringify([
                'course', 'instructor', 'room', 'schedule_date',
                'from_time', 'to_time', 'student_group', 'color'
            ]),
            filters: filters ? JSON.stringify(filters) : undefined,
            limit_page_length: 'None'
        });
    }
    async healthCheck() {
        try {
            await this.get('/api/method/ping');
            return true;
        }
        catch (error) {
            logger_1.logger.error('ERPNext health check failed:', error);
            return false;
        }
    }
    async syncUser(userId, userData, userType) {
        try {
            if (userType === 'student') {
                const studentData = {
                    student_name: userData.name,
                    student_email_id: userData.email,
                    mobile_number: userData.profile?.phone,
                    date_of_birth: userData.profile?.dateOfBirth,
                };
                if (userData.erpnextId) {
                    return await this.updateStudent(userData.erpnextId, studentData);
                }
                else {
                    return await this.createStudent(studentData);
                }
            }
            else if (userType === 'instructor') {
                const instructorData = {
                    instructor_name: userData.name,
                    email: userData.email,
                    mobile_no: userData.profile?.phone,
                    department: userData.teacherInfo?.department,
                };
                if (userData.erpnextId) {
                    return await this.updateInstructor(userData.erpnextId, instructorData);
                }
                else {
                    return await this.createInstructor(instructorData);
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to sync ${userType} ${userId} with ERPNext:`, error);
            throw error;
        }
    }
    handleError(error) {
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
exports.erpnextService = new ERPNextService();
exports.default = exports.erpnextService;
//# sourceMappingURL=erpnextService.js.map