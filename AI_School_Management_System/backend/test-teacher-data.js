// Test script to verify teacher endpoints are returning real data
const axios = require('axios');

const BASE_URL = 'http://localhost:7002';
const TEACHER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRlbW8tdGVhY2hlci0xIiwiZW1haWwiOiJ0ZWFjaGVyQGRlbW8uY29tIiwicm9sZSI6InRlYWNoZXIiLCJuYW1lIjoiRW5nbGlzaCBJbnN0cnVjdG9yIiwiaWF0IjoxNzM3NDczNDI2LCJleHAiOjE3MzgwNzgyMjZ9.1sEe2YiSxqJ_xMTBRrUUrZ5Nc4wbqBQ6K-znhMRJg5Y';

async function testTeacherEndpoints() {
  console.log('\n======================================');
  console.log('TESTING TEACHER ENDPOINTS FOR REAL DATA');
  console.log('======================================\n');
  
  const headers = {
    'Authorization': `Bearer ${TEACHER_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  // Test 1: Teacher Programs endpoint
  console.log('1. Testing /teacher/programs/EDU-INS-2025-00001');
  console.log('------------------------------------------------');
  try {
    const response = await axios.get(`${BASE_URL}/teacher/programs/EDU-INS-2025-00001`, { headers });
    const programs = response.data;
    
    console.log(`   ✓ Status: ${response.status}`);
    console.log(`   ✓ Programs found: ${programs.length}`);
    
    if (programs.length > 0) {
      programs.forEach(prog => {
        console.log(`\n   Program Details:`);
        console.log(`   - ID: ${prog.id}`);
        console.log(`   - Name: ${prog.name}`);
        console.log(`   - Department: ${prog.department || 'N/A'}`);
        console.log(`   - Courses: ${prog.courses ? prog.courses.join(', ') : 'N/A'}`);
        console.log(`   - Is this real data? ${prog.id.includes('EDU-') || prog.id.includes('CBSE') ? 'YES' : 'POSSIBLY MOCK'}`);
      });
    }
    
    // Check if it's the English program
    const hasEnglish = programs.some(p => 
      p.courses && p.courses.includes('English') || 
      p.name && p.name.includes('English')
    );
    console.log(`\n   ✓ Contains English course: ${hasEnglish ? 'YES ✓' : 'NO ✗'}`);
    
  } catch (error) {
    console.log(`   ✗ Error: ${error.response?.data?.error || error.message}`);
  }
  
  // Test 2: Teacher Courses endpoint
  console.log('\n\n2. Testing /teacher/courses/EDU-INS-2025-00001');
  console.log('------------------------------------------------');
  try {
    const response = await axios.get(`${BASE_URL}/teacher/courses/EDU-INS-2025-00001`, { headers });
    const courses = response.data;
    
    console.log(`   ✓ Status: ${response.status}`);
    console.log(`   ✓ Courses found: ${courses.length}`);
    
    if (courses.length > 0) {
      courses.forEach(course => {
        console.log(`\n   Course Details:`);
        console.log(`   - ID: ${course.id}`);
        console.log(`   - Name: ${course.name}`);
        console.log(`   - Code: ${course.code || 'N/A'}`);
        console.log(`   - Program: ${course.program || 'N/A'}`);
        console.log(`   - Department: ${course.department || 'N/A'}`);
        console.log(`   - Schedule: ${course.schedule || 'N/A'}`);
        console.log(`   - Is this real data? ${course.id.includes('EDU-') || course.name === 'English' ? 'YES' : 'POSSIBLY MOCK'}`);
      });
    }
    
    // Check if it's English course
    const hasEnglish = courses.some(c => 
      c.name === 'English' || c.code === 'ENG'
    );
    const hasMath = courses.some(c => 
      c.name === 'Mathematics' || c.code === 'MATH'
    );
    
    console.log(`\n   ✓ Contains English course: ${hasEnglish ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   ✓ Contains Mathematics course: ${hasMath ? 'YES (Should be NO!)' : 'NO ✓'}`);
    
  } catch (error) {
    console.log(`   ✗ Error: ${error.response?.data?.error || error.message}`);
  }
  
  // Test 3: Teacher Students endpoint
  console.log('\n\n3. Testing /teacher/students/EDU-INS-2025-00001');
  console.log('------------------------------------------------');
  try {
    const response = await axios.get(`${BASE_URL}/teacher/students/EDU-INS-2025-00001`, { headers });
    const students = response.data;
    
    console.log(`   ✓ Status: ${response.status}`);
    console.log(`   ✓ Students found: ${students.length}`);
    
    if (students.length > 0) {
      // Show first 3 students as sample
      const sampleStudents = students.slice(0, 3);
      sampleStudents.forEach(student => {
        console.log(`\n   Student Sample:`);
        console.log(`   - ID: ${student.name || student.id}`);
        console.log(`   - Name: ${student.title || student.student_name || 'N/A'}`);
        console.log(`   - Email: ${student.student_email_id || 'N/A'}`);
        console.log(`   - Is this real data? ${(student.name && student.name.includes('EDU-')) ? 'YES' : 'UNKNOWN'}`);
      });
      
      if (students.length > 3) {
        console.log(`\n   ... and ${students.length - 3} more students`);
      }
    }
    
  } catch (error) {
    console.log(`   ✗ Error: ${error.response?.data?.error || error.message}`);
  }
  
  // Summary
  console.log('\n\n======================================');
  console.log('SUMMARY');
  console.log('======================================');
  console.log('\nChecking if we have REAL data (not mock/fallback):');
  
  try {
    // Re-fetch to check
    const programs = (await axios.get(`${BASE_URL}/teacher/programs/EDU-INS-2025-00001`, { headers })).data;
    const courses = (await axios.get(`${BASE_URL}/teacher/courses/EDU-INS-2025-00001`, { headers })).data;
    const students = (await axios.get(`${BASE_URL}/teacher/students/EDU-INS-2025-00001`, { headers })).data;
    
    const hasRealPrograms = programs.some(p => p.id && (p.id.includes('EDU-') || p.id.includes('CBSE')));
    const hasEnglishCourse = courses.some(c => c.name === 'English');
    const hasNoMathCourse = !courses.some(c => c.name === 'Mathematics');
    const hasRealStudents = students.length > 0 && students[0].name && students[0].name.includes('EDU-');
    
    console.log(`\n1. Programs: ${hasRealPrograms ? '✓ Real data' : '✗ Mock/fallback data'}`);
    console.log(`2. Courses: ${hasEnglishCourse && hasNoMathCourse ? '✓ English course (correct)' : '✗ Still showing wrong course'}`);
    console.log(`3. Students: ${hasRealStudents ? '✓ Real student data' : '✗ Mock/fallback data'}`);
    
    if (hasEnglishCourse && hasNoMathCourse && hasRealStudents) {
      console.log('\n✅ SUCCESS: Teacher portal is now showing REAL DATA!');
      console.log('   - English course is displayed (not Mathematics)');
      console.log('   - Real student records from ERPNext');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some endpoints still showing fallback data');
      if (!hasEnglishCourse || !hasNoMathCourse) {
        console.log('   - Courses endpoint needs fixing (still showing Mathematics?)');
      }
      if (!hasRealPrograms) {
        console.log('   - Programs endpoint showing fallback data');
      }
    }
    
  } catch (error) {
    console.log('\n✗ Error during summary check');
  }
}

// Run the test
testTeacherEndpoints().catch(console.error);
