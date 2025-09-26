#!/usr/bin/env node

const axios = require('axios');

// Configuration
const ERPNEXT_URL = 'https://erpeducation.innovorex.co.in';
const API_KEY = process.env.ERPNEXT_API_KEY || 'ae19e5af7a92ea6';
const API_SECRET = process.env.ERPNEXT_API_SECRET || '8effd081b656b7d';

async function createTestStudent() {
  console.log('Creating test student in ERPNext...\n');

  const studentData = {
    doctype: 'Student',
    student_name: 'API Test',
    first_name: 'API',
    last_name: 'Test',
    student_email_id: 'api.test@school.com',
    joining_date: '2024-01-01',
    program: 'EDU-PRO-2024-00001', // You may need to adjust this
    gender: 'Male'
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

    console.log('✅ Student created successfully!');
    console.log('Student ID:', response.data.data.name);
    console.log('Student Name:', response.data.data.student_name);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️ Student already exists');

      // Try to get the existing student
      try {
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
        const apiTest = students.find(s =>
          s.student_name?.toLowerCase().includes('api test') ||
          s.student_email_id === 'api.test@school.com'
        );

        if (apiTest) {
          console.log('Found existing student:');
          console.log('ID:', apiTest.name);
          console.log('Name:', apiTest.student_name);
          console.log('\n🎯 Use this ID to delete:', apiTest.name);
          return apiTest;
        }
      } catch (searchError) {
        console.error('Error searching for student:', searchError.message);
      }
    } else {
      console.error('Error creating student:', error.response?.data || error.message);
    }
  }
}

// Run the script
createTestStudent().then(student => {
  if (student) {
    console.log('\n📝 To delete this student via API, use:');
    console.log(`DELETE /api/users/${student.name}`);
    console.log(`or`);
    console.log(`DELETE /api/users/API Test`);
  }
}).catch(console.error);