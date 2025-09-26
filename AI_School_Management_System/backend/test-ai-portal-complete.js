// Complete AI Agent Portal Test Suite
// Tests all menus with authentication
const axios = require('axios');
const colors = require('colors/safe');

// Configuration
const BASE_URL = 'https://server.innovorex.co.in';
const PORTAL_URL = 'https://portal.innovorex.co.in';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin@innovorex.co.in',
  password: 'Admin@123',
  role: 'admin'
};

// Comprehensive test cases for ALL portal menus
const MODULE_TESTS = {
  // USER MANAGEMENT
  users: {
    name: '👤 User Management',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Add Sarah Johnson as a student in grade 10',
        context: { module: 'users', path: '/admin/users' },
        expectedAction: 'create_user',
        validateResponse: (res) => res.action === 'create_user' && res.entities.fullName
      },
      {
        message: 'Update email for john.doe@school.com to newemail@school.com',
        context: { module: 'users', path: '/admin/users' },
        expectedAction: 'update_user',
        validateResponse: (res) => res.action === 'update_user' && res.entities.userId
      },
      {
        message: 'Search for all teachers in the system',
        context: { module: 'users', path: '/admin/users' },
        expectedAction: 'search_user',
        validateResponse: (res) => res.action === 'search_user'
      }
    ]
  },

  // PROGRAM MANAGEMENT
  programs: {
    name: '🎓 Program Management',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Create Computer Science program for 4 years duration',
        context: { module: 'programs', path: '/admin/programs' },
        expectedAction: 'create_program',
        validateResponse: (res) => res.action === 'create_program'
      },
      {
        message: 'Enroll John Doe in Mathematics program for 2024-2025',
        context: { module: 'programs', path: '/admin/programs' },
        expectedAction: 'enroll_in_program',
        validateResponse: (res) => res.action === 'enroll_in_program'
      }
    ]
  },

  // COURSE MANAGEMENT
  courses: {
    name: '📚 Course Management',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Create Data Structures course with code CS201 for 4 credits',
        context: { module: 'courses', path: '/admin/courses' },
        expectedAction: 'create_course',
        validateResponse: (res) => res.action === 'create_course' && res.entities.course_code
      },
      {
        message: 'Assign Dr. Smith to teach Physics for Fall 2024',
        context: { module: 'courses', path: '/admin/courses' },
        expectedAction: 'assign_instructor',
        validateResponse: (res) => res.action === 'assign_instructor'
      },
      {
        message: 'Create schedule for CS101 on Monday in Room 301',
        context: { module: 'courses', path: '/admin/courses' },
        expectedAction: 'create_course_schedule',
        validateResponse: (res) => res.action === 'create_course_schedule'
      }
    ]
  },

  // STUDENT MANAGEMENT
  'student-management': {
    name: '🎒 Student Management',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Create new student Emily Brown born on 2005-06-15',
        context: { module: 'student-management', path: '/admin/students' },
        expectedAction: 'create_student',
        validateResponse: (res) => res.action === 'create_student'
      },
      {
        message: 'Create student group Section A for Computer Science with 40 seats',
        context: { module: 'student-management', path: '/admin/students' },
        expectedAction: 'create_student_group',
        validateResponse: (res) => res.action === 'create_student_group'
      },
      {
        message: 'Add guardian John Brown as father for student emily@school.com',
        context: { module: 'student-management', path: '/admin/students' },
        expectedAction: 'create_guardian',
        validateResponse: (res) => res.action === 'create_guardian'
      }
    ]
  },

  // INSTRUCTOR MANAGEMENT
  'instructor-management': {
    name: '👨‍🏫 Instructor Management',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Add Dr. Emily Wilson as Professor in Physics department',
        context: { module: 'instructor-management', path: '/admin/instructor' },
        expectedAction: 'create_instructor',
        validateResponse: (res) => res.action === 'create_instructor'
      },
      {
        message: 'Assign Mathematics course to Dr. Johnson for 2024-2025',
        context: { module: 'instructor-management', path: '/admin/instructor' },
        expectedAction: 'assign_course_to_instructor',
        validateResponse: (res) => res.action === 'assign_course_to_instructor'
      }
    ]
  },

  // ATTENDANCE
  attendance: {
    name: '✅ Attendance',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Mark John Doe present for Mathematics class today',
        context: { module: 'attendance', path: '/admin/student-attendance' },
        expectedAction: 'mark_attendance',
        validateResponse: (res) => res.action === 'mark_attendance'
      },
      {
        message: 'Submit leave application for 3 days due to medical reasons',
        context: { module: 'attendance', path: '/admin/student-attendance' },
        expectedAction: 'create_leave_application',
        validateResponse: (res) => res.action === 'create_leave_application'
      },
      {
        message: 'Mark all students in Section A present for today',
        context: { module: 'attendance', path: '/admin/student-attendance' },
        expectedAction: 'bulk_attendance',
        validateResponse: (res) => res.action === 'bulk_attendance'
      }
    ]
  },

  // ASSESSMENT
  assessment: {
    name: '📝 Assessment',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Create midterm exam for Mathematics worth 100 marks on March 15',
        context: { module: 'assessment', path: '/admin/assessment' },
        expectedAction: 'create_assessment',
        validateResponse: (res) => res.action === 'create_assessment'
      },
      {
        message: 'Submit grade 85 for John Doe in Physics exam',
        context: { module: 'assessment', path: '/admin/assessment' },
        expectedAction: 'submit_grades',
        validateResponse: (res) => res.action === 'submit_grades'
      },
      {
        message: 'Generate report card for Sarah Johnson for Semester 1',
        context: { module: 'assessment', path: '/admin/assessment' },
        expectedAction: 'generate_report_card',
        validateResponse: (res) => res.action === 'generate_report_card'
      }
    ]
  },

  // FEES MANAGEMENT
  fees: {
    name: '💰 Fees Management',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Create tuition fee structure of 50000 for Computer Science program',
        context: { module: 'fees', path: '/admin/fees' },
        expectedAction: 'create_fee_structure',
        validateResponse: (res) => res.action === 'create_fee_structure'
      },
      {
        message: 'Record payment of 25000 from John Doe via bank transfer',
        context: { module: 'fees', path: '/admin/fees' },
        expectedAction: 'record_payment',
        validateResponse: (res) => res.action === 'record_payment'
      },
      {
        message: 'Generate invoice for upcoming semester fees',
        context: { module: 'fees', path: '/admin/fees' },
        expectedAction: 'generate_invoice',
        validateResponse: (res) => res.action === 'generate_invoice'
      }
    ]
  },

  // ACADEMIC SETTINGS
  'academic-settings': {
    name: '⚙️ Academic Settings',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Create academic year 2024-2025 starting from June 1',
        context: { module: 'academic-settings', path: '/admin/academic-year' },
        expectedAction: 'create_academic_year',
        validateResponse: (res) => res.action === 'create_academic_year'
      },
      {
        message: 'Create Fall semester from August to December',
        context: { module: 'academic-settings', path: '/admin/academic-year' },
        expectedAction: 'create_academic_term',
        validateResponse: (res) => res.action === 'create_academic_term'
      },
      {
        message: 'Add new computer lab Room 405 with 40 seats',
        context: { module: 'academic-settings', path: '/admin/academic-year' },
        expectedAction: 'create_room',
        validateResponse: (res) => res.action === 'create_room'
      }
    ]
  },

  // DASHBOARD
  dashboard: {
    name: '📊 Dashboard',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Generate attendance report for last month',
        context: { module: 'dashboard', path: '/admin/dashboard' },
        expectedAction: 'generate_attendance_report',
        validateResponse: (res) => res.action === 'generate_attendance_report'
      },
      {
        message: 'Generate performance report for all students',
        context: { module: 'dashboard', path: '/admin/dashboard' },
        expectedAction: 'generate_performance_report',
        validateResponse: (res) => res.action === 'generate_performance_report'
      }
    ]
  },

  // KNOWLEDGE BASE
  'knowledge-base': {
    name: '📖 Knowledge Base',
    endpoint: '/api/ai/parse-intent',
    tests: [
      {
        message: 'Upload chemistry notes for grade 10',
        context: { module: 'knowledge-base', path: '/admin/knowledge-base' },
        expectedAction: 'upload_document',
        validateResponse: (res) => res.action === 'upload_document'
      }
    ]
  }
};

