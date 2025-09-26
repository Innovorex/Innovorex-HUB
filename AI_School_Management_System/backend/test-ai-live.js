// Test AI Agent functionality on live portal
const axios = require('axios');
const colors = require('colors/safe');

const BASE_URL = 'https://server.innovorex.co.in';
const API_ENDPOINT = '/api/ai/parse-intent';

// Test cases for different modules
const TEST_CASES = [
  {
    module: 'User Management',
    context: { module: 'users', availableActions: [] },
    message: 'Add Sarah Johnson as a student in grade 10',
  },
  {
    module: 'Program Management',
    context: { module: 'programs', availableActions: [] },
    message: 'Create Computer Science program for 4 years',
  },
  {
    module: 'Course Management',
    context: { module: 'courses', availableActions: [] },
    message: 'Create Data Structures course with code CS201 for 4 credits',
  },
  {
    module: 'Student Management',
    context: { module: 'student-management', availableActions: [] },
    message: 'Create new student Emily Brown born on 2005-06-15',
  },
  {
    module: 'Attendance',
    context: { module: 'attendance', availableActions: [] },
    message: 'Mark John Doe present for Mathematics class today',
  },
  {
    module: 'Assessment',
    context: { module: 'assessment', availableActions: [] },
    message: 'Create midterm exam for Mathematics worth 100 marks',
  },
  {
    module: 'Fees Management',
    context: { module: 'fees', availableActions: [] },
    message: 'Create tuition fee structure of 50000 for Computer Science program',
  }
];

async function testAIAgent() {
  console.log(colors.bold.cyan('\n🚀 Live AI Agent Test Suite\n'));
  console.log(colors.gray(`Testing against: ${BASE_URL}${API_ENDPOINT}\n`));
  console.log(colors.gray('─'.repeat(60)));

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    try {
      console.log(colors.bold.yellow(`\nTesting: ${testCase.module}`));
      console.log(colors.gray(`Message: "${testCase.message}"`));

      const startTime = Date.now();
      const response = await axios.post(
        `${BASE_URL}${API_ENDPOINT}`,
        {
          message: testCase.message,
          context: testCase.context
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      const responseTime = Date.now() - startTime;

      if (response.data && response.data.action) {
        console.log(colors.green('✅ Success'));
        console.log(colors.gray(`   Action: ${response.data.action}`));
        console.log(colors.gray(`   Entities: ${JSON.stringify(response.data.entities)}`));
        console.log(colors.gray(`   Confidence: ${response.data.confidence || 'N/A'}`));
        console.log(colors.gray(`   Response time: ${responseTime}ms`));
        passed++;
      } else {
        console.log(colors.yellow('⚠️  No action detected'));
        console.log(colors.gray(`   Response: ${JSON.stringify(response.data)}`));
        console.log(colors.gray(`   Response time: ${responseTime}ms`));
        failed++;
      }
    } catch (error) {
      console.log(colors.red('❌ Failed'));
      console.log(colors.red(`   Error: ${error.message}`));
      if (error.response) {
        console.log(colors.red(`   Status: ${error.response.status}`));
        console.log(colors.red(`   Data: ${JSON.stringify(error.response.data)}`));
      }
      failed++;
    }
  }

  // Summary
  console.log(colors.bold.cyan('\n\n📊 Test Summary'));
  console.log(colors.gray('─'.repeat(60)));
  console.log(colors.green(`  ✅ Successful: ${passed}`));
  console.log(colors.red(`  ❌ Failed: ${failed}`));
  console.log(colors.blue(`  📝 Total: ${TEST_CASES.length}`));
  console.log(colors.yellow(`  🎯 Success Rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`));

  // Check if AI service is using the correct model
  console.log(colors.bold.cyan('\n🤖 AI Model Check'));
  console.log(colors.gray('─'.repeat(60)));

  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    if (healthResponse.data.services && healthResponse.data.services.ai) {
      console.log(colors.green(`  ✅ AI Service: ${healthResponse.data.services.ai}`));
    }
    console.log(colors.gray(`  📡 Server Status: ${healthResponse.data.status}`));
    console.log(colors.gray(`  ⏱️  Uptime: ${Math.floor(healthResponse.data.uptime / 3600)} hours`));
  } catch (error) {
    console.log(colors.red('  ❌ Could not verify AI service status'));
  }

  console.log(colors.bold.green('\n✨ Live test completed!\n'));
}

// Run tests
testAIAgent().catch(console.error);