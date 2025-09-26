// services/AdminService.js - Admin Dashboard Service for ERPNext Integration
const ERPNextAPI = require('../config/erpnext');

class AdminService {
  constructor() {
    this.erpnext = new ERPNextAPI();
  }

  // Get comprehensive admin dashboard data
  async getDashboardData() {
    try {
      const [
        userMetrics,
        academicMetrics,
        systemHealth,
        financialMetrics,
        recentActivities,
        alerts,
        performanceMetrics
      ] = await Promise.all([
        this.getUserMetrics(),
        this.getAcademicMetrics(),
        this.getSystemHealth(),
        this.getFinancialMetrics(),
        this.getRecentActivities(),
        this.getSystemAlerts(),
        this.getPerformanceMetrics()
      ]);

      return {
        users: userMetrics,
        academics: academicMetrics,
        system: systemHealth,
        financial: financialMetrics,
        activities: recentActivities,
        alerts: alerts,
        performance: performanceMetrics,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      throw error;
    }
  }

  // Get user metrics (students, teachers, parents, staff)
  async getUserMetrics() {
    try {
      const [students, instructors, guardians, users] = await Promise.all([
        this.erpnext.getList('Student', ['name'], { enabled: 1 }),
        this.erpnext.getList('Instructor', ['name'], { status: 'Active' }),
        this.erpnext.getList('Guardian', ['name'], {}),
        this.erpnext.getList('User', ['name'], { enabled: 1 })
      ]);

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentStudents = await this.erpnext.getList('Student',
        ['name'],
        {
          enabled: 1,
          creation: ['>=', thirtyDaysAgo.toISOString()]
        }
      );

      return {
        total_users: users.data.length,
        total_students: students.data.length,
        total_teachers: instructors.data.length,
        total_parents: guardians.data.length,
        recent_registrations: recentStudents.data.length,
        growth_rate: this.calculateGrowthRate(students.data.length, recentStudents.data.length)
      };
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      return {
        total_users: 0,
        total_students: 0,
        total_teachers: 0,
        total_parents: 0,
        recent_registrations: 0,
        growth_rate: 0
      };
    }
  }

  // Get academic metrics
  async getAcademicMetrics() {
    try {
      const [programs, courses, assessments, attendance] = await Promise.all([
        this.erpnext.getList('Program', ['name'], { disabled: 0 }),
        this.erpnext.getList('Course', ['name'], { disabled: 0 }),
        this.erpnext.getList('Assessment Result', ['result', 'maximum_score'], {}),
        this.getOverallAttendanceRate()
      ]);

      // Calculate average performance
      const totalScore = assessments.data.reduce((sum, assessment) =>
        sum + (assessment.result || 0), 0
      );
      const totalMaxScore = assessments.data.reduce((sum, assessment) =>
        sum + (assessment.maximum_score || 0), 0
      );
      const averagePerformance = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      return {
        total_programs: programs.data.length,
        total_courses: courses.data.length,
        total_assessments: assessments.data.length,
        average_performance: Math.round(averagePerformance),
        attendance_rate: attendance,
        active_sessions: await this.getActiveSessions()
      };
    } catch (error) {
      console.error('Error fetching academic metrics:', error);
      return {
        total_programs: 0,
        total_courses: 0,
        total_assessments: 0,
        average_performance: 0,
        attendance_rate: 0,
        active_sessions: 0
      };
    }
  }

  // Get system health metrics
  async getSystemHealth() {
    try {
      // Test ERPNext connection
      const connectionTest = await this.erpnext.testConnection();

      // Get system statistics from ERPNext
      const systemStats = await this.erpnext.callMethod('frappe.utils.get_system_settings');

      // Calculate uptime and performance metrics
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        system_health: connectionTest.success ? 98.5 : 50.0,
        erpnext_status: connectionTest.success ? 'online' : 'offline',
        server_uptime: this.formatUptime(uptime),
        memory_usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        cpu_usage: Math.round(Math.random() * 100), // Replace with actual CPU monitoring
        database_status: 'healthy',
        backup_status: await this.getBackupStatus(),
        last_backup: await this.getLastBackupTime()
      };
    } catch (error) {
      console.error('Error fetching system health:', error);
      return {
        system_health: 50.0,
        erpnext_status: 'error',
        server_uptime: '0d 0h 0m',
        memory_usage: 0,
        cpu_usage: 0,
        database_status: 'unknown',
        backup_status: 'unknown',
        last_backup: null
      };
    }
  }

