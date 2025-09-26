#!/usr/bin/env node

// Test delete with direct ERPNext ID
const axios = require('axios');

async function testDelete() {
  const baseURL = 'https://server.innovorex.co.in';

  // Test with actual ERPNext IDs
  const testCases = [
    {
      input: 'API Test',
      expected: 'Should find EDU-STU-2025-00039 and delete'
    },
    {
      input: 'EDU-STU-2025-00039',
      expected: 'Direct ID - should work if exists'
    }
  ];

  for (const test of testCases) {
    console.log(`\n=== Testing: ${test.input} ===`);
    console.log(`Expected: ${test.expected}`);

    try {
      const response = await axios.delete(
        `${baseURL}/api/users/${encodeURIComponent(test.input)}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Success:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Failed:', error.response.status, error.response.data);
      } else {
        console.log('❌ Error:', error.message);
      }
    }
  }
}

console.log('Testing delete functionality with auth bypassed...\n');
testDelete();