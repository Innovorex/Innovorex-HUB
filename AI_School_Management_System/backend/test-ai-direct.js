// Direct test of AI Agent intent parsing
const IntentParserService = require('./services/IntentParserService');
const colors = require('colors/safe');

// Test cases for all modules
const TEST_CASES = {
  // USER MANAGEMENT
  'User Management': [
    {
      message: 'Add Sarah Johnson as a student in grade 10',
      context: { module: 'users', availableActions: [{ id: 'create_user', name: 'Create User', requiredFields: ['fullName', 'role'] }] },
      expected: 'create_user'
    },
    {
      message: 'Update email for john.doe@school.com to new@school.com',
      context: { module: 'users', availableActions: [{ id: 'update_user', name: 'Update User', requiredFields: ['userId'] }] },
      expected: 'update_user'
    },
    {
      message: 'Search for all teachers',
      context: { module: 'users', availableActions: [{ id: 'search_user', name: 'Search User', requiredFields: [] }] },
      expected: 'search_user'
    }
  ],

  // PROGRAM MANAGEMENT
  'Program Management': [
    {
      message: 'Create Computer Science program for 4 years',
      context: { module: 'programs', availableActions: [{ id: 'create_program', name: 'Create Program', requiredFields: ['program_name'] }] },
      expected: 'create_program'
    },
    {
      message: 'Enroll John Doe in Mathematics program for 2024-2025',
      context: { module: 'programs', availableActions: [{ id: 'enroll_in_program', name: 'Enroll', requiredFields: ['student', 'program'] }] },
      expected: 'enroll_in_program'
    }
  ],

  // COURSE MANAGEMENT
  'Course Management': [
    {
      message: 'Create Data Structures course with code CS201 for 4 credits',
      context: { module: 'courses', availableActions: [{ id: 'create_course', name: 'Create Course', requiredFields: ['course_name'] }] },
      expected: 'create_course'
    },
    {
      message: 'Assign Dr. Smith to teach Physics',
      context: { module: 'courses', availableActions: [{ id: 'assign_instructor', name: 'Assign Instructor', requiredFields: ['instructor', 'course'] }] },
      expected: 'assign_instructor'
    },
    {
      message: 'Create schedule for CS101 on Monday in Room 301',
      context: { module: 'courses', availableActions: [{ id: 'create_course_schedule', name: 'Create Schedule', requiredFields: ['course'] }] },
      expected: 'create_course_schedule'
    }
  ],

  // STUDENT MANAGEMENT
  'Student Management': [
    {
      message: 'Create new student Emily Brown born on 2005-06-15',
      context: { module: 'student-management', availableActions: [{ id: 'create_student', name: 'Create Student', requiredFields: ['first_name', 'last_name'] }] },
      expected: 'create_student'
    },
    {
      message: 'Create student group Section A for Computer Science with 40 seats',
      context: { module: 'student-management', availableActions: [{ id: 'create_student_group', name: 'Create Group', requiredFields: ['group_name'] }] },
      expected: 'create_student_group'
    },
    {
      message: 'Add guardian John Brown as father for student emily@school.com',
      context: { module: 'student-management', availableActions: [{ id: 'create_guardian', name: 'Add Guardian', requiredFields: ['guardian_name'] }] },
      expected: 'create_guardian'
    }
  ],

  // INSTRUCTOR MANAGEMENT
  'Instructor Management': [
    {
      message: 'Add Dr. Emily Wilson as Professor in Physics department',
      context: { module: 'instructor-management', availableActions: [{ id: 'create_instructor', name: 'Create Instructor', requiredFields: ['employee_name'] }] },
      expected: 'create_instructor'
    },
    {
      message: 'Assign Mathematics course to Dr. Johnson for 2024-2025',
      context: { module: 'instructor-management', availableActions: [{ id: 'assign_course_to_instructor', name: 'Assign Course', requiredFields: ['instructor', 'course'] }] },
      expected: 'assign_course_to_instructor'
    }
  ],

  // ATTENDANCE
  'Attendance': [
    {
      message: 'Mark John Doe present for Mathematics class today',
      context: { module: 'attendance', availableActions: [{ id: 'mark_attendance', name: 'Mark Attendance', requiredFields: ['student', 'status'] }] },
      expected: 'mark_attendance'
    },
    {
      message: 'Submit leave application for 3 days due to medical reasons',
      context: { module: 'attendance', availableActions: [{ id: 'create_leave_application', name: 'Leave Application', requiredFields: ['reason'] }] },
      expected: 'create_leave_application'
    },
    {
      message: 'Mark all students in Section A present for today',
      context: { module: 'attendance', availableActions: [{ id: 'bulk_attendance', name: 'Bulk Attendance', requiredFields: ['student_group'] }] },
      expected: 'bulk_attendance'
    }
  ],

  // ASSESSMENT
  'Assessment': [
    {
      message: 'Create midterm exam for Mathematics worth 100 marks',
      context: { module: 'assessment', availableActions: [{ id: 'create_assessment', name: 'Create Assessment', requiredFields: ['assessment_name'] }] },
      expected: 'create_assessment'
    },
    {
      message: 'Submit grade 85 for John Doe in Physics exam',
      context: { module: 'assessment', availableActions: [{ id: 'submit_grades', name: 'Submit Grades', requiredFields: ['student', 'marks_obtained'] }] },
      expected: 'submit_grades'
    },
    {
      message: 'Generate report card for Sarah Johnson for Semester 1',
      context: { module: 'assessment', availableActions: [{ id: 'generate_report_card', name: 'Generate Report', requiredFields: ['student'] }] },
      expected: 'generate_report_card'
    }
  ],

  // FEES MANAGEMENT
  'Fees Management': [
    {
      message: 'Create tuition fee structure of 50000 for Computer Science program',
      context: { module: 'fees', availableActions: [{ id: 'create_fee_structure', name: 'Create Fee Structure', requiredFields: ['amount'] }] },
      expected: 'create_fee_structure'
    },
    {
      message: 'Record payment of 25000 from John Doe via bank transfer',
      context: { module: 'fees', availableActions: [{ id: 'record_payment', name: 'Record Payment', requiredFields: ['student', 'amount'] }] },
      expected: 'record_payment'
    },
    {
      message: 'Generate invoice for upcoming semester fees',
      context: { module: 'fees', availableActions: [{ id: 'generate_invoice', name: 'Generate Invoice', requiredFields: [] }] },
      expected: 'generate_invoice'
    }
  ],

  // ACADEMIC SETTINGS
  'Academic Settings': [
    {
      message: 'Create academic year 2024-2025 starting from June 1',
      context: { module: 'academic-settings', availableActions: [{ id: 'create_academic_year', name: 'Create Academic Year', requiredFields: ['academic_year_name'] }] },
      expected: 'create_academic_year'
    },
    {
      message: 'Create Fall semester from August to December',
      context: { module: 'academic-settings', availableActions: [{ id: 'create_academic_term', name: 'Create Term', requiredFields: ['term_name'] }] },
      expected: 'create_academic_term'
    },
    {
      message: 'Add new computer lab Room 405 with 40 seats',
      context: { module: 'academic-settings', availableActions: [{ id: 'create_room', name: 'Create Room', requiredFields: ['room_name'] }] },
      expected: 'create_room'
    }
  ],

  // DASHBOARD
  'Dashboard': [
    {
      message: 'Generate attendance report for last month',
      context: { module: 'dashboard', availableActions: [{ id: 'generate_attendance_report', name: 'Attendance Report', requiredFields: [] }] },
      expected: 'generate_attendance_report'
    },
    {
      message: 'Generate performance report for all students',
      context: { module: 'dashboard', availableActions: [{ id: 'generate_performance_report', name: 'Performance Report', requiredFields: [] }] },
      expected: 'generate_performance_report'
    }
  ],

  // KNOWLEDGE BASE
  'Knowledge Base': [
    {
      message: 'Upload chemistry notes for grade 10',
      context: { module: 'knowledge-base', availableActions: [{ id: 'upload_document', name: 'Upload Document', requiredFields: ['title'] }] },
      expected: 'upload_document'
    }
  ]
};

