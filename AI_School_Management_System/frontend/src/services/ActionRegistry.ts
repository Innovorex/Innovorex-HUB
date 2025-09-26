// services/ActionRegistry.ts - Comprehensive action registry for entire portal
import {
  UserPlusIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  BanknotesIcon,
  CalculatorIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  BeakerIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'date' | 'time' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[] | { value: string; label: string }[];
  validation?: (value: any) => string | null;
  placeholder?: string;
  defaultValue?: any;
  dependsOn?: string; // Field that this field depends on
}

export interface ActionDefinition {
  id: string;
  name: string;
  description?: string;
  icon: React.ComponentType<any>;
  category: string;
  requiredFields: FieldDefinition[];
  optionalFields?: FieldDefinition[];
  apiEndpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'GET';
  requiresConfirmation?: boolean;
  successMessage?: string;
  module: string;
}

// Comprehensive Action Registry for entire portal
export const ACTION_REGISTRY: Record<string, ActionDefinition[]> = {
  // ==================== USER MANAGEMENT ====================
  users: [
    {
      id: 'create_user',
      name: 'Create New User',
      description: 'Add a new user to the system',
      icon: UserPlusIcon,
      category: 'User Management',
      module: 'users',
      requiredFields: [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'role', label: 'Role', type: 'select', required: true,
          options: ['student', 'teacher', 'admin', 'parent'] },
      ],
      optionalFields: [
        { name: 'phone', label: 'Phone Number', type: 'text', required: false },
        { name: 'address', label: 'Address', type: 'textarea', required: false },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      ],
      apiEndpoint: '/users/create',
      method: 'POST',
      successMessage: 'User created successfully'
    },
    {
      id: 'update_user',
      name: 'Update User',
      description: 'Modify existing user information',
      icon: PencilSquareIcon,
      category: 'User Management',
      module: 'users',
      requiredFields: [
        { name: 'userId', label: 'User ID or Email', type: 'text', required: true },
      ],
      optionalFields: [
        { name: 'fullName', label: 'Full Name', type: 'text', required: false },
        { name: 'phone', label: 'Phone Number', type: 'text', required: false },
        { name: 'address', label: 'Address', type: 'textarea', required: false },
        { name: 'status', label: 'Status', type: 'select', required: false,
          options: ['active', 'inactive', 'suspended'] },
      ],
      apiEndpoint: '/users/{userId}',
      method: 'PUT',
      successMessage: 'User updated successfully'
    },
    {
      id: 'delete_user',
      name: 'Delete User',
      description: 'Remove a user from the system',
      icon: TrashIcon,
      category: 'User Management',
      module: 'users',
      requiredFields: [
        { name: 'userId', label: 'User ID or Email', type: 'text', required: true },
      ],
      apiEndpoint: '/users/{userId}',
      method: 'DELETE',
      requiresConfirmation: true,
      successMessage: 'User deleted successfully'
    },
    {
      id: 'search_user',
      name: 'Search Users',
      description: 'Find users by various criteria',
      icon: MagnifyingGlassIcon,
      category: 'User Management',
      module: 'users',
      requiredFields: [
        { name: 'searchTerm', label: 'Search Term', type: 'text', required: true,
          placeholder: 'Name, email, or role' },
      ],
      apiEndpoint: '/users/search',
      method: 'GET',
    },
  ],

  // ==================== PROGRAM MANAGEMENT ====================
  programs: [
    {
      id: 'create_program',
      name: 'Create New Program',
      description: 'Add a new academic program',
      icon: AcademicCapIcon,
      category: 'Program Management',
      module: 'programs',
      requiredFields: [
        { name: 'program_name', label: 'Program Name', type: 'text', required: true },
        { name: 'program_abbreviation', label: 'Abbreviation', type: 'text', required: true },
        { name: 'department', label: 'Department', type: 'select', required: true,
          options: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Business', 'Arts'] },
        { name: 'duration', label: 'Duration (years)', type: 'number', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
      ],
      optionalFields: [
        { name: 'is_active', label: 'Active', type: 'checkbox', required: false, defaultValue: true },
        { name: 'is_published', label: 'Published', type: 'checkbox', required: false, defaultValue: true },
      ],
      apiEndpoint: '/programs/create',
      method: 'POST',
      successMessage: 'Program created successfully'
    },
    {
      id: 'enroll_in_program',
      name: 'Program Enrollment',
      description: 'Enroll a student in a program',
      icon: DocumentDuplicateIcon,
      category: 'Program Management',
      module: 'programs',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'program', label: 'Program Name', type: 'text', required: true },
        { name: 'academic_year', label: 'Academic Year', type: 'text', required: true,
          placeholder: '2024-2025' },
        { name: 'academic_term', label: 'Academic Term', type: 'select', required: true,
          options: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4'] },
      ],
      optionalFields: [
        { name: 'enrollment_date', label: 'Enrollment Date', type: 'date', required: false },
      ],
      apiEndpoint: '/program-enrollment',
      method: 'POST',
      successMessage: 'Student enrolled in program successfully'
    },
    {
      id: 'update_program',
      name: 'Update Program',
      description: 'Modify program details',
      icon: PencilSquareIcon,
      category: 'Program Management',
      module: 'programs',
      requiredFields: [
        { name: 'program_id', label: 'Program Name/ID', type: 'text', required: true },
      ],
      optionalFields: [
        { name: 'program_name', label: 'Program Name', type: 'text', required: false },
        { name: 'department', label: 'Department', type: 'text', required: false },
        { name: 'duration', label: 'Duration (years)', type: 'number', required: false },
        { name: 'is_active', label: 'Active Status', type: 'checkbox', required: false },
      ],
      apiEndpoint: '/programs/{program_id}',
      method: 'PUT',
      successMessage: 'Program updated successfully'
    },
  ],

  // ==================== COURSE MANAGEMENT ====================
  courses: [
    {
      id: 'create_course',
      name: 'Create New Course',
      description: 'Add a new course to the system',
      icon: BookOpenIcon,
      category: 'Course Management',
      module: 'courses',
      requiredFields: [
        { name: 'course_name', label: 'Course Name', type: 'text', required: true },
        { name: 'course_code', label: 'Course Code', type: 'text', required: true,
          placeholder: 'CS101, MATH201, etc.' },
        { name: 'department', label: 'Department', type: 'select', required: true,
          options: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering'] },
        { name: 'credits', label: 'Credits', type: 'number', required: true },
        { name: 'description', label: 'Course Description', type: 'textarea', required: true },
      ],
      optionalFields: [
        { name: 'prerequisites', label: 'Prerequisites', type: 'text', required: false },
        { name: 'max_students', label: 'Maximum Students', type: 'number', required: false },
      ],
      apiEndpoint: '/courses/create',
      method: 'POST',
      successMessage: 'Course created successfully'
    },
    {
      id: 'assign_instructor',
      name: 'Assign Instructor to Course',
      description: 'Assign a teacher to a course',
      icon: UserGroupIcon,
      category: 'Course Management',
      module: 'courses',
      requiredFields: [
        { name: 'course', label: 'Course Code/Name', type: 'text', required: true },
        { name: 'instructor', label: 'Instructor Email/ID', type: 'text', required: true },
        { name: 'academic_year', label: 'Academic Year', type: 'text', required: true },
        { name: 'academic_term', label: 'Term', type: 'select', required: true,
          options: ['Semester 1', 'Semester 2'] },
      ],
      apiEndpoint: '/course-instructor',
      method: 'POST',
      successMessage: 'Instructor assigned successfully'
    },
    {
      id: 'enroll_in_course',
      name: 'Course Enrollment',
      description: 'Enroll a student in a course',
      icon: ClipboardDocumentListIcon,
      category: 'Course Management',
      module: 'courses',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'course', label: 'Course Code/Name', type: 'text', required: true },
        { name: 'academic_year', label: 'Academic Year', type: 'text', required: true },
        { name: 'academic_term', label: 'Term', type: 'select', required: true,
          options: ['Semester 1', 'Semester 2'] },
      ],
      apiEndpoint: '/course-enrollment',
      method: 'POST',
      successMessage: 'Student enrolled in course successfully'
    },
    {
      id: 'create_course_schedule',
      name: 'Create Course Schedule',
      description: 'Set up class schedule for a course',
      icon: CalendarDaysIcon,
      category: 'Course Management',
      module: 'courses',
      requiredFields: [
        { name: 'course', label: 'Course Code/Name', type: 'text', required: true },
        { name: 'day', label: 'Day', type: 'select', required: true,
          options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
        { name: 'from_time', label: 'Start Time', type: 'time', required: true },
        { name: 'to_time', label: 'End Time', type: 'time', required: true },
        { name: 'room', label: 'Room/Location', type: 'text', required: true },
      ],
      apiEndpoint: '/course-schedule',
      method: 'POST',
      successMessage: 'Course schedule created successfully'
    },
  ],

  // ==================== STUDENT MANAGEMENT ====================
  'student-management': [
    {
      id: 'create_student',
      name: 'Create New Student',
      description: 'Add a new student to the system',
      icon: UserPlusIcon,
      category: 'Student Management',
      module: 'student-management',
      requiredFields: [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'middle_name', label: 'Middle Name', type: 'text', required: false },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'student_email_id', label: 'Email', type: 'email', required: true },
        { name: 'gender', label: 'Gender', type: 'select', required: true,
          options: ['Male', 'Female', 'Other'] },
        { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'joining_date', label: 'Joining Date', type: 'date', required: true },
      ],
      optionalFields: [
        { name: 'blood_group', label: 'Blood Group', type: 'select', required: false,
          options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
        { name: 'student_mobile_number', label: 'Mobile Number', type: 'text', required: false },
        { name: 'address', label: 'Address', type: 'textarea', required: false },
      ],
      apiEndpoint: '/students',
      method: 'POST',
      successMessage: 'Student created successfully'
    },
    {
      id: 'create_student_group',
      name: 'Create Student Group',
      description: 'Create a new student group/section',
      icon: UserGroupIcon,
      category: 'Student Management',
      module: 'student-management',
      requiredFields: [
        { name: 'group_name', label: 'Group Name', type: 'text', required: true },
        { name: 'program', label: 'Program', type: 'text', required: true },
        { name: 'batch', label: 'Batch/Year', type: 'text', required: true },
        { name: 'max_strength', label: 'Maximum Students', type: 'number', required: true },
      ],
      apiEndpoint: '/student-groups',
      method: 'POST',
      successMessage: 'Student group created successfully'
    },
    {
      id: 'add_student_to_group',
      name: 'Add Student to Group',
      description: 'Add a student to a group/section',
      icon: UserPlusIcon,
      category: 'Student Management',
      module: 'student-management',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'student_group', label: 'Group Name', type: 'text', required: true },
        { name: 'active', label: 'Active', type: 'checkbox', required: false, defaultValue: true },
      ],
      apiEndpoint: '/student-group-members',
      method: 'POST',
      successMessage: 'Student added to group successfully'
    },
    {
      id: 'create_guardian',
      name: 'Add Guardian',
      description: 'Add guardian/parent information',
      icon: UsersIcon,
      category: 'Student Management',
      module: 'student-management',
      requiredFields: [
        { name: 'guardian_name', label: 'Guardian Name', type: 'text', required: true },
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'relation', label: 'Relation', type: 'select', required: true,
          options: ['Father', 'Mother', 'Guardian', 'Other'] },
        { name: 'email', label: 'Guardian Email', type: 'email', required: true },
        { name: 'mobile_no', label: 'Mobile Number', type: 'text', required: true },
      ],
      optionalFields: [
        { name: 'occupation', label: 'Occupation', type: 'text', required: false },
        { name: 'work_address', label: 'Work Address', type: 'textarea', required: false },
      ],
      apiEndpoint: '/guardians',
      method: 'POST',
      successMessage: 'Guardian added successfully'
    },
  ],

  // ==================== INSTRUCTOR MANAGEMENT ====================
  'instructor-management': [
    {
      id: 'create_instructor',
      name: 'Create New Instructor',
      description: 'Add a new instructor/teacher',
      icon: UserPlusIcon,
      category: 'Instructor Management',
      module: 'instructor-management',
      requiredFields: [
        { name: 'employee_name', label: 'Full Name', type: 'text', required: true },
        { name: 'employee_email_id', label: 'Email', type: 'email', required: true },
        { name: 'gender', label: 'Gender', type: 'select', required: true,
          options: ['Male', 'Female', 'Other'] },
        { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'date_of_joining', label: 'Joining Date', type: 'date', required: true },
        { name: 'department', label: 'Department', type: 'select', required: true,
          options: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology'] },
        { name: 'designation', label: 'Designation', type: 'select', required: true,
          options: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'] },
      ],
      optionalFields: [
        { name: 'mobile_number', label: 'Mobile Number', type: 'text', required: false },
        { name: 'qualification', label: 'Qualification', type: 'text', required: false },
        { name: 'experience', label: 'Experience (years)', type: 'number', required: false },
      ],
      apiEndpoint: '/instructors',
      method: 'POST',
      successMessage: 'Instructor created successfully'
    },
    {
      id: 'assign_course_to_instructor',
      name: 'Assign Course',
      description: 'Assign a course to an instructor',
      icon: BookOpenIcon,
      category: 'Instructor Management',
      module: 'instructor-management',
      requiredFields: [
        { name: 'instructor', label: 'Instructor Email/ID', type: 'text', required: true },
        { name: 'course', label: 'Course Code/Name', type: 'text', required: true },
        { name: 'academic_year', label: 'Academic Year', type: 'text', required: true },
      ],
      apiEndpoint: '/instructor-courses',
      method: 'POST',
      successMessage: 'Course assigned to instructor successfully'
    },
  ],

  // ==================== ATTENDANCE ====================
  attendance: [
    {
      id: 'mark_attendance',
      name: 'Mark Attendance',
      description: 'Mark student attendance',
      icon: CheckCircleIcon,
      category: 'Attendance',
      module: 'attendance',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'course', label: 'Course Code/Name', type: 'text', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true,
          options: ['Present', 'Absent', 'Late'] },
      ],
      apiEndpoint: '/attendance',
      method: 'POST',
      successMessage: 'Attendance marked successfully'
    },
    {
      id: 'bulk_attendance',
      name: 'Bulk Attendance',
      description: 'Mark attendance for multiple students',
      icon: ClipboardDocumentListIcon,
      category: 'Attendance',
      module: 'attendance',
      requiredFields: [
        { name: 'course', label: 'Course Code/Name', type: 'text', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'student_group', label: 'Student Group', type: 'text', required: true },
        { name: 'all_present', label: 'Mark All Present', type: 'checkbox', required: false },
      ],
      apiEndpoint: '/attendance/bulk',
      method: 'POST',
      successMessage: 'Bulk attendance marked successfully'
    },
    {
      id: 'create_leave_application',
      name: 'Leave Application',
      description: 'Submit a leave application',
      icon: DocumentTextIcon,
      category: 'Attendance',
      module: 'attendance',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'from_date', label: 'From Date', type: 'date', required: true },
        { name: 'to_date', label: 'To Date', type: 'date', required: true },
        { name: 'reason', label: 'Reason', type: 'textarea', required: true },
      ],
      apiEndpoint: '/leave-applications',
      method: 'POST',
      successMessage: 'Leave application submitted successfully'
    },
  ],

  // ==================== ASSESSMENT ====================
  assessment: [
    {
      id: 'create_assessment',
      name: 'Create Assessment',
      description: 'Create a new assessment/exam',
      icon: DocumentCheckIcon,
      category: 'Assessment',
      module: 'assessment',
      requiredFields: [
        { name: 'assessment_name', label: 'Assessment Name', type: 'text', required: true },
        { name: 'course', label: 'Course Code/Name', type: 'text', required: true },
        { name: 'assessment_type', label: 'Type', type: 'select', required: true,
          options: ['Quiz', 'Midterm', 'Final', 'Assignment', 'Project'] },
        { name: 'maximum_marks', label: 'Maximum Marks', type: 'number', required: true },
        { name: 'assessment_date', label: 'Date', type: 'date', required: true },
      ],
      optionalFields: [
        { name: 'duration', label: 'Duration (minutes)', type: 'number', required: false },
        { name: 'instructions', label: 'Instructions', type: 'textarea', required: false },
      ],
      apiEndpoint: '/assessments',
      method: 'POST',
      successMessage: 'Assessment created successfully'
    },
    {
      id: 'submit_grades',
      name: 'Submit Grades',
      description: 'Submit student grades',
      icon: CalculatorIcon,
      category: 'Assessment',
      module: 'assessment',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'assessment', label: 'Assessment Name', type: 'text', required: true },
        { name: 'marks_obtained', label: 'Marks Obtained', type: 'number', required: true },
      ],
      optionalFields: [
        { name: 'comments', label: 'Comments', type: 'textarea', required: false },
      ],
      apiEndpoint: '/grades',
      method: 'POST',
      successMessage: 'Grades submitted successfully'
    },
    {
      id: 'generate_report_card',
      name: 'Generate Report Card',
      description: 'Generate student report card',
      icon: DocumentTextIcon,
      category: 'Assessment',
      module: 'assessment',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'academic_term', label: 'Term', type: 'select', required: true,
          options: ['Semester 1', 'Semester 2', 'Annual'] },
        { name: 'academic_year', label: 'Academic Year', type: 'text', required: true },
      ],
      apiEndpoint: '/report-cards',
      method: 'POST',
      successMessage: 'Report card generated successfully'
    },
  ],

  // ==================== FEES MANAGEMENT ====================
  fees: [
    {
      id: 'create_fee_structure',
      name: 'Create Fee Structure',
      description: 'Set up fee structure',
      icon: CurrencyDollarIcon,
      category: 'Fees Management',
      module: 'fees',
      requiredFields: [
        { name: 'program', label: 'Program', type: 'text', required: true },
        { name: 'academic_year', label: 'Academic Year', type: 'text', required: true },
        { name: 'fee_category', label: 'Fee Category', type: 'select', required: true,
          options: ['Tuition Fee', 'Laboratory Fee', 'Library Fee', 'Sports Fee', 'Other'] },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
      ],
      apiEndpoint: '/fee-structure',
      method: 'POST',
      successMessage: 'Fee structure created successfully'
    },
    {
      id: 'create_fee_schedule',
      name: 'Create Fee Schedule',
      description: 'Set up payment schedule',
      icon: CalendarDaysIcon,
      category: 'Fees Management',
      module: 'fees',
      requiredFields: [
        { name: 'fee_structure', label: 'Fee Structure', type: 'text', required: true },
        { name: 'due_date', label: 'Due Date', type: 'date', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'description', label: 'Description', type: 'text', required: true },
      ],
      apiEndpoint: '/fee-schedule',
      method: 'POST',
      successMessage: 'Fee schedule created successfully'
    },
    {
      id: 'record_payment',
      name: 'Record Payment',
      description: 'Record fee payment',
      icon: BanknotesIcon,
      category: 'Fees Management',
      module: 'fees',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
        { name: 'payment_mode', label: 'Payment Mode', type: 'select', required: true,
          options: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'UPI', 'Cheque'] },
        { name: 'reference_no', label: 'Reference Number', type: 'text', required: true },
      ],
      apiEndpoint: '/payments',
      method: 'POST',
      successMessage: 'Payment recorded successfully'
    },
    {
      id: 'generate_invoice',
      name: 'Generate Invoice',
      description: 'Generate fee invoice',
      icon: DocumentTextIcon,
      category: 'Fees Management',
      module: 'fees',
      requiredFields: [
        { name: 'student', label: 'Student Email/ID', type: 'text', required: true },
        { name: 'fee_schedule', label: 'Fee Schedule', type: 'text', required: true },
        { name: 'due_date', label: 'Due Date', type: 'date', required: true },
      ],
      apiEndpoint: '/invoices',
      method: 'POST',
      successMessage: 'Invoice generated successfully'
    },
  ],

  // ==================== ACADEMIC SETTINGS ====================
  'academic-settings': [
    {
      id: 'create_academic_year',
      name: 'Create Academic Year',
      description: 'Set up new academic year',
      icon: CalendarDaysIcon,
      category: 'Academic Settings',
      module: 'academic-settings',
      requiredFields: [
        { name: 'academic_year_name', label: 'Academic Year', type: 'text', required: true,
          placeholder: '2024-2025' },
        { name: 'year_start_date', label: 'Start Date', type: 'date', required: true },
        { name: 'year_end_date', label: 'End Date', type: 'date', required: true },
      ],
      apiEndpoint: '/academic-years',
      method: 'POST',
      successMessage: 'Academic year created successfully'
    },
    {
      id: 'create_academic_term',
      name: 'Create Academic Term',
      description: 'Set up academic term/semester',
      icon: CalendarDaysIcon,
      category: 'Academic Settings',
      module: 'academic-settings',
      requiredFields: [
        { name: 'term_name', label: 'Term Name', type: 'text', required: true },
        { name: 'academic_year', label: 'Academic Year', type: 'text', required: true },
        { name: 'term_start_date', label: 'Start Date', type: 'date', required: true },
        { name: 'term_end_date', label: 'End Date', type: 'date', required: true },
      ],
      apiEndpoint: '/academic-terms',
      method: 'POST',
      successMessage: 'Academic term created successfully'
    },
    {
      id: 'create_room',
      name: 'Create Room',
      description: 'Add a new classroom/lab',
      icon: HomeModernIcon,
      category: 'Academic Settings',
      module: 'academic-settings',
      requiredFields: [
        { name: 'room_name', label: 'Room Name/Number', type: 'text', required: true },
        { name: 'building', label: 'Building', type: 'text', required: true },
        { name: 'seating_capacity', label: 'Seating Capacity', type: 'number', required: true },
        { name: 'room_type', label: 'Room Type', type: 'select', required: true,
          options: ['Classroom', 'Laboratory', 'Auditorium', 'Seminar Hall', 'Computer Lab'] },
      ],
      apiEndpoint: '/rooms',
      method: 'POST',
      successMessage: 'Room created successfully'
    },
  ],

  // ==================== DASHBOARD & REPORTS ====================
  dashboard: [
    {
      id: 'generate_attendance_report',
      name: 'Generate Attendance Report',
      description: 'Generate attendance report',
      icon: ChartBarIcon,
      category: 'Reports',
      module: 'dashboard',
      requiredFields: [
        { name: 'report_type', label: 'Report Type', type: 'select', required: true,
          options: ['Student', 'Course', 'Monthly', 'Semester'] },
        { name: 'from_date', label: 'From Date', type: 'date', required: true },
        { name: 'to_date', label: 'To Date', type: 'date', required: true },
      ],
      optionalFields: [
        { name: 'student', label: 'Student (if applicable)', type: 'text', required: false },
        { name: 'course', label: 'Course (if applicable)', type: 'text', required: false },
      ],
      apiEndpoint: '/reports/attendance',
      method: 'POST',
      successMessage: 'Attendance report generated successfully'
    },
    {
      id: 'generate_performance_report',
      name: 'Generate Performance Report',
      description: 'Generate academic performance report',
      icon: ChartBarIcon,
      category: 'Reports',
      module: 'dashboard',
      requiredFields: [
        { name: 'report_type', label: 'Report Type', type: 'select', required: true,
          options: ['Individual', 'Class', 'Course', 'Program'] },
        { name: 'academic_term', label: 'Academic Term', type: 'text', required: true },
      ],
      apiEndpoint: '/reports/performance',
      method: 'POST',
      successMessage: 'Performance report generated successfully'
    },
  ],

  // ==================== KNOWLEDGE BASE ====================
  'knowledge-base': [
    {
      id: 'upload_document',
      name: 'Upload Document',
      description: 'Upload educational material',
      icon: DocumentTextIcon,
      category: 'Knowledge Base',
      module: 'knowledge-base',
      requiredFields: [
        { name: 'title', label: 'Document Title', type: 'text', required: true },
        { name: 'course_id', label: 'Course', type: 'text', required: true },
        { name: 'program_id', label: 'Program', type: 'text', required: true },
        { name: 'file_path', label: 'File Path', type: 'text', required: true },
      ],
      apiEndpoint: '/kb/documents/upload',
      method: 'POST',
      successMessage: 'Document uploaded successfully'
    },
  ],
};