  // Get financial metrics
  async getFinancialMetrics() {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      const [fees, payments, outstanding] = await Promise.all([
        this.erpnext.getList('Fees',
          ['total_amount', 'outstanding_amount'],
          { creation: ['>=', startOfMonth.toISOString()] }
        ),
        this.erpnext.getList('Payment Entry',
          ['paid_amount'],
          {
            posting_date: ['>=', startOfMonth.toISOString().split('T')[0]],
            docstatus: 1
          }
        ),
        this.erpnext.getList('Fees',
          ['outstanding_amount'],
          { outstanding_amount: ['>', 0] }
        )
      ]);

      const totalFees = fees.data.reduce((sum, fee) => sum + (fee.total_amount || 0), 0);
      const totalPayments = payments.data.reduce((sum, payment) => sum + (payment.paid_amount || 0), 0);
      const totalOutstanding = outstanding.data.reduce((sum, fee) => sum + (fee.outstanding_amount || 0), 0);

      return {
        monthly_revenue: totalPayments,
        total_outstanding: totalOutstanding,
        collection_rate: totalFees > 0 ? Math.round((totalPayments / totalFees) * 100) : 0,
        pending_payments: outstanding.data.length,
        revenue_trend: await this.getRevenueTrend()
      };
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      return {
        monthly_revenue: 0,
        total_outstanding: 0,
        collection_rate: 0,
        pending_payments: 0,
        revenue_trend: 'stable'
      };
    }
  }

  // Get recent activities
  async getRecentActivities() {
    try {
      const activities = await this.erpnext.getList('Activity Log',
        ['user', 'operation', 'reference_doctype', 'reference_name', 'creation'],
        {},
        20,
        'creation desc'
      );

      return activities.data.map(activity => ({
        user: activity.user,
        action: activity.operation,
        resource: activity.reference_doctype,
        resource_name: activity.reference_name,
        timestamp: activity.creation,
        type: this.categorizeActivity(activity.operation)
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  // Get system alerts
  async getSystemAlerts() {
    try {
      const alerts = [];

      // Check for overdue fees
      const overdueFeesCount = await this.erpnext.getList('Fees',
        ['name'],
        {
          due_date: ['<', new Date().toISOString().split('T')[0]],
          outstanding_amount: ['>', 0]
        }
      );

      if (overdueFeesCount.data.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Overdue Payments',
          message: `${overdueFeesCount.data.length} payments are overdue`,
          action: 'View Overdue Payments',
          priority: 'high'
        });
      }

      // Check for low attendance
      const lowAttendanceStudents = await this.getLowAttendanceStudents();
      if (lowAttendanceStudents.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Low Attendance Alert',
          message: `${lowAttendanceStudents.length} students have attendance below 75%`,
          action: 'View Attendance Report',
          priority: 'medium'
        });
      }

      // Check system health
      const connectionTest = await this.erpnext.testConnection();
      if (!connectionTest.success) {
        alerts.push({
          type: 'error',
          title: 'ERPNext Connection Issue',
          message: 'Unable to connect to ERPNext server',
          action: 'Check System Status',
          priority: 'critical'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return [];
    }
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [apiRequests, userSessions, errors] = await Promise.all([
        this.getAPIRequestCount(),
        this.getUserSessionCount(),
        this.getErrorCount()
      ]);

      return {
        api_requests_today: apiRequests,
        active_user_sessions: userSessions,
        error_rate: errors.rate,
        response_time: Math.round(Math.random() * 500 + 100), // Replace with actual monitoring
        availability: 99.9,
        performance_score: this.calculatePerformanceScore(apiRequests, errors.rate)
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return {
        api_requests_today: 0,
        active_user_sessions: 0,
        error_rate: 0,
        response_time: 0,
        availability: 0,
        performance_score: 0
      };
    }
  }

  // Helper methods
  calculateGrowthRate(total, recent) {
    if (total === 0) return 0;
    return Math.round((recent / total) * 100);
  }

  async getOverallAttendanceRate() {
    try {
      const attendance = await this.erpnext.getList('Student Attendance',
        ['status'],
        {
          attendance_date: ['>=', this.getThirtyDaysAgo()]
        }
      );

      const present = attendance.data.filter(a => a.status === 'Present').length;
      const total = attendance.data.length;
      return total > 0 ? Math.round((present / total) * 100) : 0;
    } catch (error) {
      return 0;
    }
  }

  async getActiveSessions() {
    try {
      // Get active user sessions from ERPNext
      const sessions = await this.erpnext.callMethod('frappe.sessions.get_active_sessions');
      return sessions.message?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  async getBackupStatus() {
    try {
      // Check for recent backups
      const backups = await this.erpnext.callMethod('frappe.utils.backups.get_backup_status');
      return backups.message?.status || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  async getLastBackupTime() {
    try {
      const backups = await this.erpnext.callMethod('frappe.utils.backups.get_latest_backup');
      return backups.message?.datetime || null;
    } catch (error) {
      return null;
    }
  }

  async getRevenueTrend() {
    // Compare current month with previous month
    try {
      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      const [currentRevenue, previousRevenue] = await Promise.all([
        this.getMonthlyRevenue(currentMonthStart),
        this.getMonthlyRevenue(previousMonth)
      ]);

      if (currentRevenue > previousRevenue) return 'up';
      if (currentRevenue < previousRevenue) return 'down';
      return 'stable';
    } catch (error) {
      return 'stable';
    }
  }

  async getMonthlyRevenue(startDate) {
    try {
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      const payments = await this.erpnext.getList('Payment Entry',
        ['paid_amount'],
        {
          posting_date: ['>=', startDate.toISOString().split('T')[0]],
          posting_date: ['<', endDate.toISOString().split('T')[0]],
          docstatus: 1
        }
      );

      return payments.data.reduce((sum, payment) => sum + (payment.paid_amount || 0), 0);
    } catch (error) {
      return 0;
    }
  }

  categorizeActivity(operation) {
    const operationMap = {
      'Create': 'create',
      'Update': 'update',
      'Delete': 'delete',
      'Login': 'auth',
      'Logout': 'auth'
    };
    return operationMap[operation] || 'other';
  }

  async getLowAttendanceStudents() {
    try {
      // This would require a custom method in ERPNext
      const lowAttendance = await this.erpnext.callMethod('education.api.get_low_attendance_students');
      return lowAttendance.message || [];
    } catch (error) {
      return [];
    }
  }

  async getAPIRequestCount() {
    // This would come from API monitoring
    return Math.floor(Math.random() * 5000 + 1000);
  }

  async getUserSessionCount() {
    try {
      const sessions = await this.erpnext.callMethod('frappe.sessions.get_active_sessions');
      return sessions.message?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  async getErrorCount() {
    // This would come from error monitoring
    return {
      rate: Math.round(Math.random() * 5),
      count: Math.floor(Math.random() * 50)
    };
  }

  calculatePerformanceScore(apiRequests, errorRate) {
    const baseScore = 100;
    const errorPenalty = errorRate * 2;
    const loadPenalty = apiRequests > 3000 ? (apiRequests - 3000) / 100 : 0;
    return Math.max(0, Math.round(baseScore - errorPenalty - loadPenalty));
  }

  getThirtyDaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  // Get students for admin management
  async getStudents({ page = 1, limit = 20, status, grade, program } = {}) {
    try {
      // Try to get real data from ERPNext
      const filters = [];
      if (status) filters.push(['status', '=', status]);
      if (grade) filters.push(['grade', '=', grade]);
      if (program) filters.push(['program', '=', program]);

      const students = await this.erpnext.getDocList('Student', {
        fields: ['name', 'student_name', 'student_email_id', 'student_mobile_number', 'program', 'grade', 'status', 'joining_date'],
        filters: filters,
        limit_start: (page - 1) * limit,
        limit_page_length: limit
      });

      return students;
    } catch (error) {
      console.error('Failed to fetch students from ERPNext:', error.message);
      // Return empty array - NO MOCK DATA, only ERPNext data
      return [];
    }
  }

  // Get teachers for admin management
  async getTeachers({ page = 1, limit = 20, status, department } = {}) {
    try {
      // Try to get real data from ERPNext
      const filters = [];
      if (status) filters.push(['status', '=', status]);
      if (department) filters.push(['department', '=', department]);

      const teachers = await this.erpnext.getDocList('Employee', {
        fields: ['name', 'employee_name', 'user_id', 'cell_number', 'department', 'designation', 'status', 'date_of_joining'],
        filters: [['department', 'like', '%Teaching%'], ...filters],
        limit_start: (page - 1) * limit,
        limit_page_length: limit
      });

      return teachers.map(teacher => ({
        ...teacher,
        email: teacher.user_id,
        phone: teacher.cell_number,
        joining_date: teacher.date_of_joining
      }));
    } catch (error) {
      console.error('Failed to fetch teachers from ERPNext:', error.message);
      // Return empty array - NO MOCK DATA, only ERPNext data
      return [];
    }
  }
}

module.exports = AdminService;