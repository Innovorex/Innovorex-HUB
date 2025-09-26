// Comprehensive AI Agent Test Suite for All Portal Menus
const axios = require('axios');
const colors = require('colors/safe');

const BASE_URL = 'http://localhost:7001';

// Test configuration for each module
const MODULE_TESTS = {
  // USER MANAGEMENT
  users: {
    name: '👤 User Management',
    path: '/admin/users',
    tests: [
      {
        message: 'Add Sarah Johnson as a student in grade 10',
        expectedAction: 'create_user',
        expectedEntities: ['fullName', 'role', 'grade']
      },
      {
        message: 'Update email for user john.doe@school.com to newemail@school.com',
        expectedAction: 'update_user',
        expectedEntities: ['userId']
      },
      {
        message: 'Search for all teachers',
        expectedAction: 'search_user',
        expectedEntities: ['searchTerm']
      }
    ]
  },

  // PROGRAM MANAGEMENT
  programs: {
    name: '🎓 Program Management',
    path: '/admin/programs',
    tests: [
      {
        message: 'Create Computer Science program for 4 years in Engineering department',
        expectedAction: 'create_program',
        expectedEntities: ['program_name', 'duration', 'department']
      },
      {
        message: 'Enroll John Doe in Mathematics program for 2024-2025',
        expectedAction: 'enroll_in_program',
        expectedEntities: ['student', 'program', 'academic_year']
      }
    ]
  },

  // COURSE MANAGEMENT
  courses: {
    name: '📚 Course Management',
    path: '/admin/courses',
    tests: [
      {
        message: 'Create Data Structures course with code CS201 for 4 credits',
        expectedAction: 'create_course',
        expectedEntities: ['course_name', 'course_code', 'credits']
      },
      {
        message: 'Assign Dr. Smith to teach Physics for Fall 2024',
        expectedAction: 'assign_instructor',
        expectedEntities: ['instructor', 'course']
      },
      {
        message: 'Create schedule for CS101 on Monday from 9am to 11am in Room 301',
        expectedAction: 'create_course_schedule',
        expectedEntities: ['course', 'day', 'room']
      }
    ]
  },

  // STUDENT MANAGEMENT
  'student-management': {
    name: '🎒 Student Management',
    path: '/admin/students',
    tests: [
      {
        message: 'Create new student Emily Brown born on 2005-06-15',
        expectedAction: 'create_student',
        expectedEntities: ['first_name', 'last_name', 'date_of_birth']
      },
      {
        message: 'Create student group Section A for Computer Science with 40 seats',
        expectedAction: 'create_student_group',
        expectedEntities: ['group_name', 'program', 'max_strength']
      },
      {
        message: 'Add guardian John Brown as father for student emily@school.com',
        expectedAction: 'create_guardian',
        expectedEntities: ['guardian_name', 'relation', 'student']
      }
    ]
  },

  // INSTRUCTOR MANAGEMENT
  'instructor-management': {
    name: '👨‍🏫 Instructor Management',
    path: '/admin/instructor',
    tests: [
      {
        message: 'Add Dr. Emily Wilson as Professor in Physics department',
        expectedAction: 'create_instructor',
        expectedEntities: ['employee_name', 'designation', 'department']
      },
      {
        message: 'Assign Mathematics course to Dr. Johnson for 2024-2025',
        expectedAction: 'assign_course_to_instructor',
        expectedEntities: ['instructor', 'course', 'academic_year']
      }
    ]
  },

  // ATTENDANCE
  attendance: {
    name: '✅ Attendance',
    path: '/admin/student-attendance',
    tests: [
      {
        message: 'Mark John Doe present for Mathematics class today',
        expectedAction: 'mark_attendance',
        expectedEntities: ['student', 'course', 'status']
      },
      {
        message: 'Submit leave application for 3 days due to medical reasons',
        expectedAction: 'create_leave_application',
        expectedEntities: ['reason']
      },
      {
        message: 'Mark all students in Section A present for today',
        expectedAction: 'bulk_attendance',
        expectedEntities: ['student_group']
      }
    ]
  },

  // ASSESSMENT
  assessment: {
    name: '📝 Assessment',
    path: '/admin/assessment',
    tests: [
      {
        message: 'Create midterm exam for Mathematics worth 100 marks on March 15',
        expectedAction: 'create_assessment',
        expectedEntities: ['assessment_name', 'course', 'maximum_marks']
      },
      {
        message: 'Submit grade 85 for John Doe in Physics exam',
        expectedAction: 'submit_grades',
        expectedEntities: ['student', 'assessment', 'marks_obtained']
      },
      {
        message: 'Generate report card for Sarah Johnson for Semester 1',
        expectedAction: 'generate_report_card',
        expectedEntities: ['student', 'academic_term']
      }
    ]
  },

  // FEES MANAGEMENT
  fees: {
    name: '💰 Fees Management',
    path: '/admin/fees',
    tests: [
      {
        message: 'Create tuition fee structure of 50000 for Computer Science program',
        expectedAction: 'create_fee_structure',
        expectedEntities: ['program', 'amount', 'fee_category']
      },
      {
        message: 'Record payment of 25000 from John Doe via bank transfer',
        expectedAction: 'record_payment',
        expectedEntities: ['student', 'amount', 'payment_mode']
      },
      {
        message: 'Generate invoice for upcoming semester fees',
        expectedAction: 'generate_invoice',
        expectedEntities: []
      }
    ]
  },

  // ACADEMIC SETTINGS
  'academic-settings': {
    name: '⚙️ Academic Settings',
    path: '/admin/academic-year',
    tests: [
      {
        message: 'Create academic year 2024-2025 starting from June 1',
        expectedAction: 'create_academic_year',
        expectedEntities: ['academic_year_name', 'year_start_date']
      },
      {
        message: 'Create Fall semester from August to December',
        expectedAction: 'create_academic_term',
        expectedEntities: ['term_name']
      },
      {
        message: 'Add new computer lab Room 405 with 40 seats',
        expectedAction: 'create_room',
        expectedEntities: ['room_name', 'seating_capacity']
      }
    ]
  },

  // DASHBOARD
  dashboard: {
    name: '📊 Dashboard',
    path: '/admin/dashboard',
    tests: [
      {
        message: 'Generate attendance report for last month',
        expectedAction: 'generate_attendance_report',
        expectedEntities: ['report_type']
      },
      {
        message: 'Generate performance report for all students',
        expectedAction: 'generate_performance_report',
        expectedEntities: ['report_type']
      }
    ]
  },

  // KNOWLEDGE BASE
  'knowledge-base': {
    name: '📖 Knowledge Base',
    path: '/admin/knowledge-base',
    tests: [
      {
        message: 'Upload chemistry notes for grade 10',
        expectedAction: 'upload_document',
        expectedEntities: ['title', 'course_id']
      }
    ]
  }
};

