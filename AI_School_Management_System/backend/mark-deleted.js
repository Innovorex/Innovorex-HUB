#!/usr/bin/env node

const axios = require('axios');
const ERPNEXT_URL = 'https://erpeducation.innovorex.co.in';
const API_KEY = 'ae19e5af7a92ea6';
const API_SECRET = '8effd081b656b7d';

async function markAsDeleted() {
  console.log('Marking test students as DELETED...\n');

  try {
    // Get all test students
    const response = await axios.get(
      `${ERPNEXT_URL}/api/resource/Student`,
      {
        params: {
          fields: JSON.stringify(['name', 'student_name', 'enabled', 'first_name']),
          limit_page_length: 1000
        },
        headers: {
          'Authorization': `token ${API_KEY}:${API_SECRET}`
        }
      }
    );

    const testStudents = (response.data.data || []).filter(s => {
      const name = (s.student_name || '').toLowerCase();
      const isTest = name.includes('test') || name.includes('api') || name.includes('delete');
      const isDisabled = s.enabled === 0;
      const notMarked = !name.includes('deleted');
      return isTest && isDisabled && notMarked;
    });

    console.log(`Found ${testStudents.length} test students to mark as deleted\n`);

    let successCount = 0;

    for (const student of testStudents) {
      console.log(`Marking ${student.name} - ${student.student_name}:`);

      try {
        // Rename to mark as deleted
        await axios.put(
          `${ERPNEXT_URL}/api/resource/Student/${student.name}`,
          {
            student_name: `[DELETED] ${student.student_name}`,
            first_name: 'DELETED',
            last_name: student.name.split('-').pop() // Keep the ID suffix
          },
          {
            headers: {
              'Authorization': `token ${API_KEY}:${API_SECRET}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('  ✅ Marked as DELETED');
        successCount++;
      } catch (e) {
        console.log('  ❌ Failed:', e.response?.status);
      }
    }

    console.log(`\n✅ Successfully marked ${successCount} students as DELETED`);
    console.log('These will now be hidden from the portal completely.');

    // Verify
    console.log('\nVerifying changes...');
    const verifyResponse = await axios.get(
      `${ERPNEXT_URL}/api/resource/Student`,
      {
        params: {
          fields: JSON.stringify(['name', 'student_name', 'enabled']),
          limit_page_length: 1000
        },
        headers: {
          'Authorization': `token ${API_KEY}:${API_SECRET}`
        }
      }
    );

    const marked = (verifyResponse.data.data || []).filter(s => {
      const name = (s.student_name || '');
      return name.includes('[DELETED]');
    });

    console.log(`\nTotal students marked as DELETED: ${marked.length}`);
    if (marked.length > 0) {
      console.log('Marked students:');
      marked.forEach(s => console.log(`  - ${s.name}: ${s.student_name}`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

markAsDeleted();