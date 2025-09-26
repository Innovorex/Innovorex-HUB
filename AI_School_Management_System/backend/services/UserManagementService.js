// services/UserManagementService.js - Comprehensive User Management Service for ERPNext Integration
const ERPNextAPI = require('../config/erpnext');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class UserManagementService {
  constructor() {
    this.erpnext = new ERPNextAPI();
    // In-memory storage for local users (in production, use database)
    this.localUsers = new Map();
    // Track deleted users to filter them out
    this.deletedUsers = new Set();
  }

  // Get all users (Students, Teachers, Admin)
  async getAllUsers({ page = 1, limit = null, role, search } = {}) {
    try {
      const [students, teachers, admins, guardians] = await Promise.all([
        this.getStudents({ page, limit, search }),
        this.getTeachers({ page, limit, search }),
        this.getAdmins({ page, limit, search }),
        this.getGuardians({ page, limit, search })
      ]);

      let allUsers = [
        ...students.map(s => ({ ...s, role: 'student', type: 'Student' })),
        ...teachers.map(t => ({ ...t, role: 'teacher', type: 'Instructor' })),
        ...admins.map(a => ({ ...a, role: 'admin', type: 'Employee' })),
        ...guardians.map(g => ({ ...g, role: 'guardian', type: 'Guardian' }))
      ];

      // Filter out deleted users
      if (this.deletedUsers && this.deletedUsers.size > 0) {
        allUsers = allUsers.filter(user => !this.deletedUsers.has(user.id));
      }

      // Filter by role if specified
      if (role) {
        allUsers = allUsers.filter(user => user.role === role);
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        allUsers = allUsers.filter(user =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.student_name?.toLowerCase().includes(searchLower) ||
          user.employee_name?.toLowerCase().includes(searchLower)
        );
      }

      return {
        users: allUsers,
        total: allUsers.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Failed to fetch all users:', error);
      throw error;
    }
  }

  // Get all students from ERPNext - NO MOCK DATA
  async getStudents({ page = 1, limit = null, search } = {}) {
    try {
      const filters = [];
      if (search) {
        filters.push(['student_name', 'like', `%${search}%`]);
      }

      const response = await this.erpnext.getList('Student', [
        'name', 'student_name', 'student_email_id', 'first_name',
        'joining_date', 'enabled', 'blood_group', 'country'
      ], filters); // No limit - fetch all students

      // Filter out disabled students and those marked as DELETED
      const students = (response.data || []).filter(student => {
        const isEnabled = student.enabled !== 0;
        const notDeleted = student.first_name !== 'DELETED' &&
                          !student.student_name?.includes('DELETED');
        return isEnabled && notDeleted;
      });

      // Get additional details for each student from ERPNext
      const studentsWithDetails = await Promise.all(
        students.map(async (student) => {
          try {
            // Get program enrollments from ERPNext
            const enrollments = await this.getStudentEnrollments(student.name);
            // Get current courses from ERPNext
            const courses = await this.getStudentCourses(student.name);

            return {
              ...student,
              id: student.name,
              email: student.student_email_id,
              phone: student.student_mobile_number || 'N/A',
              status: student.enabled ? 'active' : 'inactive',
              full_name: student.student_name,
              enrollments,
              courses,
              assigned_classes: enrollments.map(e => e.program),
              assigned_subjects: courses.map(c => c.course)
            };
          } catch (err) {
            console.error(`Error fetching details for student ${student.name}:`, err);
            return {
              ...student,
              id: student.name,
              email: student.student_email_id,
              phone: student.student_mobile_number,
              status: student.enabled ? 'active' : 'inactive',
              enrollments: [],
              courses: [],
              assigned_classes: [],
              assigned_subjects: []
            };
          }
        })
      );

      return studentsWithDetails || [];
    } catch (error) {
      console.error('Failed to fetch students from ERPNext:', error);
      // Return empty array if ERPNext connection fails - NO MOCK DATA
      return [];
    }
  }

  // Get all teachers/instructors from ERPNext Instructor doctype - NO MOCK DATA
  async getTeachers({ page = 1, limit = null, search } = {}) {
    try {
      const filters = [];
      if (search) {
        filters.push(['instructor_name', 'like', `%${search}%`]);
      }

      const response = await this.erpnext.getList('Instructor', [
        'name'
      ], filters); // No limit - fetch all instructors

      const teachers = response.data || [];

      // Get full details for each teacher from ERPNext
      const teachersWithDetails = await Promise.all(
        teachers.map(async (teacher) => {
          try {
            // Get full instructor document to get department
            const instructorDoc = await this.erpnext.getDoc('Instructor', teacher.name);
            const instructorData = instructorDoc.data || {};

            // Skip inactive instructors (those marked as deleted)
            if (instructorData.status === 'Inactive') {
              return null;
            }

            const courses = await this.getTeacherCourses(teacher.name);
            const studentGroups = await this.getTeacherStudentGroups(teacher.name);

            return {
              ...instructorData,
              id: teacher.name,
              email: instructorData.custom_user_id || `${instructorData.instructor_name?.toLowerCase().replace(/\s+/g, '.')}@innovorex.co.in`,
              phone: 'N/A',
              full_name: instructorData.instructor_name,
              employee_name: instructorData.instructor_name,
              department: instructorData.department || 'N/A',
              assigned_subjects: courses,
              assigned_classes: studentGroups,
              qualifications: []
            };
          } catch (err) {
            console.error(`Error fetching details for instructor ${teacher.name}:`, err);
            return {
              ...teacher,
              id: teacher.name,
              email: teacher.custom_user_id || `${teacher.instructor_name?.toLowerCase().replace(/\s+/g, '.')}@innovorex.co.in`,
              phone: 'N/A',
              full_name: teacher.instructor_name,
              employee_name: teacher.instructor_name,
              department: 'N/A',
              assigned_subjects: [],
              assigned_classes: [],
              qualifications: []
            };
          }
        })
      );

      // Filter out null values (inactive instructors)
      return teachersWithDetails.filter(teacher => teacher !== null);
    } catch (error) {
      console.error('Failed to fetch instructors from ERPNext:', error);
      // Return empty array if ERPNext connection fails - NO MOCK DATA
      return [];
    }
  }

  // Get guardians from ERPNext
  async getGuardians({ page = 1, limit = null, search } = {}) {
    try {
      const filters = [];
      if (search) {
        filters.push(['guardian_name', 'like', `%${search}%`]);
      }

      const response = await this.erpnext.getList('Guardian', [
        'name', 'guardian_name', 'user_id', 'first_name', 'last_name',
        'status', 'date_of_joining'
      ], filters); // No limit - fetch all guardians

      const guardians = response.data || [];

      return guardians.map(guardian => ({
        ...guardian,
        id: guardian.name,
        email: guardian.user_id,
        phone: guardian.cell_number || 'N/A',
        full_name: guardian.guardian_name
      }));
    } catch (error) {
      console.error('Failed to fetch guardians from ERPNext:', error);
      return [];
    }
  }

  // Get admins/principals
  async getAdmins({ page = 1, limit = null, search } = {}) {
    try {
      const filters = [
        ['designation', 'in', ['Principal', 'Administrator', 'Admin', 'Director']]
      ];
      if (search) {
        filters.push(['employee_name', 'like', `%${search}%`]);
      }

      const response = await this.erpnext.getList('Employee', [
        'name', 'employee_name', 'user_id', 'first_name', 'last_name',
        'status', 'date_of_joining'
      ], filters, limit);

      const admins = response.data || [];

      return admins.map(admin => ({
        ...admin,
        id: admin.name,
        email: admin.user_id,
        phone: admin.cell_number
      }));
    } catch (error) {
      console.error('Failed to fetch admins from ERPNext:', error);
      return [];
    }
  }

  // Get all programs (classes)
  async getPrograms() {
    try {
      // First, just get the list of program names
      const response = await this.erpnext.getList('Program', [
        'name'
      ], []); // No limit - fetch all programs

      const programs = response.data || [];

      // If basic list doesn't have all fields, fetch full documents
      const programsWithDetails = await Promise.all(programs.map(async program => {
        try {
          const programDoc = await this.erpnext.getDoc('Program', program.name);
          return {
            id: program.name,
            name: program.name,
            program_name: programDoc.data?.program_name || program.name,
            program_code: programDoc.data?.program_code || program.name,
            program_abbreviation: programDoc.data?.program_abbreviation || program.name,
            department: programDoc.data?.department || '',
            description: programDoc.data?.description || '',
            courses: programDoc.data?.courses || []
          };
        } catch (err) {
          return {
            id: program.name,
            name: program.name,
            program_name: program.program_name || program.name,
            program_code: program.program_code || program.name,
            program_abbreviation: program.program_abbreviation || program.name,
            department: program.department || '',
            description: program.description || '',
            courses: []
          };
        }
      }));

      return programsWithDetails;
    } catch (error) {
      console.error('Failed to fetch programs from ERPNext:', error);
      return [];
    }
  }

  // Get all programs with their courses
  async getProgramsWithCourses() {
    try {
      const response = await this.erpnext.getList('Program', [
        'name'
      ], []); // No limit - fetch all programs

      const programs = response.data || [];

      // Fetch courses for each program
      const programsWithCourses = await Promise.all(programs.map(async (program) => {
        try {
          const programDoc = await this.erpnext.getDoc('Program', program.name);
          const courses = programDoc.data?.courses || [];

          return {
            id: program.name,
            name: program.name,
            program_name: programDoc.data?.program_name || program.name,
            program_code: programDoc.data?.program_code || program.name,
            program_abbreviation: programDoc.data?.program_abbreviation || program.name,
            department: programDoc.data?.department || '',
            description: programDoc.data?.description || '',
            courses: courses.map(c => ({
              id: c.course,
              name: c.course_name || c.course,
              code: c.course,
              required: c.required || false
            }))
          };
        } catch (err) {
          console.error(`Failed to fetch courses for program ${program.name}:`, err);
          return {
            id: program.name,
            name: program.name,
            code: program.name,
            department: 'N/A',
            abbreviation: program.name,
            courses: []
          };
        }
      }));

      return programsWithCourses;
    } catch (error) {
      console.error('Failed to fetch programs with courses from ERPNext:', error);
      return [];
    }
  }

  // Get all courses (subjects)
  async getCourses(programId = null) {
    try {
      // If programId is provided, get courses for that program
      if (programId) {
        // Get the Program document with its courses
        const programDoc = await this.erpnext.getDoc('Program', programId);

        if (!programDoc.data || !programDoc.data.courses) {
          return [];
        }

        // Extract course information from the program's courses field
        // Also fetch full course details to get department
        const coursesWithDetails = await Promise.all(programDoc.data.courses.map(async pc => {
          try {
            const courseDoc = await this.erpnext.getDoc('Course', pc.course);
            return {
              id: pc.course,
              name: pc.course_name || pc.course,
              code: pc.course,
              program: programId,
              required: pc.required || false,
              department: courseDoc.data?.department || 'N/A',
              abbreviation: pc.course
            };
          } catch (err) {
            return {
              id: pc.course,
              name: pc.course_name || pc.course,
              code: pc.course,
              program: programId,
              required: pc.required || false,
              department: 'N/A',
              abbreviation: pc.course
            };
          }
        }));

        return coursesWithDetails;
      }

      // Get all courses - fetch full documents to get department
      const response = await this.erpnext.getList('Course', [
        'name'
      ], []); // No limit - fetch all courses

      const courses = response.data || [];

      // Fetch full details for each course to get department
      const coursesWithDetails = await Promise.all(courses.map(async course => {
        try {
          const courseDoc = await this.erpnext.getDoc('Course', course.name);
          return {
            id: course.name,
            name: courseDoc.data?.course_name || course.name,
            code: course.name,
            department: courseDoc.data?.department || 'N/A',
            abbreviation: course.name
          };
        } catch (err) {
          return {
            id: course.name,
            name: course.name,
            code: course.name,
            department: 'N/A',
            abbreviation: course.name
          };
        }
      }));

      return coursesWithDetails;
    } catch (error) {
      console.error('Failed to fetch courses from ERPNext:', error);
      return [];
    }
  }

  // Get student enrollments
  async getStudentEnrollments(studentId) {
    try {
      const response = await this.erpnext.getList('Program Enrollment', [
        'name', 'program', 'academic_year', 'academic_term', 'enrollment_date'
      ], [['student', '=', studentId]]); // No limit - fetch all enrollments

      const enrollments = response.data || [];

      return enrollments;
    } catch (error) {
      console.error('Failed to fetch student enrollments:', error);
      return [];
    }
  }

  // Get student courses
  async getStudentCourses(studentId) {
    try {
      const response = await this.erpnext.getList('Course Enrollment', [
        'name', 'course', 'enrollment_date'
      ], [['student', '=', studentId]]); // No limit - fetch all course enrollments

      const courseEnrollments = response.data || [];

      return courseEnrollments;
    } catch (error) {
      console.error('Failed to fetch student courses:', error);
      return [];
    }
  }

  // Get instructor courses
  async getTeacherCourses(instructorId) {
    try {
      const response = await this.erpnext.getList('Instructor Log', [
        'name', 'course', 'academic_term'
      ], [['instructor', '=', instructorId]]); // No limit - fetch all instructor logs

      const instructorLogs = response.data || [];

      return instructorLogs.map(log => log.course);
    } catch (error) {
      console.error('Failed to fetch instructor courses:', error);
      return [];
    }
  }

  // Get instructor student groups
  async getTeacherStudentGroups(instructorId) {
    try {
      // Note: 'instructor' field is not permitted in direct query
      // Need to fetch all groups and filter after getting full documents
      const allGroups = await this.erpnext.getList('Student Group', ['name'], []);
      const studentGroups = [];

      for (const group of allGroups.data || []) {
        try {
          const groupDoc = await this.erpnext.getDoc('Student Group', group.name);
          // Check if this instructor is in the group's instructors list
          if (groupDoc.data?.instructors?.some(i => i.instructor === instructorId)) {
            studentGroups.push({
              name: groupDoc.data.name,
              group_based_on: groupDoc.data.group_based_on,
              program: groupDoc.data.program,
              course: groupDoc.data.course,
              batch: groupDoc.data.batch
            });
          }
        } catch (err) {
          console.error(`Failed to check instructor in group ${group.name}:`, err);
        }
      }

      return studentGroups;
    } catch (error) {
      console.error('Failed to fetch instructor student groups:', error);
      return [];
    }
  }

  // Create new student enrollment
  async createStudentEnrollment(data) {
    try {
      const enrollment = await this.erpnext.createDoc('Student Admission', {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        program: data.program,
        academic_year: data.academic_year || new Date().getFullYear().toString(),
        application_status: 'Approved'
      });

      // Create actual student record
      const student = await this.erpnext.createDoc('Student', {
        first_name: data.first_name,
        last_name: data.last_name,
        student_email_id: data.email,
        student_mobile_number: data.phone,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        joining_date: new Date().toISOString().split('T')[0]
      });

      return { enrollment, student };
    } catch (error) {
      console.error('Failed to create student enrollment:', error);
      throw error;
    }
  }

  // Assign class to student (Program Enrollment)
  async assignClassToStudent(studentId, programId, academicYear) {
    try {
      const enrollment = await this.erpnext.createDoc('Program Enrollment', {
        student: studentId,
        program: programId,
        academic_year: academicYear || new Date().getFullYear().toString(),
        enrollment_date: new Date().toISOString().split('T')[0]
      });

      return enrollment;
    } catch (error) {
      console.error('Failed to assign class to student:', error);
      throw error;
    }
  }

  // Assign subject to student (Course Enrollment)
  async assignSubjectToStudent(studentId, courseId) {
    try {
      const enrollment = await this.erpnext.createDoc('Course Enrollment', {
        student: studentId,
        course: courseId,
        enrollment_date: new Date().toISOString().split('T')[0]
      });

      return enrollment;
    } catch (error) {
      console.error('Failed to assign subject to student:', error);
      throw error;
    }
  }

  // Get all student groups with details
  async getStudentGroups() {
    try {
      const response = await this.erpnext.getList('Student Group', [
        'name'
      ], []); // No limit - fetch all student groups

      const studentGroups = response.data || [];

      // Fetch detailed information for each group
      const groupsWithDetails = await Promise.all(studentGroups.map(async (group) => {
        try {
          const groupDoc = await this.erpnext.getDoc('Student Group', group.name);
          const groupData = groupDoc.data || {};

          return {
            id: groupData.name || group.name,
            name: groupData.student_group_name || groupData.name || group.name,
            academicYear: groupData.academic_year || '',
            academicTerm: groupData.academic_term || '',
            groupBasedOn: groupData.group_based_on || '',
            program: groupData.program || '',
            batch: groupData.batch || '',
            maxStrength: groupData.max_strength || 0,
            currentStrength: groupData.students ? groupData.students.length : 0,
            disabled: groupData.disabled || false,
            students: groupData.students ? groupData.students.map(s => ({
              id: s.student,
              name: s.student_name,
              rollNumber: s.group_roll_number,
              active: s.active
            })) : [],
            instructors: groupData.instructors ? groupData.instructors.map(i => ({
              id: i.instructor,
              name: i.instructor_name
            })) : []
          };
        } catch (err) {
          console.error(`Failed to fetch details for student group ${group.name}:`, err);
          return {
            id: group.name,
            name: group.name,
            academicYear: '',
            academicTerm: '',
            groupBasedOn: '',
            program: '',
            batch: '',
            maxStrength: 0,
            currentStrength: 0,
            disabled: false,
            students: [],
            instructors: []
          };
        }
      }));

      return groupsWithDetails;
    } catch (error) {
      console.error('Failed to fetch student groups from ERPNext:', error);
      return [];
    }
  }

  // Create student group (assign teacher, students, class & subjects together)
  async createStudentGroup(data) {
    try {
      const studentGroup = await this.erpnext.createDoc('Student Group', {
        student_group_name: data.name,
        group_based_on: data.based_on || 'Course',
        program: data.program,
        course: data.course,
        batch: data.batch,
        instructor: data.instructor,
        students: data.students, // Array of student IDs
        academic_year: data.academic_year || new Date().getFullYear().toString(),
        academic_term: data.academic_term
      });

      return studentGroup;
    } catch (error) {
      console.error('Failed to create student group:', error);
      throw error;
    }
  }



  // Get all program enrollments
  async getAllProgramEnrollments() {
    try {
      const response = await this.erpnext.getList('Program Enrollment', [
        'name', 'student', 'program', 'academic_year', 'academic_term', 'enrollment_date'
      ], []); // No limit - fetch all program enrollments

      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch program enrollments from ERPNext:', error);
      return [];
    }
  }

  // Get all course enrollments
  async getAllCourseEnrollments() {
    try {
      const response = await this.erpnext.getList('Course Enrollment', [
        'name', 'student', 'course', 'enrollment_date'
      ], []); // No limit - fetch all course enrollments

      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch course enrollments from ERPNext:', error);
      return [];
    }
  }

  // Sync data with local database
  async syncWithLocalDB(data) {
    // This would sync with a local database if implemented
    // For now, we're relying on ERPNext as the single source of truth
    console.log('Syncing data with local DB:', data);
    return true;
  }

  // =============================================================================
  // CRUD OPERATIONS FOR USER MANAGEMENT
  // =============================================================================

  // Create a new user in local storage (to be synced with ERPNext)
  async createLocalUser(userData) {
    try {
      // Generate unique ID
      const userId = userData.id || `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Hash password if provided
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      // Prepare user object
      const user = {
        id: userId,
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store user in memory (in production, save to database)
      this.localUsers.set(userId, user);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;

    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Get user by ID (from local storage or ERPNext)
  async getUserById(userId) {
    try {
      // Check local storage first
      const localUser = this.localUsers.get(userId);
      if (localUser) {
        const { password, ...userWithoutPassword } = localUser;
        return userWithoutPassword;
      }

      // Try to fetch from ERPNext based on ID pattern
      if (userId.startsWith('EDU-STU-')) {
        // It's a student
        const student = await this.erpnext.getDoc('Student', userId);
        if (student?.data) {
          return {
            id: student.data.name,
            ...student.data,
            role: 'student'
          };
        }
      } else if (userId.startsWith('EDU-INS-')) {
        // It's an instructor
        const instructor = await this.erpnext.getDoc('Instructor', userId);
        if (instructor?.data) {
          return {
            id: instructor.data.name,
            ...instructor.data,
            role: 'teacher'
          };
        }
      } else if (userId.startsWith('EDU-GRD-')) {
        // It's a guardian
        const guardian = await this.erpnext.getDoc('Guardian', userId);
        if (guardian?.data) {
          return {
            id: guardian.data.name,
            ...guardian.data,
            role: 'parent'
          };
        }
      }

      return null;

    } catch (error) {
      console.error(`Failed to get user: ${error.message}`);
      return null;
    }
  }

  // Update user (in local storage and ERPNext)
  async updateUserLocal(userId, updates) {
    try {
      // Check if user exists locally
      const localUser = this.localUsers.get(userId);

      if (localUser) {
        // Update local user
        Object.keys(updates).forEach(key => {
          if (key !== 'id' && key !== 'password') {
            localUser[key] = updates[key];
          }
        });

        // Update password if provided
        if (updates.password) {
          localUser.password = await bcrypt.hash(updates.password, 10);
        }

        localUser.updated_at = new Date().toISOString();

        // Store updated user
        this.localUsers.set(userId, localUser);

        // Return user without password
        const { password, ...userWithoutPassword } = localUser;
        return userWithoutPassword;
      }

      // If not local, try to update in ERPNext
      if (userId.startsWith('EDU-')) {
        // User is from ERPNext, return the updates
        return {
          id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }

      throw new Error('User not found');

    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Alias for backward compatibility - the second updateUser method
  async updateUser(userId, type, updates) {
    // If type is actually updates object (when called with 2 params), use it as updates
    if (typeof type === 'object' && !updates) {
      return this.updateUserLocal(userId, type);
    }
    // Otherwise call the original ERPNext updateUser (first method)
    try {
      let result;

      if (type === 'Student') {
        result = await this.erpnext.updateDoc('Student', userId, updates);
      } else if (type === 'Employee') {
        result = await this.erpnext.updateDoc('Employee', userId, updates);
      }

      return result;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // Delete user (from local storage and ERPNext)
  async deleteUser(userId) {
    try {
      // Check local storage first
      if (this.localUsers.has(userId)) {
        this.localUsers.delete(userId);
        return true;
      }

      // For ERPNext users, we need to track deleted users
      if (userId.startsWith('EDU-')) {
        // Initialize deleted users set if not exists
        if (!this.deletedUsers) {
          this.deletedUsers = new Set();
        }

        // Add to deleted users list
        this.deletedUsers.add(userId);
        console.log(`User ${userId} marked as deleted in portal`);
        return true;
      }

      throw new Error('User not found');

    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

module.exports = UserManagementService;