// Use the actual IntentParser Service
const IntentParserService = require('./services/IntentParserService');

// Test runner
async function runTests() {
  console.log(colors.bold.cyan('\n🚀 AI Agent Comprehensive Test Suite\n'));
  console.log(colors.gray('Testing AI Agent functionality across all portal menus...\n'));

  // Use the actual IntentParserService
  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const [moduleKey, module] of Object.entries(MODULE_TESTS)) {
    console.log(colors.bold.yellow(`\n${module.name}`));
    console.log(colors.gray(`Path: ${module.path}`));
    console.log(colors.gray('─'.repeat(60)));

    for (const test of module.tests) {
      const context = {
        module: moduleKey,
        availableActions: [] // Would be populated from ActionRegistry
      };

      // Parse intent using the actual service
      const result = IntentParserService.parseLocally(test.message, context) || {
        action: null,
        entities: {},
        confidence: 0,
        missingFields: []
      };

      // Check if action was correctly identified
      const actionCorrect = result.action === test.expectedAction;

      // Check if key entities were extracted
      const entitiesFound = test.expectedEntities.filter(
        entity => result.entities[entity] !== undefined
      );
      const entitiesCorrect = entitiesFound.length > 0 || test.expectedEntities.length === 0;

      const testPassed = actionCorrect && entitiesCorrect;

      if (testPassed) {
        console.log(colors.green('  ✅'), test.message.substring(0, 50) + '...');
        console.log(colors.gray(`     → Action: ${result.action || 'none'}`));
        console.log(colors.gray(`     → Entities: ${JSON.stringify(result.entities)}`));
        results.passed++;
      } else {
        console.log(colors.red('  ❌'), test.message.substring(0, 50) + '...');
        console.log(colors.red(`     → Expected: ${test.expectedAction}`));
        console.log(colors.red(`     → Got: ${result.action || 'none'}`));
        console.log(colors.red(`     → Entities: ${JSON.stringify(result.entities)}`));
        results.failed++;
      }

      results.details.push({
        module: module.name,
        message: test.message,
        passed: testPassed,
        result
      });
    }
  }

  // Summary
  console.log(colors.bold.cyan('\n\n📊 Test Summary'));
  console.log(colors.gray('─'.repeat(60)));
  console.log(colors.green(`  ✅ Passed: ${results.passed}`));
  console.log(colors.red(`  ❌ Failed: ${results.failed}`));
  console.log(colors.blue(`  📝 Total: ${results.passed + results.failed}`));
  console.log(colors.yellow(`  🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`));

  // Module Coverage
  console.log(colors.bold.cyan('\n📈 Module Coverage'));
  console.log(colors.gray('─'.repeat(60)));

  const moduleCoverage = {};
  results.details.forEach(detail => {
    if (!moduleCoverage[detail.module]) {
      moduleCoverage[detail.module] = { passed: 0, failed: 0 };
    }
    if (detail.passed) {
      moduleCoverage[detail.module].passed++;
    } else {
      moduleCoverage[detail.module].failed++;
    }
  });

  Object.entries(moduleCoverage).forEach(([module, stats]) => {
    const total = stats.passed + stats.failed;
    const percentage = ((stats.passed / total) * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
    console.log(`  ${module.padEnd(25)} ${bar} ${percentage}%`);
  });

  // Recommendations
  console.log(colors.bold.cyan('\n💡 Recommendations'));
  console.log(colors.gray('─'.repeat(60)));

  if (results.failed > 0) {
    console.log(colors.yellow('  • Some intent parsing needs improvement'));
    console.log(colors.yellow('  • Consider adding more training patterns'));
    console.log(colors.yellow('  • Verify action definitions in ActionRegistry'));
  } else {
    console.log(colors.green('  • All tests passed successfully!'));
    console.log(colors.green('  • AI Agent is ready for production use'));
  }

  // API Integration Test
  console.log(colors.bold.cyan('\n🔌 API Integration Test'));
  console.log(colors.gray('─'.repeat(60)));

  try {
    // Test actual backend endpoint
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.status === 'healthy') {
      console.log(colors.green('  ✅ Backend API is healthy'));
      console.log(colors.gray(`     → Uptime: ${Math.floor(response.data.uptime / 3600)} hours`));
      console.log(colors.gray(`     → Services: ${Object.keys(response.data.services).join(', ')}`));
    }
  } catch (error) {
    console.log(colors.red('  ❌ Backend API is not accessible'));
    console.log(colors.red(`     → Error: ${error.message}`));
  }

  console.log(colors.bold.green('\n✨ Test suite completed!\n'));

  return results;
}

// Install colors package if not available
const { exec } = require('child_process');
exec('npm list colors', (error) => {
  if (error) {
    console.log('Installing colors package...');
    exec('npm install colors', (err) => {
      if (!err) {
        runTests().catch(console.error);
      }
    });
  } else {
    runTests().catch(console.error);
  }
});