// Helper function to get actions for current context
export function getActionsForContext(module: string): ActionDefinition[] {
  // Map route patterns to modules
  const routeToModule: Record<string, string> = {
    'users': 'users',
    'programs': 'programs',
    'program-enrollment': 'programs',
    'courses': 'courses',
    'course-enrollment': 'courses',
    'students': 'student-management',
    'student-groups': 'student-management',
    'student-admission': 'student-management',
    'guardian': 'student-management',
    'instructor': 'instructor-management',
    'attendance': 'attendance',
    'student-attendance': 'attendance',
    'leave-application': 'attendance',
    'assessment': 'assessment',
    'grades': 'assessment',
    'report-card': 'assessment',
    'fees': 'fees',
    'fee-structure': 'fees',
    'fee-schedule': 'fees',
    'payment': 'fees',
    'invoice': 'fees',
    'academic-year': 'academic-settings',
    'academic-term': 'academic-settings',
    'room': 'academic-settings',
    'dashboard': 'dashboard',
    'knowledge-base': 'knowledge-base',
  };

  // Find matching module
  for (const [pattern, moduleKey] of Object.entries(routeToModule)) {
    if (module.includes(pattern)) {
      return ACTION_REGISTRY[moduleKey] || [];
    }
  }

  return ACTION_REGISTRY[module] || [];
}

// Export default registry
export default ACTION_REGISTRY;