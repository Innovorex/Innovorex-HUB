#!/usr/bin/env node

const axios = require('axios');
const ERPNEXT_URL = 'https://erpeducation.innovorex.co.in';
const API_KEY = 'ae19e5af7a92ea6';
const API_SECRET = '8effd081b656b7d';

class StudentIDRecycler {
  constructor() {
    this.availableIDs = [];
  }

  async getDeletedStudentIDs() {
    try {
      const response = await axios.get(
        `${ERPNEXT_URL}/api/resource/Student`,
        {
          params: {
            fields: JSON.stringify(['name', 'student_name', 'first_name']),
            limit_page_length: 1000
          },
          headers: {
            'Authorization': `token ${API_KEY}:${API_SECRET}`
          }
        }
      );

      const deletedStudents = (response.data.data || []).filter(s =>
        s.first_name === 'DELETED' || s.student_name?.includes('DELETED')
      );

      this.availableIDs = deletedStudents.map(s => s.name);
      return this.availableIDs;
    } catch (error) {
      console.error('Error fetching deleted IDs:', error.message);
      return [];
    }
  }

  async recycleID(studentID, newStudentData) {
    try {
      console.log(`\nRecycling ID ${studentID} for new student ${newStudentData.student_name}`);

      // Update the existing "deleted" record with new student data
      const updateData = {
        student_name: newStudentData.student_name,
        first_name: newStudentData.first_name,
        last_name: newStudentData.last_name || '',
        student_email_id: newStudentData.email,
        enabled: 1,
        joining_date: newStudentData.joining_date || new Date().toISOString().split('T')[0],
        gender: newStudentData.gender || 'Other',
        blood_group: newStudentData.blood_group || '',
        date_of_birth: newStudentData.date_of_birth || null
      };

      const response = await axios.put(
        `${ERPNEXT_URL}/api/resource/Student/${studentID}`,
        updateData,
        {
          headers: {
            'Authorization': `token ${API_KEY}:${API_SECRET}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Successfully recycled ${studentID} for ${newStudentData.student_name}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to recycle ${studentID}:`, error.response?.data || error.message);
      return null;
    }
  }

  async demonstrateRecycling() {
    console.log('=== Student ID Recycling System ===\n');

    // Get available IDs from deleted students
    const availableIDs = await this.getDeletedStudentIDs();
    console.log(`Found ${availableIDs.length} deleted student IDs available for recycling:`);
    availableIDs.forEach(id => console.log(`  - ${id}`));

    if (availableIDs.length === 0) {
      console.log('\nNo deleted student IDs available for recycling.');
      return;
    }

    // Example: Recycle first available ID
    const idToRecycle = availableIDs[0];
    console.log(`\n📝 Example: Recycling ${idToRecycle} for a new student...`);

    const newStudent = {
      student_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@school.com',
      gender: 'Male',
      joining_date: '2024-01-15'
    };

    await this.recycleID(idToRecycle, newStudent);

    // Show remaining available IDs
    const remainingIDs = await this.getDeletedStudentIDs();
    console.log(`\nRemaining available IDs for recycling: ${remainingIDs.length}`);
  }
}

// Usage in the actual system
async function integrateWithCreateUser() {
  console.log('\n=== HOW TO INTEGRATE WITH USER CREATION ===\n');
  console.log('When creating a new student:');
  console.log('1. Check for available deleted IDs');
  console.log('2. If available, update the deleted record instead of creating new');
  console.log('3. If not available, create new with auto-increment ID\n');

  console.log('Benefits:');
  console.log('✅ No wasted ID numbers');
  console.log('✅ Sequential ID numbering maintained');
  console.log('✅ Database stays clean');
  console.log('✅ Works around the deletion constraint\n');
}

// Run demonstration
const recycler = new StudentIDRecycler();
recycler.demonstrateRecycling().then(() => {
  integrateWithCreateUser();
});