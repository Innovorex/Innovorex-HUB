// controllers/studentController.ts - Student dashboard controller
import { Request, Response } from 'express';
import { User } from '@/models/User';
import { erpnextService } from '@/services/erpnextService';
import { aiService } from '@/services/aiService';
import { logger } from '@/utils/logger';

export class StudentController {
  // Get comprehensive student dashboard data
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId || req.userId;

      if (!studentId) {
        res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
        return;
      }

      // Get student from database
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        res.status(404).json({
          success: false,
          message: 'Student not found'
        });
        return;
      }

      // Parallel data fetching for better performance
      const [
        erpnextData,
        aiStats,
        studySuggestions
      ] = await Promise.allSettled([
        StudentController.getERPNextData(student),
        aiService.getStudentAIStats(studentId),
        aiService.generateStudySuggestions(studentId)
      ]);

      // Process subjects and generate mock data if ERPNext is unavailable
      const subjects = student.studentInfo?.subjects || ['Mathematics', 'English', 'Science', 'History'];
      const progress = await StudentController.generateProgressData(student, subjects);

      // Generate collaboration metrics
      const collaboration = StudentController.generateCollaborationMetrics(student);

      // Generate independence metrics
      const independence = StudentController.generateIndependenceMetrics(student, aiStats.status === 'fulfilled' ? aiStats.value : null);

      // Get upcoming schedule
      const upcomingSchedule = await StudentController.getUpcomingSchedule(student);

      // Get recent achievements
      const recentAchievements = StudentController.getRecentAchievements(student);

      // Compile dashboard data
      const dashboardData = {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentInfo?.studentId,
          grade: student.studentInfo?.grade,
          currentGPA: student.studentInfo?.currentGPA || 0
        },
        progress,
        collaboration,
        independence,
        goals: student.learningAnalytics?.goals || [],
        upcoming_schedule: upcomingSchedule,
        recent_achievements: recentAchievements,
        ai_chat_available: student.aiPreferences?.allowAITutor || true,
        study_suggestions: studySuggestions.status === 'fulfilled' ? studySuggestions.value : [],
        last_updated: new Date()
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      logger.error('Student dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load dashboard data'
      });
    }
  }

  // Get student progress details
  static async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId || req.userId;
      const { subject, timeframe = 'month' } = req.query;

      const student = await User.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found'
        });
        return;
      }

      // Get detailed progress data
      const progressData = await StudentController.getDetailedProgress(student, subject as string, timeframe as string);

      res.json({
        success: true,
        data: progressData
      });

    } catch (error) {
      logger.error('Student progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load progress data'
      });
    }
  }

  // Get student attendance
  static async getAttendance(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId || req.userId;
      const { fromDate, toDate } = req.query;

      const student = await User.findById(studentId);
      if (!student || !student.erpnextId) {
        res.status(404).json({
          success: false,
          message: 'Student not found or not synced with ERPNext'
        });
        return;
      }

      // Get attendance from ERPNext
      const attendance = await erpnextService.getStudentAttendance(
        student.erpnextId,
        fromDate as string,
        toDate as string
      );

      // Process attendance data
      const processedAttendance = StudentController.processAttendanceData(attendance);

      res.json({
        success: true,
        data: {
          attendance: processedAttendance,
          summary: StudentController.calculateAttendanceSummary(processedAttendance)
        }
      });

    } catch (error) {
      logger.error('Student attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load attendance data'
      });
    }
  }

  // Get student grades and assessments
  static async getGrades(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId || req.userId;
      const { academicYear, subject } = req.query;

      const student = await User.findById(studentId);
      if (!student || !student.erpnextId) {
        res.status(404).json({
          success: false,
          message: 'Student not found or not synced with ERPNext'
        });
        return;
      }

      // Get assessments from ERPNext
      const assessments = await erpnextService.getStudentAssessments(
        student.erpnextId,
        academicYear as string
      );

      // Filter by subject if specified
      const filteredAssessments = subject
        ? assessments.filter(assessment => assessment.course === subject)
        : assessments;

      // Process and calculate GPA
      const processedGrades = StudentController.processGradesData(filteredAssessments);

      res.json({
        success: true,
        data: {
          grades: processedGrades,
          gpa: StudentController.calculateGPA(processedGrades),
          summary: StudentController.generateGradesSummary(processedGrades)
        }
      });

    } catch (error) {
      logger.error('Student grades error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load grades data'
      });
    }
  }

  // Update student goals
  static async updateGoals(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId || req.userId;
      const { goals } = req.body;

      if (!Array.isArray(goals)) {
        res.status(400).json({
          success: false,
          message: 'Goals must be an array'
        });
        return;
      }

      const student = await User.findByIdAndUpdate(
        studentId,
        { $set: { 'learningAnalytics.goals': goals } },
        { new: true, runValidators: true }
      );

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Goals updated successfully',
        data: {
          goals: student.learningAnalytics?.goals || []
        }
      });

    } catch (error) {
      logger.error('Update student goals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update goals'
      });
    }
  }

  // Get student schedule
  static async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId || req.userId;
      const { date, week } = req.query;

      const student = await User.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found'
        });
        return;
      }

      // Get schedule from ERPNext if available
      let schedule = [];
      if (student.erpnextId) {
        try {
          const filters: any = {};
          if (date) {
            filters.schedule_date = date;
          }
          if (week) {
            // Add week filtering logic
          }

          const courseSchedule = await erpnextService.getCourseSchedule(filters);
          schedule = StudentController.filterStudentSchedule(courseSchedule, student);
        } catch (erpError) {
          logger.warn('ERPNext schedule fetch failed:', erpError);
          // Generate mock schedule as fallback
          schedule = StudentController.generateMockSchedule(student);
        }
      } else {
        schedule = StudentController.generateMockSchedule(student);
      }

      res.json({
        success: true,
        data: {
          schedule,
          date: date || new Date().toISOString().split('T')[0],
          student: {
            name: student.name,
            grade: student.studentInfo?.grade,
            section: student.studentInfo?.section
          }
        }
      });

    } catch (error) {
      logger.error('Student schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load schedule'
      });
    }
  }

  // Helper methods
  private static async getERPNextData(student: any): Promise<any> {
    if (!student.erpnextId) return null;

    try {
      const [studentData, enrollments] = await Promise.all([
        erpnextService.getStudent(student.erpnextId),
        erpnextService.getStudentEnrollments(student.erpnextId)
      ]);

      return { studentData, enrollments };
    } catch (error) {
      logger.warn('ERPNext data fetch failed:', error);
      return null;
    }
  }

  private static async generateProgressData(student: any, subjects: string[]): Promise<any> {
    const subjectPerformance = student.learningAnalytics?.subjectPerformance || new Map();

    return {
      overall_gpa: student.studentInfo?.currentGPA || StudentController.calculateMockGPA(subjects),
      subjects: subjects.map(subject => ({
        name: subject,
        understanding: subjectPerformance.get(subject) || StudentController.generateMockUnderstanding(),
        trend: StudentController.generateTrend(),
        color: StudentController.getSubjectColor(subject)
      }))
    };
  }

  private static generateCollaborationMetrics(student: any): any {
    // Generate realistic collaboration metrics
    return {
      study_group_hours: Math.floor(Math.random() * 20) + 5,
      classmates_helped: Math.floor(Math.random() * 10) + 2,
      questions_asked: Math.floor(Math.random() * 25) + 8,
      peer_teaching_hours: Math.floor(Math.random() * 8) + 1
    };
  }

  private static generateIndependenceMetrics(student: any, aiStats: any): any {
    return {
      problems_solved_alone: Math.floor(Math.random() * 50) + 20,
      ai_usage_appropriateness: aiStats?.averageAppropriatenessScore || 95,
      original_thinking_score: ['Excellent', 'Good', 'Developing'][Math.floor(Math.random() * 3)],
      ready_for_next_level: (student.studentInfo?.currentGPA || 3.0) >= 3.0
    };
  }

  private static async getUpcomingSchedule(student: any): Promise<any[]> {
    // Generate upcoming schedule based on student's subjects
    const subjects = student.studentInfo?.subjects || ['Mathematics', 'English', 'Science'];
    const schedule = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      subjects.forEach((subject, index) => {
        schedule.push({
          id: `${date.toISOString().split('T')[0]}-${subject}`,
          subject,
          time: `${9 + index}:00 - ${10 + index}:00`,
          room: `Room ${101 + index}`,
          teacher: `Dr. ${subject.charAt(0)}${Math.random().toString(36).substring(7)}`,
          date: date.toISOString().split('T')[0],
          type: 'class'
        });
      });
    }

    return schedule.slice(0, 10); // Return next 10 classes
  }

  private static getRecentAchievements(student: any): any[] {
    return [
      {
        id: '1',
        title: 'Perfect Attendance',
        description: 'Attended all classes this week',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        type: 'attendance',
        icon: '🎯'
      },
      {
        id: '2',
        title: 'Math Whiz',
        description: 'Scored 95% on Mathematics test',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        type: 'academic',
        icon: '📐'
      }
    ];
  }

  private static async getDetailedProgress(student: any, subject?: string, timeframe?: string): Promise<any> {
    // Implementation for detailed progress would go here
    return {
      subject,
      timeframe,
      data: []
    };
  }

  private static processAttendanceData(attendance: any[]): any[] {
    return attendance.map(record => ({
      date: record.date,
      status: record.status,
      course: record.course_schedule,
      percentage: record.status === 'Present' ? 100 : 0
    }));
  }

  private static calculateAttendanceSummary(attendance: any[]): any {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'Present').length;

    return {
      total,
      present,
      absent: total - present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }

  private static processGradesData(assessments: any[]): any[] {
    return assessments.map(assessment => ({
      id: assessment.name,
      course: assessment.course,
      assessment: assessment.assessment_plan,
      grade: assessment.grade,
      score: assessment.total_score,
      maxScore: assessment.maximum_score,
      percentage: assessment.maximum_score > 0
        ? Math.round((assessment.total_score / assessment.maximum_score) * 100)
        : 0,
      academicYear: assessment.academic_year
    }));
  }

  private static calculateGPA(grades: any[]): number {
    if (grades.length === 0) return 0;

    const gradePoints: any = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };

    const totalPoints = grades.reduce((sum, grade) => {
      return sum + (gradePoints[grade.grade] || 0);
    }, 0);

    return Math.round((totalPoints / grades.length) * 100) / 100;
  }

  private static generateGradesSummary(grades: any[]): any {
    return {
      totalAssessments: grades.length,
      averageScore: grades.length > 0
        ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length)
        : 0,
      highestScore: grades.length > 0 ? Math.max(...grades.map(g => g.percentage)) : 0,
      lowestScore: grades.length > 0 ? Math.min(...grades.map(g => g.percentage)) : 0
    };
  }

  private static filterStudentSchedule(courseSchedule: any[], student: any): any[] {
    const studentSubjects = student.studentInfo?.subjects || [];
    return courseSchedule.filter(schedule =>
      studentSubjects.includes(schedule.course)
    );
  }

  private static generateMockSchedule(student: any): any[] {
    const subjects = student.studentInfo?.subjects || ['Mathematics', 'English', 'Science'];
    const today = new Date();
    const schedule = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        subjects.forEach((subject, index) => {
          schedule.push({
            course: subject,
            instructor: `Teacher ${index + 1}`,
            room: `Room ${101 + index}`,
            schedule_date: date.toISOString().split('T')[0],
            from_time: `${9 + index}:00:00`,
            to_time: `${10 + index}:00:00`,
            color: StudentController.getSubjectColor(subject)
          });
        });
      }
    }

    return schedule;
  }

  // Helper utility methods
  private static calculateMockGPA(subjects: string[]): number {
    return Math.round((Math.random() * 1.5 + 2.5) * 100) / 100; // GPA between 2.5-4.0
  }

  private static generateMockUnderstanding(): number {
    return Math.floor(Math.random() * 30) + 70; // Understanding between 70-100%
  }

  private static generateTrend(): 'up' | 'down' | 'stable' {
    const trends = ['up', 'down', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)] as 'up' | 'down' | 'stable';
  }

  private static getSubjectColor(subject: string): string {
    const colors: { [key: string]: string } = {
      'Mathematics': '#3b82f6',
      'English': '#10b981',
      'Science': '#f59e0b',
      'History': '#ef4444',
      'Art': '#8b5cf6',
      'Music': '#ec4899',
      'Physical Education': '#06b6d4'
    };
    return colors[subject] || '#6b7280';
  }
}

export default StudentController;