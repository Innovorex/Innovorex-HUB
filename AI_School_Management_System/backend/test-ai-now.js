// Quick test of AI Agent with the exact user command
const IntentParserService = require('./services/IntentParserService');
const colors = require('colors/safe');

async function testUserCommands() {
  console.log(colors.bold.cyan('\n🧪 Testing Exact User Commands\n'));
  console.log(colors.gray('─'.repeat(70)));

  // Test 1: Update Sai Charan to 9th STD
  const test1 = "Update Sai Charan to 9th STD";
  console.log(colors.yellow(`\nTest 1: "${test1}"`));

  const context1 = {
    module: 'users',
    availableActions: [
      {
        id: 'update_user',
        name: 'Update User',
        requiredFields: ['userId']
      },
      {
        id: 'create_user',
        name: 'Create User',
        requiredFields: ['fullName', 'role']
      },
      {
        id: 'delete_user',
        name: 'Delete User',
        requiredFields: ['userId']
      }
    ]
  };

  const result1 = IntentParserService.parseLocally(test1, context1);

  if (result1) {
    console.log(colors.green('✅ Intent Parsed Successfully'));
    console.log(colors.gray(`   Action: ${result1.action}`));
    console.log(colors.gray(`   Confidence: ${result1.confidence}`));
    console.log(colors.gray(`   Entities:`));
    Object.entries(result1.entities).forEach(([key, value]) => {
      console.log(colors.gray(`     - ${key}: ${value}`));
    });

    if (result1.confidence >= 0.5) {
      console.log(colors.green('   → AI would process this command'));
    } else {
      console.log(colors.red('   → AI would reject (low confidence)'));
    }
  } else {
    console.log(colors.red('❌ No intent match found'));
  }

  // Test 2: Delete users API Test
  const test2 = "Delete users API Test";
  console.log(colors.yellow(`\nTest 2: "${test2}"`));

  const result2 = IntentParserService.parseLocally(test2, context1);

  if (result2) {
    console.log(colors.green('✅ Intent Parsed Successfully'));
    console.log(colors.gray(`   Action: ${result2.action}`));
    console.log(colors.gray(`   Confidence: ${result2.confidence}`));
    console.log(colors.gray(`   Entities:`));
    Object.entries(result2.entities).forEach(([key, value]) => {
      console.log(colors.gray(`     - ${key}: ${value}`));
    });

    if (result2.confidence >= 0.5) {
      console.log(colors.green('   → AI would process this command'));
    } else {
      console.log(colors.red('   → AI would reject (low confidence)'));
    }
  } else {
    console.log(colors.red('❌ No intent match found'));
    console.log(colors.yellow('   → This is why AI says "I\'m not sure I understood"'));
  }

  // Test 3: Delete user John Doe
  const test3 = "Delete user John Doe";
  console.log(colors.yellow(`\nTest 3: "${test3}" (Proper delete format)`));

  const result3 = IntentParserService.parseLocally(test3, context1);

  if (result3) {
    console.log(colors.green('✅ Intent Parsed Successfully'));
    console.log(colors.gray(`   Action: ${result3.action}`));
    console.log(colors.gray(`   Confidence: ${result3.confidence}`));
    console.log(colors.gray(`   Entities:`));
    Object.entries(result3.entities).forEach(([key, value]) => {
      console.log(colors.gray(`     - ${key}: ${value}`));
    });
  } else {
    console.log(colors.red('❌ No intent match found'));
  }

  console.log(colors.bold.cyan('\n\n📊 Analysis'));
  console.log(colors.gray('─'.repeat(70)));

  console.log(colors.yellow('\nThe AI Agent responds "I\'m not sure I understood" when:'));
  console.log(colors.gray('1. No pattern matches the command'));
  console.log(colors.gray('2. Confidence is below 0.5 (50%)'));
  console.log(colors.gray('3. The command format is not recognized'));

  console.log(colors.green('\n✅ Solution:'));
  console.log(colors.gray('The update pattern is now fixed and deployed'));
  console.log(colors.gray('The AI should now understand: "Update Sai Charan to 9th STD"'));

  console.log(colors.yellow('\n⚠️  Note:'));
  console.log(colors.gray('"Delete users API Test" doesn\'t match delete patterns'));
  console.log(colors.gray('Use format like: "Delete user John Doe" or "Remove student Sarah"'));

  console.log(colors.bold.green('\n✨ Test completed!\n'));
}

testUserCommands().catch(console.error);