async function runTests() {
  console.log(colors.bold.cyan('\n🚀 Direct AI Agent Intent Parsing Test\n'));
  console.log(colors.gray('Testing IntentParserService directly without HTTP...\n'));
  console.log(colors.gray('─'.repeat(70)));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    byModule: {}
  };

  // Test each module
  for (const [moduleName, tests] of Object.entries(TEST_CASES)) {
    console.log(colors.bold.yellow(`\n${moduleName}`));
    console.log(colors.gray('─'.repeat(60)));

    const moduleResults = { passed: 0, failed: 0 };

    for (const test of tests) {
      results.total++;

      try {
        // Test with local parsing first
        const localResult = IntentParserService.parseLocally(test.message, test.context);

        // Also test with full parsing (includes AI if needed)
        const fullResult = await IntentParserService.parseIntent(test.message, test.context);

        const result = fullResult || localResult;
        const passed = result && result.action === test.expected;

        if (passed) {
          console.log(colors.green('  ✅'), test.message.substring(0, 50) + '...');
          console.log(colors.gray(`     → Action: ${result.action}`));
          console.log(colors.gray(`     → Entities: ${JSON.stringify(result.entities)}`));
          console.log(colors.gray(`     → Confidence: ${result.confidence || 'N/A'}`));
          results.passed++;
          moduleResults.passed++;
        } else {
          console.log(colors.red('  ❌'), test.message.substring(0, 50) + '...');
          console.log(colors.red(`     → Expected: ${test.expected}`));
          console.log(colors.red(`     → Got: ${result ? result.action : 'none'}`));
          if (result && result.entities) {
            console.log(colors.yellow(`     → Entities found: ${JSON.stringify(result.entities)}`));
          }
          results.failed++;
          moduleResults.failed++;
        }
      } catch (error) {
        console.log(colors.red('  ❌'), test.message.substring(0, 50) + '...');
        console.log(colors.red(`     → Error: ${error.message}`));
        results.failed++;
        moduleResults.failed++;
      }
    }

    results.byModule[moduleName] = moduleResults;
  }

  // Summary
  console.log(colors.bold.cyan('\n\n📊 Test Summary'));
  console.log(colors.gray('─'.repeat(70)));
  console.log(colors.green(`  ✅ Passed: ${results.passed}`));
  console.log(colors.red(`  ❌ Failed: ${results.failed}`));
  console.log(colors.blue(`  📝 Total: ${results.total}`));
  console.log(colors.yellow(`  🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`));

  // Module Coverage
  console.log(colors.bold.cyan('\n📈 Module Coverage'));
  console.log(colors.gray('─'.repeat(70)));

  for (const [moduleName, moduleResults] of Object.entries(results.byModule)) {
    const total = moduleResults.passed + moduleResults.failed;
    const percentage = total > 0 ? ((moduleResults.passed / total) * 100).toFixed(0) : 0;
    const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
    console.log(`  ${moduleName.padEnd(25)} ${bar} ${percentage}%`);
  }

  // Analysis
  console.log(colors.bold.cyan('\n💡 Analysis'));
  console.log(colors.gray('─'.repeat(70)));

  if (results.passed === results.total) {
    console.log(colors.green('  ✨ Perfect! All intent parsing tests passed'));
    console.log(colors.green('  ✅ AI Agent is ready for all portal menus'));
  } else if (results.passed >= results.total * 0.8) {
    console.log(colors.green('  ✅ AI Agent is working well across most menus'));
    console.log(colors.yellow('  📝 Minor improvements needed for some modules'));
  } else if (results.passed >= results.total * 0.5) {
    console.log(colors.yellow('  ⚠️  AI Agent is partially working'));
    console.log(colors.yellow('  🔧 Review pattern matching for failed modules'));
  } else {
    console.log(colors.red('  ❌ AI Agent needs significant improvements'));
    console.log(colors.red('  🔍 Check IntentParserService patterns'));
  }

  // Working modules
  const workingModules = [];
  const brokenModules = [];

  for (const [moduleName, moduleResults] of Object.entries(results.byModule)) {
    const total = moduleResults.passed + moduleResults.failed;
    if (moduleResults.passed === total) {
      workingModules.push(moduleName);
    } else if (moduleResults.passed === 0) {
      brokenModules.push(moduleName);
    }
  }

  if (workingModules.length > 0) {
    console.log(colors.green('\n  ✅ Fully Working Modules:'));
    workingModules.forEach(m => console.log(colors.green(`     • ${m}`)));
  }

  if (brokenModules.length > 0) {
    console.log(colors.red('\n  ❌ Needs Attention:'));
    brokenModules.forEach(m => console.log(colors.red(`     • ${m}`)));
  }

  console.log(colors.bold.green('\n✨ Direct test completed!\n'));

  return results;
}

// Run the tests
runTests()
  .then(results => {
    if (results.failed > 0) {
      console.log(colors.yellow('Note: Some tests failed. This indicates the intent parsing patterns need adjustment.'));
    }
  })
  .catch(error => {
    console.error(colors.red('Test error:'), error);
    process.exit(1);
  });