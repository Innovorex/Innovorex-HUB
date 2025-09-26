#!/usr/bin/env node

/**
 * Portal to ERPNext Sync Service
 * Syncs data from Portal database to ERPNext
 * Handles all doctypes: User Management, Programs, Courses, etc.
 */

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Load environment variables
dotenv.config({ path: '.env' });

// Configuration
const CONFIG = {
  ERPNEXT_URL: process.env.ERPNEXT_URL || 'https://erpeducation.innovorex.co.in',
  API_KEY: process.env.ERPNEXT_API_KEY,
  API_SECRET: process.env.ERPNEXT_API_SECRET,
  PORTAL_DB_PATH: path.join(__dirname, 'portal-db.json'),
  SYNC_LOG_FILE: path.join(__dirname, 'logs', 'portal-to-erpnext-sync.log'),
  BATCH_SIZE: 10, // Process in batches to avoid overwhelming ERPNext
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000 // 2 seconds
};

class PortalToERPNextSync {
  constructor() {
    this.authHeader = null;
    this.portalData = {};
    this.syncQueue = [];
    this.syncStats = {
      created: 0,
      updated: 0,
      failed: 0,
      skipped: 0
    };
  }

  async init() {
    console.log('🚀 Portal to ERPNext Sync Service Initializing...');
    console.log(`📍 ERPNext URL: ${CONFIG.ERPNEXT_URL}`);

    // Setup authentication
    this.setupAuth();

    // Create log directory if it doesn't exist
    await this.ensureDirectory(path.dirname(CONFIG.SYNC_LOG_FILE));

    // Load portal database
    await this.loadPortalData();

    return true;
  }

  setupAuth() {
    if (CONFIG.API_KEY && CONFIG.API_SECRET) {
      const authString = Buffer.from(`${CONFIG.API_KEY}:${CONFIG.API_SECRET}`).toString('base64');
      this.authHeader = `Basic ${authString}`;
    }
  }

