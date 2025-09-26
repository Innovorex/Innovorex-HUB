// syncService.ts - Service to sync Portal data to ERPNext

import { api } from './api';

export interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
  stats?: {
    created: number;
    updated: number;
    failed: number;
    skipped: number;
  };
}

class SyncService {
  private baseUrl = '/api/sync';

  // Sync user to ERPNext (called when user is created/updated)
  async syncUser(userData: any): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/user`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing user to ERPNext:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to sync user'
      };
    }
  }

  // Sync program to ERPNext
  async syncProgram(programData: any): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/program`, programData);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing program to ERPNext:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to sync program'
      };
    }
  }

  // Sync course to ERPNext
  async syncCourse(courseData: any): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/course`, courseData);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing course to ERPNext:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to sync course'
      };
    }
  }

  // Sync student to ERPNext
  async syncStudent(studentData: any): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/student`, studentData);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing student to ERPNext:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to sync student'
      };
    }
  }

  // Sync instructor to ERPNext
  async syncInstructor(instructorData: any): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/instructor`, instructorData);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing instructor to ERPNext:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to sync instructor'
      };
    }
  }

  // Sync attendance to ERPNext
  async syncAttendance(attendanceData: any): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/attendance`, attendanceData);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing attendance to ERPNext:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to sync attendance'
      };
    }
  }

  // Sync assessment to ERPNext
  async syncAssessment(assessmentData: any): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/assessment`, assessmentData);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing assessment to ERPNext:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to sync assessment'
      };
    }
  }

  // Sync fees to ERPNext
  async syncFees(feesData: any): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/fees`, feesData);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing fees to ERPNext:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to sync fees'
      };
    }
  }

  // Trigger full sync (admin only)
  async triggerFullSync(): Promise<SyncResult> {
    try {
      const response = await api.post(`${this.baseUrl}/full`);
      return response.data;
    } catch (error: any) {
      console.error('Error triggering full sync:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to trigger full sync'
      };
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/status`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }

  // Helper function to prepare user data for sync
  prepareUserForSync(user: any): any {
    return {
      id: user.id,
      firstName: user.firstName || user.first_name,
      middleName: user.middleName || user.middle_name,
      lastName: user.lastName || user.last_name,
      email: user.email,
      phone: user.phone || user.mobile || user.student_mobile_number,
      role: user.role,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth || user.date_of_birth,
      bloodGroup: user.bloodGroup || user.blood_group,
      address: user.address || user.address_line_1,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      isActive: user.isActive !== undefined ? user.isActive : true,
      employeeId: user.employeeId || user.employee_id || user.employee,
      department: user.department,
      erpnextId: user.erpnextId || user.name
    };
  }

  // Helper function to prepare student data for sync
  prepareStudentForSync(student: any): any {
    return {
      id: student.id,
      firstName: student.firstName || student.first_name,
      middleName: student.middleName || student.middle_name,
      lastName: student.lastName || student.last_name,
      email: student.email || student.student_email_id,
      phone: student.phone || student.student_mobile_number,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth || student.date_of_birth,
      bloodGroup: student.bloodGroup || student.blood_group,
      category: student.category || student.student_category,
      batch: student.batch || student.student_batch_name,
      program: student.program,
      isActive: student.enabled === 1 || student.isActive,
      erpnextId: student.erpnextId || student.name
    };
  }

  // Helper function to prepare instructor data for sync
  prepareInstructorForSync(instructor: any): any {
    return {
      id: instructor.id,
      name: instructor.instructor_name || `${instructor.firstName} ${instructor.lastName}`,
      gender: instructor.gender,
      employeeId: instructor.employee || instructor.employee_id,
      department: instructor.department,
      course: instructor.custom_course || instructor.course,
      isActive: instructor.status === 'Active' || instructor.isActive,
      erpnextId: instructor.erpnextId || instructor.name
    };
  }
}

export const syncService = new SyncService();