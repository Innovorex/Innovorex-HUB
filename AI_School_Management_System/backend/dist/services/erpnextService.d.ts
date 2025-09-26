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
declare class ERPNextService {
    private client;
    private config;
    constructor();
    private setupInterceptors;
    get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T>;
    post<T = any>(endpoint: string, data: Record<string, any>): Promise<T>;
    put<T = any>(endpoint: string, data: Record<string, any>): Promise<T>;
    delete<T = any>(endpoint: string): Promise<T>;
    getStudents(filters?: Record<string, any>): Promise<StudentData[]>;
    getStudent(studentId: string): Promise<StudentData>;
    createStudent(studentData: Partial<StudentData>): Promise<StudentData>;
    updateStudent(studentId: string, updateData: Partial<StudentData>): Promise<StudentData>;
    getInstructors(filters?: Record<string, any>): Promise<TeacherData[]>;
    getInstructor(instructorId: string): Promise<TeacherData>;
    createInstructor(instructorData: Partial<TeacherData>): Promise<TeacherData>;
    updateInstructor(instructorId: string, updateData: Partial<TeacherData>): Promise<TeacherData>;
    getCourses(filters?: Record<string, any>): Promise<CourseData[]>;
    getCourse(courseId: string): Promise<CourseData>;
    getStudentEnrollments(studentId?: string): Promise<ProgramEnrollmentData[]>;
    enrollStudent(enrollmentData: ProgramEnrollmentData): Promise<ProgramEnrollmentData>;
    getAcademicYears(): Promise<any[]>;
    getAcademicTerms(academicYear?: string): Promise<any[]>;
    getStudentAttendance(studentId: string, fromDate?: string, toDate?: string): Promise<any[]>;
    markAttendance(attendanceData: any): Promise<any>;
    getStudentAssessments(studentId: string, academicYear?: string): Promise<any[]>;
    getStudentFees(studentId: string): Promise<any[]>;
    getCourseSchedule(filters?: Record<string, any>): Promise<any[]>;
    healthCheck(): Promise<boolean>;
    syncUser(userId: string, userData: any, userType: 'student' | 'instructor'): Promise<any>;
    private handleError;
}
export declare const erpnextService: ERPNextService;
export default erpnextService;
//# sourceMappingURL=erpnextService.d.ts.map