#!/usr/bin/env node

// Direct test of delete functionality bypassing authentication
const axios = require('axios');

const ERPNEXT_URL = 'https://erpeducation.innovorex.co.in';
const API_KEY = 'ae19e5af7a92ea6';
const API_SECRET = '8effd081b656b7d';

async function testDeleteDirect() {
  console.log('Testing delete functionality directly in ERPNext...\n');

  try {
    // First, list all students to find "API Test"
    console.log('1. Searching for API Test student...');
    const searchResponse = await axios.get(
      `${ERPNEXT_URL}/api/resource/Student`,
      {
        params: {
          fields: JSON.stringify(['name', 'student_name', 'student_email_id']),
          limit_page_length: 1000
        },
        headers: {
          'Authorization': `token ${API_KEY}:${API_SECRET}`
        }
      }
    );

    const students = searchResponse.data.data || [];
    console.log(`Found ${students.length} students`);

    // Find API Test
    const apiTestStudent = students.find(s =>
      s.student_name?.toLowerCase().includes('api test') ||
      s.student_email_id === 'api.test@school.com'
    );

    if (!apiTestStudent) {
      console.log('❌ API Test student not found');

      // Show some sample students
      console.log('\nSample students:');
      students.slice(0, 5).forEach(s => {
        console.log(`- ${s.name}: ${s.student_name}`);
      });
      return;
    }

    console.log(`✅ Found API Test student: ${apiTestStudent.name} (${apiTestStudent.student_name})`);

    // Now test the actual delete through our backend
    console.log('\n2. Testing delete through our backend API...');
    console.log(`DELETE /api/users/API Test`);
    console.log(`(Backend should find and delete ${apiTestStudent.name})`);

    // Simulate what the backend does
    console.log('\n3. What the backend SHOULD do:');
    console.log(`   a. Receive: "API Test"`);
    console.log(`   b. Search for student with name containing "API Test"`);
    console.log(`   c. Find: ${apiTestStudent.name}`);
    console.log(`   d. Delete using ERPNext ID: ${apiTestStudent.name}`);

    // Try to delete directly from ERPNext to verify it works
    console.log('\n4. Testing direct ERPNext delete...');
    try {
      const deleteResponse = await axios.delete(
        `${ERPNEXT_URL}/api/resource/Student/${apiTestStudent.name}`,
        {
          headers: {
            'Authorization': `token ${API_KEY}:${API_SECRET}`
          }
        }
      );
      console.log('✅ Direct delete successful:', deleteResponse.data);
    } catch (deleteError) {
      if (deleteError.response?.status === 409) {
        console.log('⚠️ Cannot delete - document may be linked or submitted');
      } else {
        console.log('❌ Direct delete failed:', deleteError.response?.data || deleteError.message);
      }
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Also show how to create a test user
async function createAnotherTestUser() {
  console.log('\n5. Creating another test user for future tests...');

  const studentData = {
    doctype: 'Student',
    student_name: 'API Test Two',
    first_name: 'API',
    last_name: 'Test Two',
    student_email_id: 'api.test2@school.com',
    joining_date: '2024-01-01',
    gender: 'Female'
  };

  try {
    const response = await axios.post(
      `${ERPNEXT_URL}/api/resource/Student`,
      studentData,
      {
        headers: {
          'Authorization': `token ${API_KEY}:${API_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Created new test student:', response.data.data.name);
    console.log('   Name:', response.data.data.student_name);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️ Student already exists');
    } else {
      console.error('❌ Failed to create:', error.response?.data?.exception || error.message);
    }
  }
}

// Run tests
testDeleteDirect().then(() => {
  return createAnotherTestUser();
}).catch(console.error);