#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://server.innovorex.co.in';

// Simulate getting an auth token (you'll need a real one from login)
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@innovorex.ai',
      password: 'Admin@123',
      role: 'admin'
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return null;
  }
}

// Test delete operation
async function testDelete(token, userName) {
  console.log(`\n=== Testing DELETE for: ${userName} ===`);

  try {
    const response = await axios.delete(
      `${BASE_URL}/api/users/${encodeURIComponent(userName)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Delete successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Delete failed:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test create operation
async function testCreate(token) {
  console.log('\n=== Testing CREATE for: Test Student Two ===');

  const userData = {
    first_name: 'Test',
    last_name: 'Student Two',
    email: 'test.student2@school.com',
    role: 'student',
    grade: '9',
    password: 'Test@123'
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/api/users/create`,
      userData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Create successful!');
    console.log('Created user:', response.data.data?.student_name || response.data.data?.name);
    return response.data.data;
  } catch (error) {
    console.error('❌ Create failed:', error.response?.status, error.response?.data || error.message);
    return null;
  }
}

// Test update operation
async function testUpdate(token, userName, newGrade) {
  console.log(`\n=== Testing UPDATE for: ${userName} to grade ${newGrade} ===`);

  const updateData = {
    grade: newGrade
  };

  try {
    const response = await axios.put(
      `${BASE_URL}/api/users/${encodeURIComponent(userName)}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Update successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Update failed:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting AI Agent action tests...\n');

  // Login first
  console.log('1. Logging in as admin...');
  const token = await login();

  if (!token) {
    console.error('Failed to login. Cannot continue tests.');
    return;
  }

  console.log('✅ Login successful!\n');

  // Test 1: Create a new user
  console.log('2. Testing CREATE operation...');
  const newUser = await testCreate(token);

  // Test 2: Update the user we just created
  if (newUser) {
    console.log('\n3. Testing UPDATE operation...');
    await testUpdate(token, 'Test Student Two', '10');
  }

  // Test 3: Delete the "API Test" user
  console.log('\n4. Testing DELETE operation for existing user...');
  await testDelete(token, 'API Test');

  // Test 4: Try to delete the user we created
  if (newUser) {
    console.log('\n5. Testing DELETE operation for newly created user...');
    await testDelete(token, 'Test Student Two');
  }

  console.log('\n=== All tests completed ===');
}

// Run the tests
runTests().catch(console.error);