// Authentication helper
async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    return response.data.token || response.data.access_token;
  } catch (error) {
    console.error(colors.red('Authentication failed:'), error.message);
    return null;
  }
}

// Test AI intent parsing
async function testAIIntent(token, test, moduleKey) {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/ai/parse-intent`,
      {
        message: test.message,
        context: test.context
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      }
    );

    const passed = test.validateResponse ?
      test.validateResponse(response.data) :
      response.data.action === test.expectedAction;

    return {
      passed,
      response: response.data,
      responseTime: response.headers['x-response-time'] || 'N/A'
    };
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// Main test runner
async function runTests() {
  console.log(colors.bold.cyan('\n🚀 AI Agent Complete Portal Test Suite\n'));
  console.log(colors.gray(`Backend: ${BASE_URL}`));
  console.log(colors.gray(`Portal: ${PORTAL_URL}\n`));

  // Authenticate first
  console.log(colors.yellow('🔐 Authenticating...'));
  const token = await authenticate();

  if (!token) {
    console.log(colors.red('❌ Authentication failed. Cannot proceed with tests.'));
    return;
  }

  console.log(colors.green('✅ Authentication successful\n'));
  console.log(colors.gray('─'.repeat(70)));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    moduleResults: {}
  };

  // Test each module
  for (const [moduleKey, module] of Object.entries(MODULE_TESTS)) {
    console.log(colors.bold.yellow(`\n${module.name}`));
    console.log(colors.gray('─'.repeat(60)));

    const moduleStats = { passed: 0, failed: 0, tests: [] };

    for (const test of module.tests) {
      results.total++;

      // Run the test
      const testResult = await testAIIntent(token, test, moduleKey);

      if (testResult.passed) {
        console.log(colors.green('  ✅'), test.message.substring(0, 50) + '...');
        if (testResult.response) {
          console.log(colors.gray(`     → Action: ${testResult.response.action || 'none'}`));
          console.log(colors.gray(`     → Entities: ${JSON.stringify(testResult.response.entities || {})}`));
          console.log(colors.gray(`     → Confidence: ${testResult.response.confidence || 'N/A'}`));
        }
        results.passed++;
        moduleStats.passed++;
      } else {
        console.log(colors.red('  ❌'), test.message.substring(0, 50) + '...');
        console.log(colors.red(`     → Expected: ${test.expectedAction}`));
        if (testResult.response) {
          console.log(colors.red(`     → Got: ${testResult.response.action || 'none'}`));
        } else if (testResult.error) {
          console.log(colors.red(`     → Error: ${testResult.error}`));
        }
        results.failed++;
        moduleStats.failed++;
      }

      moduleStats.tests.push({
        message: test.message,
        passed: testResult.passed,
        result: testResult
      });
    }

    results.moduleResults[moduleKey] = moduleStats;
  }

  // Display summary
  console.log(colors.bold.cyan('\n\n📊 Test Summary'));
  console.log(colors.gray('─'.repeat(70)));
  console.log(colors.green(`  ✅ Passed: ${results.passed}`));
  console.log(colors.red(`  ❌ Failed: ${results.failed}`));
  console.log(colors.blue(`  📝 Total: ${results.total}`));
  console.log(colors.yellow(`  🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`));

  // Module-wise coverage
  console.log(colors.bold.cyan('\n📈 Module Coverage'));
  console.log(colors.gray('─'.repeat(70)));

  for (const [moduleKey, module] of Object.entries(MODULE_TESTS)) {
    const stats = results.moduleResults[moduleKey];
    const total = stats.passed + stats.failed;
    const percentage = total > 0 ? ((stats.passed / total) * 100).toFixed(0) : 0;
    const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
    console.log(`  ${module.name.padEnd(30)} ${bar} ${percentage}%`);
  }

  // AI Service Health Check
  console.log(colors.bold.cyan('\n🤖 AI Service Status'));
  console.log(colors.gray('─'.repeat(70)));

  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(colors.green(`  ✅ Server Status: ${healthResponse.data.status}`));
    console.log(colors.gray(`  📡 Uptime: ${Math.floor(healthResponse.data.uptime / 3600)} hours`));

    if (healthResponse.data.services) {
      console.log(colors.gray(`  🔧 Services: ${Object.keys(healthResponse.data.services).join(', ')}`));
    }
  } catch (error) {
    console.log(colors.red('  ❌ Could not verify server health'));
  }

  // Final recommendations
  console.log(colors.bold.cyan('\n💡 Analysis'));
  console.log(colors.gray('─'.repeat(70)));

  if (results.passed === results.total) {
    console.log(colors.green('  ✨ All AI Agent tests passed successfully!'));
    console.log(colors.green('  ✅ AI Agent is fully functional across all portal menus'));
    console.log(colors.green('  🚀 Ready for production use'));
  } else if (results.passed > results.total * 0.7) {
    console.log(colors.yellow('  ⚠️  Most AI Agent features are working'));
    console.log(colors.yellow('  📝 Some intent parsing needs refinement'));
    console.log(colors.yellow('  🔧 Review failed tests for specific modules'));
  } else {
    console.log(colors.red('  ❌ AI Agent needs attention'));
    console.log(colors.red('  🔍 Check IntentParserService configuration'));
    console.log(colors.red('  📋 Verify ActionRegistry definitions'));
  }

  console.log(colors.bold.green('\n✨ Test suite completed!\n'));

  return results;
}

// Execute tests
runTests()
  .then(results => {
    if (results && results.failed > 0) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(colors.red('Test suite error:'), error);
    process.exit(1);
  });