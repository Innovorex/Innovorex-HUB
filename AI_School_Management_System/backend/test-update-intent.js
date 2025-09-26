// Test update user intent parsing
const IntentParserService = require('./services/IntentParserService');
const colors = require('colors/safe');

// Test cases for update operations
const UPDATE_TESTS = [
  {
    message: "Update Sai Charan to 9th STD",
    context: {
      module: 'users',
      availableActions: [
        {
          id: 'update_user',
          name: 'Update User',
          requiredFields: ['userId']
        }
      ]
    },
    expected: 'update_user'
  },
  {
    message: "Update Sarah Johnson to grade 10",
    context: {
      module: 'users',
      availableActions: [
        {
          id: 'update_user',
          name: 'Update User',
          requiredFields: ['userId']
        }
      ]
    },
    expected: 'update_user'
  },
  {
    message: "Change John Doe to 11th standard",
    context: {
      module: 'users',
      availableActions: [
        {
          id: 'update_user',
          name: 'Update User',
          requiredFields: ['userId']
        }
      ]
    },
    expected: 'update_user'
  },
  {
    message: "Modify email for john.doe@school.com to newemail@school.com",
    context: {
      module: 'users',
      availableActions: [
        {
          id: 'update_user',
          name: 'Update User',
          requiredFields: ['userId']
        }
      ]
    },
    expected: 'update_user'
  },
  {
    message: "Update student Raj Kumar to class 12",
    context: {
      module: 'users',
      availableActions: [
        {
          id: 'update_user',
          name: 'Update User',
          requiredFields: ['userId']
        }
      ]
    },
    expected: 'update_user'
  }
];

async function runTests() {
  console.log(colors.bold.cyan('\n🧪 Update User Intent Parsing Test\n'));
  console.log(colors.gray('Testing various update command formats...\n'));
  console.log(colors.gray('─'.repeat(70)));

  let passed = 0;
  let failed = 0;

  for (const test of UPDATE_TESTS) {
    console.log(colors.yellow(`\nTest: "${test.message}"`));

    try {
      // Test with local parsing
      const result = IntentParserService.parseLocally(test.message, test.context);

      if (result && result.action === test.expected) {
        console.log(colors.green('  ✅ PASSED'));
        console.log(colors.gray(`     Action: ${result.action}`));
        console.log(colors.gray(`     Entities:`));
        if (result.entities.userId) console.log(colors.gray(`       - userId: ${result.entities.userId}`));
        if (result.entities.fullName) console.log(colors.gray(`       - fullName: ${result.entities.fullName}`));
        if (result.entities.grade) console.log(colors.gray(`       - grade: ${result.entities.grade}`));
        console.log(colors.gray(`     Confidence: ${result.confidence}`));
        passed++;
      } else {
        console.log(colors.red('  ❌ FAILED'));
        console.log(colors.red(`     Expected: ${test.expected}`));
        console.log(colors.red(`     Got: ${result ? result.action : 'null'}`));
        if (result && result.entities) {
          console.log(colors.yellow(`     Entities found: ${JSON.stringify(result.entities)}`));
        }
        failed++;
      }
    } catch (error) {
      console.log(colors.red('  ❌ ERROR'));
      console.log(colors.red(`     ${error.message}`));
      failed++;
    }
  }

  // Summary
  console.log(colors.bold.cyan('\n\n📊 Test Summary'));
  console.log(colors.gray('─'.repeat(70)));
  console.log(colors.green(`  ✅ Passed: ${passed}`));
  console.log(colors.red(`  ❌ Failed: ${failed}`));
  console.log(colors.blue(`  📝 Total: ${UPDATE_TESTS.length}`));
  console.log(colors.yellow(`  🎯 Success Rate: ${((passed / UPDATE_TESTS.length) * 100).toFixed(1)}%`));

  if (passed === UPDATE_TESTS.length) {
    console.log(colors.green('\n  ✨ Perfect! All update patterns are working correctly'));
  } else if (passed > 0) {
    console.log(colors.yellow('\n  ⚠️  Some update patterns need improvement'));
  } else {
    console.log(colors.red('\n  ❌ Update pattern matching needs to be fixed'));
  }

  console.log(colors.bold.green('\n✨ Test completed!\n'));
}

// Run tests
runTests().catch(console.error);