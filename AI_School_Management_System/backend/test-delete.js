const fetch = require('node-fetch');

async function testDelete() {
  const baseURL = 'https://server.innovorex.co.in';
  const token = process.env.AUTH_TOKEN || 'your-auth-token-here';

  // Test different variations of user name
  const testNames = [
    'API Test',
    'API%20Test',
    'api test',
    'Test API'
  ];

  for (const name of testNames) {
    console.log(`\n=== Testing delete for: ${name} ===`);

    try {
      const response = await fetch(`${baseURL}/api/users/${name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const text = await response.text();
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${text}`);

      if (response.status === 200) {
        console.log('✅ Delete successful!');
        break;
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

// Get auth token from environment or command line
if (process.argv[2]) {
  process.env.AUTH_TOKEN = process.argv[2];
}

console.log('Starting delete test...');
console.log('Make sure you have a valid auth token');
console.log('Usage: node test-delete.js <auth-token>');
console.log('');

testDelete();