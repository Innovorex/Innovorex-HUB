// AI Agent Test Commands - Use these in order!

export const AI_TEST_COMMANDS = {
  // Step 1: CREATE Operations
  create: [
    "Add API Test Student as a student in grade 9",
    "Create Mathematics program for 3 years duration",
    "Create Algebra course with code MATH101 for 3 credits"
  ],

  // Step 2: UPDATE Operations (after creating)
  update: [
    "Update API Test Student to grade 10",
    "Change API Test Student email to newemail@school.com",
    "Update Mathematics program duration to 4 years"
  ],

  // Step 3: SEARCH Operations
  search: [
    "Search for all students",
    "Find students in grade 9",
    "List all programs"
  ],

  // Step 4: DELETE Operations (after creating)
  delete: [
    "Delete user API Test Student",
    "Remove program Mathematics",
    "Delete course MATH101"
  ]
};

// Helper function to guide users
export const getAITestGuide = () => {
  return `
AI AGENT TESTING GUIDE:
========================

1. First CREATE something:
   Say: "Add API Test Student as a student in grade 9"

2. Then UPDATE it:
   Say: "Update API Test Student to grade 10"

3. Finally DELETE it:
   Say: "Delete user API Test Student"

IMPORTANT: You cannot delete something that doesn't exist!
If you get a 404 error, it means the item wasn't found.
This is normal behavior - create it first, then delete it.
`;
};

// Function to check if user exists
export const checkUserExists = async (userName) => {
  try {
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(userName)}`);
    const data = await response.json();
    return data.users && data.users.length > 0;
  } catch (error) {
    console.error('Error checking user:', error);
    return false;
  }
};

// Function to create test data
export const createTestData = async () => {
  const testUser = {
    first_name: 'API',
    last_name: 'Test',
    email: 'api.test@school.com',
    role: 'student',
    grade: '9'
  };

  try {
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(testUser)
    });

    if (response.ok) {
      console.log('✅ Test user created successfully');
      return true;
    } else {
      console.log('❌ Failed to create test user:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error creating test user:', error);
    return false;
  }
};