  async ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error.message);
    }
  }

  async loadPortalData() {
    try {
      // In production, this would connect to actual database
      // For now, we'll use a mock database file
      const exists = await fs.access(CONFIG.PORTAL_DB_PATH).then(() => true).catch(() => false);
      if (exists) {
        const data = await fs.readFile(CONFIG.PORTAL_DB_PATH, 'utf-8');
        this.portalData = JSON.parse(data);
      } else {
        this.portalData = {
          users: [],
          students: [],
          instructors: [],
          guardians: [],
          programs: [],
          courses: [],
          academic_years: [],
          academic_terms: [],
          rooms: [],
          student_groups: [],
          attendance: [],
          assessments: [],
          fees: []
        };
      }
    } catch (error) {
      console.error('Error loading portal data:', error.message);
      this.portalData = {};
    }
  }

  async savePortalData() {
    try {
      await fs.writeFile(CONFIG.PORTAL_DB_PATH, JSON.stringify(this.portalData, null, 2));
    } catch (error) {
      console.error('Error saving portal data:', error.message);
    }
  }

  // Generate ERPNext-compatible ID
  generateERPNextId(prefix, counter) {
    const year = new Date().getFullYear();
    const paddedCounter = String(counter).padStart(5, '0');
    return `${prefix}-${year}-${paddedCounter}`;
  }

  // Make ERPNext API request with retries
  async makeERPNextRequest(method, endpoint, data = null, retryCount = 0) {
    try {
      const config = {
        method,
        url: `${CONFIG.ERPNEXT_URL}${endpoint}`,
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      if (retryCount < CONFIG.RETRY_ATTEMPTS) {
        console.log(`  ⚠️ Request failed, retrying (${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS})...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        return this.makeERPNextRequest(method, endpoint, data, retryCount + 1);
      }

      console.error(`  ❌ Failed after ${CONFIG.RETRY_ATTEMPTS} attempts:`, error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Check if document exists in ERPNext
  async checkDocumentExists(doctype, name) {
    const result = await this.makeERPNextRequest(
      'GET',
      `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`
    );
    return result.success;
  }

  // 1. USER MANAGEMENT SYNC
  async syncUserManagement(userData) {
    console.log('\n📤 Syncing User Management...');

    for (const user of userData) {
      try {
        // Determine user type and map to appropriate doctype
        let doctype, mappedData;

        switch (user.role) {
          case 'student':
            doctype = 'Student';
            mappedData = {
              first_name: user.firstName,
              middle_name: user.middleName || '',
              last_name: user.lastName,
              student_email_id: user.email,
              student_mobile_number: user.phone,
              gender: user.gender || 'Male',
              date_of_birth: user.dateOfBirth,
              blood_group: user.bloodGroup,
              address_line_1: user.address,
              city: user.city || 'Unknown',
              state: user.state || 'Unknown',
              pincode: user.pincode,
              enabled: user.isActive ? 1 : 0
            };

            // Generate student ID if not exists
            if (!user.erpnextId) {
              const studentCount = await this.getDocumentCount('Student');
              mappedData.name = this.generateERPNextId('EDU-STU', studentCount + 1);
            } else {
              mappedData.name = user.erpnextId;
            }
            break;

          case 'instructor':
          case 'teacher':
            doctype = 'Instructor';
            mappedData = {
              instructor_name: `${user.firstName} ${user.lastName}`,
              gender: user.gender || 'Male',
              employee: user.employeeId,
              department: user.department || 'CBSE - SRS',
              status: user.isActive ? 'Active' : 'Inactive'
            };

            if (!user.erpnextId) {
              const instructorCount = await this.getDocumentCount('Instructor');
              mappedData.name = this.generateERPNextId('EDU-INS', instructorCount + 1);
            } else {
              mappedData.name = user.erpnextId;
            }
            break;

          case 'parent':
          case 'guardian':
            doctype = 'Guardian';
            mappedData = {
              guardian_name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              mobile_number: user.phone,
              alternate_number: user.alternatePhone,
              date_of_birth: user.dateOfBirth,
              occupation: user.occupation,
              designation: user.designation,
              work_address: user.workAddress
            };

            if (!user.erpnextId) {
              const guardianCount = await this.getDocumentCount('Guardian');
              mappedData.name = this.generateERPNextId('EDU-GRD', guardianCount + 1);
            } else {
              mappedData.name = user.erpnextId;
            }
            break;

          default:
            console.log(`  ⚠️ Skipping user with unknown role: ${user.role}`);
            this.syncStats.skipped++;
            continue;
        }

        // Check if document exists
        const exists = await this.checkDocumentExists(doctype, mappedData.name);

        let result;
        if (exists) {
          // Update existing document
          result = await this.makeERPNextRequest(
            'PUT',
            `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(mappedData.name)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Updated ${doctype}: ${mappedData.name}`);
            this.syncStats.updated++;
          }
        } else {
          // Create new document
          result = await this.makeERPNextRequest(
            'POST',
            `/api/resource/${encodeURIComponent(doctype)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Created ${doctype}: ${mappedData.name}`);
            this.syncStats.created++;

            // Update portal data with ERPNext ID
            user.erpnextId = mappedData.name;
          }
        }

        if (!result.success) {
          console.log(`  ❌ Failed to sync ${doctype}: ${result.error}`);
          this.syncStats.failed++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing user:`, error.message);
        this.syncStats.failed++;
      }
    }
  }

  // 2. PROGRAM MANAGEMENT SYNC
  async syncProgramManagement(programs) {
    console.log('\n📤 Syncing Program Management...');

    for (const program of programs) {
      try {
        const mappedData = {
          program_name: program.name,
          program_code: program.code,
          program_abbreviation: program.abbreviation || program.code,
          description: program.description,
          is_published: program.isPublished ? 1 : 0,
          is_featured: program.isFeatured ? 1 : 0
        };

        if (!program.erpnextId) {
          const programCount = await this.getDocumentCount('Program');
          mappedData.name = this.generateERPNextId('EDU-PRG', programCount + 1);
        } else {
          mappedData.name = program.erpnextId;
        }

        const exists = await this.checkDocumentExists('Program', mappedData.name);

        let result;
        if (exists) {
          result = await this.makeERPNextRequest(
            'PUT',
            `/api/resource/Program/${encodeURIComponent(mappedData.name)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Updated Program: ${mappedData.name}`);
            this.syncStats.updated++;
          }
        } else {
          result = await this.makeERPNextRequest(
            'POST',
            '/api/resource/Program',
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Created Program: ${mappedData.name}`);
            this.syncStats.created++;
            program.erpnextId = mappedData.name;
          }
        }

        if (!result.success) {
          console.log(`  ❌ Failed to sync Program: ${result.error}`);
          this.syncStats.failed++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing program:`, error.message);
        this.syncStats.failed++;
      }
    }
  }

  // 3. COURSE MANAGEMENT SYNC
  async syncCourseManagement(courses) {
    console.log('\n📤 Syncing Course Management...');

    for (const course of courses) {
      try {
        const mappedData = {
          course_name: course.name,
          course_code: course.code,
          course_abbreviation: course.abbreviation || course.code,
          department: course.department || 'CBSE - SRS',
          course_intro: course.description,
          default_grading_scale: course.gradingScale
        };

        if (!course.erpnextId) {
          const courseCount = await this.getDocumentCount('Course');
          mappedData.name = this.generateERPNextId('EDU-CRS', courseCount + 1);
        } else {
          mappedData.name = course.erpnextId;
        }

        const exists = await this.checkDocumentExists('Course', mappedData.name);

        let result;
        if (exists) {
          result = await this.makeERPNextRequest(
            'PUT',
            `/api/resource/Course/${encodeURIComponent(mappedData.name)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Updated Course: ${mappedData.name}`);
            this.syncStats.updated++;
          }
        } else {
          result = await this.makeERPNextRequest(
            'POST',
            '/api/resource/Course',
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Created Course: ${mappedData.name}`);
            this.syncStats.created++;
            course.erpnextId = mappedData.name;
          }
        }

        if (!result.success) {
          console.log(`  ❌ Failed to sync Course: ${result.error}`);
          this.syncStats.failed++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing course:`, error.message);
        this.syncStats.failed++;
      }
    }
  }

  // 4. ACADEMIC SETUP SYNC
  async syncAcademicSetup(academicData) {
    console.log('\n📤 Syncing Academic Setup...');

    // Sync Academic Years
    if (academicData.years) {
      for (const year of academicData.years) {
        try {
          const mappedData = {
            academic_year_name: year.name,
            year_start_date: year.startDate,
            year_end_date: year.endDate
          };

          const exists = await this.checkDocumentExists('Academic Year', year.name);

          let result;
          if (exists) {
            result = await this.makeERPNextRequest(
              'PUT',
              `/api/resource/Academic Year/${encodeURIComponent(year.name)}`,
              mappedData
            );
            if (result.success) {
              console.log(`  ✅ Updated Academic Year: ${year.name}`);
              this.syncStats.updated++;
            }
          } else {
            mappedData.name = year.name;
            result = await this.makeERPNextRequest(
              'POST',
              '/api/resource/Academic Year',
              mappedData
            );
            if (result.success) {
              console.log(`  ✅ Created Academic Year: ${year.name}`);
              this.syncStats.created++;
            }
          }

          if (!result.success) {
            console.log(`  ❌ Failed to sync Academic Year: ${result.error}`);
            this.syncStats.failed++;
          }

        } catch (error) {
          console.error(`  ❌ Error syncing academic year:`, error.message);
          this.syncStats.failed++;
        }
      }
    }

    // Sync Academic Terms
    if (academicData.terms) {
      for (const term of academicData.terms) {
        try {
          const mappedData = {
            term_name: term.name,
            academic_year: term.academicYear,
            term_start_date: term.startDate,
            term_end_date: term.endDate
          };

          const exists = await this.checkDocumentExists('Academic Term', term.name);

          let result;
          if (exists) {
            result = await this.makeERPNextRequest(
              'PUT',
              `/api/resource/Academic Term/${encodeURIComponent(term.name)}`,
              mappedData
            );
            if (result.success) {
              console.log(`  ✅ Updated Academic Term: ${term.name}`);
              this.syncStats.updated++;
            }
          } else {
            mappedData.name = term.name;
            result = await this.makeERPNextRequest(
              'POST',
              '/api/resource/Academic Term',
              mappedData
            );
            if (result.success) {
              console.log(`  ✅ Created Academic Term: ${term.name}`);
              this.syncStats.created++;
            }
          }

          if (!result.success) {
            console.log(`  ❌ Failed to sync Academic Term: ${result.error}`);
            this.syncStats.failed++;
          }

        } catch (error) {
          console.error(`  ❌ Error syncing academic term:`, error.message);
          this.syncStats.failed++;
        }
      }
    }

    // Sync Rooms
    if (academicData.rooms) {
      for (const room of academicData.rooms) {
        try {
          const mappedData = {
            room_name: room.name,
            room_number: room.number,
            seating_capacity: room.capacity,
            building: room.building
          };

          const exists = await this.checkDocumentExists('Room', room.name);

          let result;
          if (exists) {
            result = await this.makeERPNextRequest(
              'PUT',
              `/api/resource/Room/${encodeURIComponent(room.name)}`,
              mappedData
            );
            if (result.success) {
              console.log(`  ✅ Updated Room: ${room.name}`);
              this.syncStats.updated++;
            }
          } else {
            mappedData.name = room.name;
            result = await this.makeERPNextRequest(
              'POST',
              '/api/resource/Room',
              mappedData
            );
            if (result.success) {
              console.log(`  ✅ Created Room: ${room.name}`);
              this.syncStats.created++;
            }
          }

          if (!result.success) {
            console.log(`  ❌ Failed to sync Room: ${result.error}`);
            this.syncStats.failed++;
          }

        } catch (error) {
          console.error(`  ❌ Error syncing room:`, error.message);
          this.syncStats.failed++;
        }
      }
    }
  }

  // 5. STUDENT MANAGEMENT SYNC
  async syncStudentManagement(studentData) {
    console.log('\n📤 Syncing Student Management...');

    // This would handle Student Applicant, Student Admission, Student Batch, etc.
    // Similar pattern to above methods

    for (const student of studentData) {
      try {
        const mappedData = {
          first_name: student.firstName,
          middle_name: student.middleName || '',
          last_name: student.lastName,
          student_email_id: student.email,
          student_mobile_number: student.phone,
          gender: student.gender,
          date_of_birth: student.dateOfBirth,
          blood_group: student.bloodGroup,
          student_category: student.category,
          student_batch_name: student.batch,
          program: student.program,
          enabled: student.isActive ? 1 : 0
        };

        if (!student.erpnextId) {
          const studentCount = await this.getDocumentCount('Student');
          mappedData.name = this.generateERPNextId('EDU-STU', studentCount + 1);
        } else {
          mappedData.name = student.erpnextId;
        }

        const exists = await this.checkDocumentExists('Student', mappedData.name);

        let result;
        if (exists) {
          result = await this.makeERPNextRequest(
            'PUT',
            `/api/resource/Student/${encodeURIComponent(mappedData.name)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Updated Student: ${mappedData.name}`);
            this.syncStats.updated++;
          }
        } else {
          result = await this.makeERPNextRequest(
            'POST',
            '/api/resource/Student',
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Created Student: ${mappedData.name}`);
            this.syncStats.created++;
            student.erpnextId = mappedData.name;
          }
        }

        if (!result.success) {
          console.log(`  ❌ Failed to sync Student: ${result.error}`);
          this.syncStats.failed++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing student:`, error.message);
        this.syncStats.failed++;
      }
    }
  }

  // 6. INSTRUCTOR MANAGEMENT SYNC
  async syncInstructorManagement(instructorData) {
    console.log('\n📤 Syncing Instructor Management...');

    for (const instructor of instructorData) {
      try {
        const mappedData = {
          instructor_name: instructor.name,
          gender: instructor.gender,
          employee: instructor.employeeId,
          department: instructor.department || 'CBSE - SRS',
          custom_course: instructor.course,
          status: instructor.isActive ? 'Active' : 'Inactive'
        };

        if (!instructor.erpnextId) {
          const instructorCount = await this.getDocumentCount('Instructor');
          mappedData.name = this.generateERPNextId('EDU-INS', instructorCount + 1);
        } else {
          mappedData.name = instructor.erpnextId;
        }

        const exists = await this.checkDocumentExists('Instructor', mappedData.name);

        let result;
        if (exists) {
          result = await this.makeERPNextRequest(
            'PUT',
            `/api/resource/Instructor/${encodeURIComponent(mappedData.name)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Updated Instructor: ${mappedData.name}`);
            this.syncStats.updated++;
          }
        } else {
          result = await this.makeERPNextRequest(
            'POST',
            '/api/resource/Instructor',
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Created Instructor: ${mappedData.name}`);
            this.syncStats.created++;
            instructor.erpnextId = mappedData.name;
          }
        }

        if (!result.success) {
          console.log(`  ❌ Failed to sync Instructor: ${result.error}`);
          this.syncStats.failed++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing instructor:`, error.message);
        this.syncStats.failed++;
      }
    }
  }

  // 7. ATTENDANCE SYNC
  async syncAttendance(attendanceData) {
    console.log('\n📤 Syncing Attendance...');

    for (const attendance of attendanceData) {
      try {
        const mappedData = {
          student: attendance.studentId,
          student_name: attendance.studentName,
          student_group: attendance.studentGroup,
          date: attendance.date,
          status: attendance.status, // Present, Absent, Half Day
          leave_application: attendance.leaveApplication
        };

        if (!attendance.erpnextId) {
          const attendanceCount = await this.getDocumentCount('Student Attendance');
          mappedData.name = this.generateERPNextId('EDU-ATT', attendanceCount + 1);
        } else {
          mappedData.name = attendance.erpnextId;
        }

        const exists = await this.checkDocumentExists('Student Attendance', mappedData.name);

        let result;
        if (exists) {
          result = await this.makeERPNextRequest(
            'PUT',
            `/api/resource/Student Attendance/${encodeURIComponent(mappedData.name)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Updated Student Attendance: ${mappedData.name}`);
            this.syncStats.updated++;
          }
        } else {
          result = await this.makeERPNextRequest(
            'POST',
            '/api/resource/Student Attendance',
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Created Student Attendance: ${mappedData.name}`);
            this.syncStats.created++;
            attendance.erpnextId = mappedData.name;
          }
        }

        if (!result.success) {
          console.log(`  ❌ Failed to sync Student Attendance: ${result.error}`);
          this.syncStats.failed++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing attendance:`, error.message);
        this.syncStats.failed++;
      }
    }
  }

  // 8. ASSESSMENT SYNC
  async syncAssessment(assessmentData) {
    console.log('\n📤 Syncing Assessment...');

    for (const assessment of assessmentData) {
      try {
        const mappedData = {
          assessment_name: assessment.name,
          assessment_group: assessment.group,
          program: assessment.program,
          course: assessment.course,
          student_group: assessment.studentGroup,
          assessment_criteria: assessment.criteria,
          maximum_score: assessment.maxScore,
          grading_scale: assessment.gradingScale,
          schedule_date: assessment.scheduledDate
        };

        if (!assessment.erpnextId) {
          const assessmentCount = await this.getDocumentCount('Assessment Plan');
          mappedData.name = this.generateERPNextId('EDU-ASS-PLAN', assessmentCount + 1);
        } else {
          mappedData.name = assessment.erpnextId;
        }

        const exists = await this.checkDocumentExists('Assessment Plan', mappedData.name);

        let result;
        if (exists) {
          result = await this.makeERPNextRequest(
            'PUT',
            `/api/resource/Assessment Plan/${encodeURIComponent(mappedData.name)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Updated Assessment Plan: ${mappedData.name}`);
            this.syncStats.updated++;
          }
        } else {
          result = await this.makeERPNextRequest(
            'POST',
            '/api/resource/Assessment Plan',
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Created Assessment Plan: ${mappedData.name}`);
            this.syncStats.created++;
            assessment.erpnextId = mappedData.name;
          }
        }

        if (!result.success) {
          console.log(`  ❌ Failed to sync Assessment Plan: ${result.error}`);
          this.syncStats.failed++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing assessment:`, error.message);
        this.syncStats.failed++;
      }
    }
  }

  // 9. FEES MANAGEMENT SYNC
  async syncFeesManagement(feesData) {
    console.log('\n📤 Syncing Fees Management...');

    for (const fee of feesData) {
      try {
        const mappedData = {
          program: fee.program,
          student_category: fee.studentCategory,
          academic_term: fee.academicTerm,
          fee_structure_name: fee.structureName,
          components: fee.components // Array of fee components
        };

        if (!fee.erpnextId) {
          const feeCount = await this.getDocumentCount('Fee Structure');
          mappedData.name = this.generateERPNextId('EDU-FEE-STRUCT', feeCount + 1);
        } else {
          mappedData.name = fee.erpnextId;
        }

        const exists = await this.checkDocumentExists('Fee Structure', mappedData.name);

        let result;
        if (exists) {
          result = await this.makeERPNextRequest(
            'PUT',
            `/api/resource/Fee Structure/${encodeURIComponent(mappedData.name)}`,
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Updated Fee Structure: ${mappedData.name}`);
            this.syncStats.updated++;
          }
        } else {
          result = await this.makeERPNextRequest(
            'POST',
            '/api/resource/Fee Structure',
            mappedData
          );
          if (result.success) {
            console.log(`  ✅ Created Fee Structure: ${mappedData.name}`);
            this.syncStats.created++;
            fee.erpnextId = mappedData.name;
          }
        }

        if (!result.success) {
          console.log(`  ❌ Failed to sync Fee Structure: ${result.error}`);
          this.syncStats.failed++;
        }

      } catch (error) {
        console.error(`  ❌ Error syncing fees:`, error.message);
        this.syncStats.failed++;
      }
    }
  }

  // Helper method to get document count
  async getDocumentCount(doctype) {
    try {
      const result = await this.makeERPNextRequest(
        'GET',
        `/api/resource/${encodeURIComponent(doctype)}?fields=["count(name) as total"]`
      );
      if (result.success && result.data?.data?.[0]?.total) {
        return parseInt(result.data.data[0].total) || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Main sync method that orchestrates all syncs
  async performFullSync() {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 Starting Portal to ERPNext Sync');
    console.log('='.repeat(60));

    const startTime = Date.now();

    // Reset stats
    this.syncStats = {
      created: 0,
      updated: 0,
      failed: 0,
      skipped: 0
    };

    try {
      // Load latest portal data
      await this.loadPortalData();

      // Perform sync for each module
      if (this.portalData.users?.length > 0) {
        await this.syncUserManagement(this.portalData.users);
      }

      if (this.portalData.programs?.length > 0) {
        await this.syncProgramManagement(this.portalData.programs);
      }

      if (this.portalData.courses?.length > 0) {
        await this.syncCourseManagement(this.portalData.courses);
      }

      const academicData = {
        years: this.portalData.academic_years,
        terms: this.portalData.academic_terms,
        rooms: this.portalData.rooms
      };
      await this.syncAcademicSetup(academicData);

      if (this.portalData.students?.length > 0) {
        await this.syncStudentManagement(this.portalData.students);
      }

      if (this.portalData.instructors?.length > 0) {
        await this.syncInstructorManagement(this.portalData.instructors);
      }

      if (this.portalData.attendance?.length > 0) {
        await this.syncAttendance(this.portalData.attendance);
      }

      if (this.portalData.assessments?.length > 0) {
        await this.syncAssessment(this.portalData.assessments);
      }

      if (this.portalData.fees?.length > 0) {
        await this.syncFeesManagement(this.portalData.fees);
      }

      // Save updated portal data with ERPNext IDs
      await this.savePortalData();

    } catch (error) {
      console.error('❌ Sync error:', error.message);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Summary:');
    console.log(`  ✅ Created: ${this.syncStats.created} documents`);
    console.log(`  📝 Updated: ${this.syncStats.updated} documents`);
    console.log(`  ❌ Failed: ${this.syncStats.failed} documents`);
    console.log(`  ⏭️  Skipped: ${this.syncStats.skipped} documents`);
    console.log(`  ⏱️  Duration: ${duration} seconds`);
    console.log('='.repeat(60));

    // Log to file
    await this.writeLog({
      timestamp: new Date().toISOString(),
      stats: this.syncStats,
      duration: duration
    });

    return this.syncStats;
  }

  async writeLog(logData) {
    try {
      const logEntry = JSON.stringify(logData) + '\n';
      await fs.appendFile(CONFIG.SYNC_LOG_FILE, logEntry);
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  // Add new portal data (called from API endpoints)
  async addPortalData(type, data) {
    await this.loadPortalData();

    if (!this.portalData[type]) {
      this.portalData[type] = [];
    }

    // Add unique ID if not present
    if (!data.id) {
      data.id = crypto.randomBytes(16).toString('hex');
    }

    this.portalData[type].push(data);
    await this.savePortalData();

    // Trigger sync for this specific item
    return this.syncSingleItem(type, data);
  }

  // Sync single item immediately
  async syncSingleItem(type, data) {
    console.log(`\n🔄 Syncing single ${type} item...`);

    try {
      switch(type) {
        case 'users':
          await this.syncUserManagement([data]);
          break;
        case 'programs':
          await this.syncProgramManagement([data]);
          break;
        case 'courses':
          await this.syncCourseManagement([data]);
          break;
        case 'students':
          await this.syncStudentManagement([data]);
          break;
        case 'instructors':
          await this.syncInstructorManagement([data]);
          break;
        case 'attendance':
          await this.syncAttendance([data]);
          break;
        case 'assessments':
          await this.syncAssessment([data]);
          break;
        case 'fees':
          await this.syncFeesManagement([data]);
          break;
        default:
          console.log(`Unknown type: ${type}`);
          return { success: false, error: 'Unknown data type' };
      }

      return { success: true, message: 'Item synced successfully' };
    } catch (error) {
      console.error(`Failed to sync ${type} item:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in other modules
module.exports = PortalToERPNextSync;

// If run directly, start sync service
if (require.main === module) {
  const syncService = new PortalToERPNextSync();

  syncService.init().then(() => {
    console.log('✅ Portal to ERPNext Sync Service initialized');

    // Optional: Perform initial sync
    syncService.performFullSync().then(() => {
      console.log('✅ Initial sync completed');
    });
  }).catch(error => {
    console.error('❌ Failed to initialize sync service:', error);
    process.exit(1);
  });
}