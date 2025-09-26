// ERPNext Education Module Standard Fields
// Based on actual ERPNext doctypes

export const ERPNEXT_FIELDS = {
  // Student Doctype Fields
  Student: {
    basic: ['first_name', 'middle_name', 'last_name', 'student_email_id', 'student_mobile_number'],
    personal: ['gender', 'date_of_birth', 'blood_group'],
    address: ['address_line_1', 'city', 'state', 'pincode'],
    academic: ['program', 'student_batch_name', 'student_category'],
    system: ['enabled', 'name'] // name is the ERPNext ID
  },

  // Instructor Doctype Fields
  Instructor: {
    basic: ['instructor_name'],
    professional: ['employee', 'department', 'gender'],
    system: ['status', 'name']
  },

  // Guardian Doctype Fields
  Guardian: {
    basic: ['guardian_name', 'email', 'mobile_number'],
    personal: ['date_of_birth'],
    professional: ['occupation', 'designation', 'work_address'],
    system: ['name']
  }
};

// Fields that should be removed from UI (not in ERPNext)
export const NON_ERPNEXT_FIELDS = [
  'alternate_mobile',
  'whatsapp_number',
  'nationality',
  'religion',
  'caste',
  'address_line_2',
  'country',
  'student_id',
  'admission_number',
  'academic_year',
  'academic_term',
  'joining_date',
  'relation_type',
  'annual_income',
  'linked_students',
  'erpnext_id' // We use 'name' field from ERPNext instead
];

// Map frontend field names to ERPNext field names
export const FIELD_MAPPINGS = {
  // Common mappings
  email: {
    student: 'student_email_id',
    guardian: 'email',
    instructor: 'email'
  },
  phone: {
    student: 'student_mobile_number',
    guardian: 'mobile_number',
    instructor: 'phone'
  },
  name: {
    student: 'first_name + last_name',
    guardian: 'guardian_name',
    instructor: 'instructor_name'
  },
  id: 'name', // ERPNext ID field
  status: {
    student: 'enabled',
    instructor: 'status'
  },
  address: 'address_line_1',
  batch: 'student_batch_name',
  class: 'program',
  employee_id: 'employee',
  category: 'student_category'
};