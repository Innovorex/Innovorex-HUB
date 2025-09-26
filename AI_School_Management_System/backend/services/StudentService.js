// services/StudentService.js - Student Data Service for ERPNext Integration
const ERPNextAPI = require('../config/erpnext');

class StudentService {
  constructor() {
    this.erpnext = new ERPNextAPI();
  }

  // Get student dashboard data from ERPNext
  async getDashboardData(studentId) {
    try {
      const [
        studentInfo,
        academicProgress,
        assignments,
        attendance,
        fees,
        examResults,
        activities,
        enrollments,
        courses
      ] = await Promise.all([
        this.getStudentInfo(studentId),
        this.getAcademicProgress(studentId),
        this.getAssignments(studentId),
        this.getAttendance(studentId),
        this.getFeesStatus(studentId),
        this.getExamResults(studentId),
        this.getActivities(studentId),
        this.getStudentEnrollments(studentId),
        this.getStudentCourses(studentId)
      ]);

      return {
        student: studentInfo,
        progress: academicProgress,
        assignments: assignments,
        attendance: attendance,
        fees: fees,
        exams: examResults,
        activities: activities,
        goals: await this.getGoals(studentId),
        collaboration: await this.getCollaborationMetrics(studentId),
        independence: await this.getIndependenceMetrics(studentId),
        enrollments: enrollments, // Program enrollments from ERPNext
        courses: courses, // Course enrollments from ERPNext
        assigned_classes: enrollments.map(e => e.program),
        assigned_subjects: courses.map(c => c.course_name || c.course),
        ai_chat_available: true
      };
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
      throw error;
    }
  }

  // Get basic student information
  async getStudentInfo(studentId) {
    try {
      const student = await this.erpnext.getDoc('Student', studentId);
      return {
        id: student.name,
        student_name: student.student_name,
        email: student.student_email_id,
        phone: student.student_mobile_number,
        class: student.program,
        batch: student.student_batch_name,
        guardian: student.guardian,
        enrollment_date: student.creation,
        status: student.enabled ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error('Error fetching student info:', error);
      throw error;
    }
  }

  // Get academic progress
  async getAcademicProgress(studentId) {
    try {
      // Get latest assessment results
      const assessments = await this.erpnext.getList('Assessment Result',
        ['subject', 'grade', 'maximum_score', 'result'],
        { student: studentId },
        50,
        'creation desc'
      );

      // Calculate GPA and subject performance
      let totalGrade = 0;
      let totalSubjects = 0;
      const subjectMap = new Map();

      assessments.data.forEach(assessment => {
        if (assessment.grade) {
          const gradePoint = this.convertGradeToPoint(assessment.grade);
          totalGrade += gradePoint;
          totalSubjects++;

          // Track subject performance
          if (!subjectMap.has(assessment.subject)) {
            subjectMap.set(assessment.subject, []);
          }
          subjectMap.get(assessment.subject).push({
            grade: assessment.grade,
            score: assessment.result,
            max_score: assessment.maximum_score
          });
        }
      });

      const overallGPA = totalSubjects > 0 ? (totalGrade / totalSubjects) : 0;

      // Format subjects data
      const subjects = Array.from(subjectMap.entries()).map(([subject, scores]) => {
        const latestScore = scores[0];
        const understanding = (latestScore.score / latestScore.max_score) * 100;
        return {
          name: subject,
          understanding: Math.round(understanding),
          trend: this.calculateTrend(scores),
          color: this.getSubjectColor(subject)
        };
      });

      return {
        overall_gpa: Math.round(overallGPA * 10) / 10,
        subjects: subjects
      };
    } catch (error) {
      console.error('Error fetching academic progress:', error);
      return {
        overall_gpa: 0,
        subjects: []
      };
    }
  }

  // Get assignments
  async getAssignments(studentId) {
    try {
      const tasks = await this.erpnext.getList('Task',
        ['name', 'subject', 'description', 'expected_start_date', 'expected_end_date', 'status'],
        {
          _assign: `["${studentId}"]`,
          status: ['!=', 'Completed']
        },
        20,
        'expected_end_date asc'
      );

      return tasks.data.map(task => ({
        id: task.name,
        title: task.subject,
        description: task.description,
        due_date: task.expected_end_date,
        status: task.status.toLowerCase(),
        subject: task.subject
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  }

  // Get attendance data
  async getAttendance(studentId) {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      const attendance = await this.erpnext.getList('Student Attendance',
        ['attendance_date', 'status'],
        {
          student: studentId,
          attendance_date: ['>=', startOfMonth.toISOString().split('T')[0]]
        },
        31,
        'attendance_date desc'
      );

      const present = attendance.data.filter(a => a.status === 'Present').length;
      const total = attendance.data.length;
      const rate = total > 0 ? (present / total) * 100 : 100;

      return {
        rate: Math.round(rate),
        present_days: present,
        total_days: total,
        recent: attendance.data.slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return {
        rate: 0,
        present_days: 0,
        total_days: 0,
        recent: []
      };
    }
  }

  // Get fees status
  async getFeesStatus(studentId) {
    try {
      const fees = await this.erpnext.getList('Fees',
        ['name', 'total_amount', 'outstanding_amount', 'due_date', 'status'],
        { student: studentId },
        10,
        'due_date desc'
      );

      const totalDue = fees.data.reduce((sum, fee) => sum + (fee.outstanding_amount || 0), 0);
      const overdue = fees.data.filter(fee =>
        new Date(fee.due_date) < new Date() && fee.outstanding_amount > 0
      ).length;

      return {
        total_outstanding: totalDue,
        overdue_count: overdue,
        recent_fees: fees.data.slice(0, 5)
      };
    } catch (error) {
      console.error('Error fetching fees status:', error);
      return {
        total_outstanding: 0,
        overdue_count: 0,
        recent_fees: []
      };
    }
  }

  // Get exam results
  async getExamResults(studentId) {
    try {
      const results = await this.erpnext.getList('Assessment Result',
        ['assessment_plan', 'subject', 'grade', 'result', 'maximum_score'],
        { student: studentId },
        10,
        'creation desc'
      );

      return results.data.map(result => ({
        exam: result.assessment_plan,
        subject: result.subject,
        grade: result.grade,
        score: result.result,
        max_score: result.maximum_score,
        percentage: Math.round((result.result / result.maximum_score) * 100)
      }));
    } catch (error) {
      console.error('Error fetching exam results:', error);
      return [];
    }
  }

  // Get activities and achievements
  async getActivities(studentId) {
    try {
      // Get from custom doctype or comments
      const activities = await this.erpnext.getList('Student Activity',
        ['activity_name', 'activity_type', 'date', 'description'],
        { student: studentId },
        20,
        'date desc'
      );

      return activities.data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  // Get student goals
  async getGoals(studentId) {
    try {
      const goals = await this.erpnext.getList('Student Goal',
        ['goal_title', 'description', 'target_date', 'progress', 'subject'],
        { student: studentId, status: ['!=', 'Completed'] },
        10
      );

      return goals.data.map(goal => ({
        id: goal.name,
        title: goal.goal_title,
        description: goal.description,
        progress: goal.progress || 0,
        target_date: goal.target_date,
        subject: goal.subject
      }));
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  // Get collaboration metrics
  async getCollaborationMetrics(studentId) {
    try {
      // This would come from custom tracking or learning management system
      return {
        study_group_hours: 12,
        classmates_helped: 5,
        questions_asked: 18,
        peer_teaching_hours: 3
      };
    } catch (error) {
      console.error('Error fetching collaboration metrics:', error);
      return {
        study_group_hours: 0,
        classmates_helped: 0,
        questions_asked: 0,
        peer_teaching_hours: 0
      };
    }
  }

  // Get independence metrics
  async getIndependenceMetrics(studentId) {
    try {
      // This would come from AI tutoring system integration
      return {
        problems_solved_alone: 45,
        ai_usage_appropriateness: 85,
        original_thinking_score: 'Excellent',
        ready_for_next_level: true
      };
    } catch (error) {
      console.error('Error fetching independence metrics:', error);
      return {
        problems_solved_alone: 0,
        ai_usage_appropriateness: 0,
        original_thinking_score: 'Needs Assessment',
        ready_for_next_level: false
      };
    }
  }

  // Helper methods
  convertGradeToPoint(grade) {
    const gradeMap = {
      'A+': 4.0, 'A': 3.7, 'A-': 3.3,
      'B+': 3.0, 'B': 2.7, 'B-': 2.3,
      'C+': 2.0, 'C': 1.7, 'C-': 1.3,
      'D+': 1.0, 'D': 0.7, 'F': 0.0
    };
    return gradeMap[grade] || 0;
  }

  calculateTrend(scores) {
    if (scores.length < 2) return 'stable';
    const latest = scores[0].score / scores[0].max_score;
    const previous = scores[1].score / scores[1].max_score;
    return latest > previous ? 'up' : latest < previous ? 'down' : 'stable';
  }

  getSubjectColor(subject) {
    const colorMap = {
      'Mathematics': 'blue',
      'Science': 'green',
      'English': 'purple',
      'History': 'orange',
      'Physics': 'red',
      'Chemistry': 'teal',
      'Biology': 'emerald'
    };
    return colorMap[subject] || 'gray';
  }

  // Get student courses with detailed information
  async getCourses(studentId) {
    try {
      // Get enrolled programs
      const enrollments = await this.erpnext.getList('Program Enrollment',
        ['name', 'program', 'student_name', 'enrollment_date', 'academic_year'],
        { student: studentId },
        10
      );

      const courses = [];
      for (const enrollment of enrollments.data) {
        // Get program details
        const program = await this.erpnext.getDoc('Program', enrollment.program);

        courses.push({
          id: enrollment.name,
          name: program.program_name,
          code: program.program_code || program.name,
          instructor: 'Faculty', // Can be enhanced with instructor mapping
          credits: program.total_credits || 3,
          progress: Math.floor(Math.random() * 40) + 60, // Mock progress for now
          grade: this.calculateGradeFromProgress(Math.floor(Math.random() * 40) + 60),
          status: 'active',
          schedule: 'Mon, Wed, Fri 10:00 AM',
          nextClass: this.getNextClassTime()
        });
      }

      return courses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  // Get detailed grades and performance
  async getGrades(studentId, semester = 'current') {
    try {
      // Get assessment results
      const assessments = await this.erpnext.getList('Assessment Result',
        ['name', 'assessment_plan', 'student', 'grade', 'score', 'maximum_score', 'creation'],
        { student: studentId },
        50,
        'creation desc'
      );

      const grades = [];
      const subjectSummary = {};

      for (const assessment of assessments.data) {
        try {
          // Get assessment plan details
          const plan = await this.erpnext.getDoc('Assessment Plan', assessment.assessment_plan);

          const grade = {
            id: assessment.name,
            exam: plan.assessment_name || 'Assessment',
            subject: plan.course || 'General',
            grade: assessment.grade || 'N/A',
            score: assessment.score || 0,
            max_score: assessment.maximum_score || 100,
            percentage: assessment.maximum_score ?
              Math.round((assessment.score / assessment.maximum_score) * 100) : 0,
            date: assessment.creation,
            semester: semester,
            type: this.getAssessmentType(plan.assessment_name)
          };

          grades.push(grade);

          // Build subject summary
          if (!subjectSummary[grade.subject]) {
            subjectSummary[grade.subject] = {
              subject: grade.subject,
              scores: [],
              credits: 3 // Default credits
            };
          }
          subjectSummary[grade.subject].scores.push(grade.percentage);
        } catch (err) {
          console.error('Error processing assessment:', err);
        }
      }

      // Calculate subject averages
      const subjects = Object.values(subjectSummary).map(subject => ({
        subject: subject.subject,
        average: subject.scores.length > 0 ?
          subject.scores.reduce((a, b) => a + b, 0) / subject.scores.length : 0,
        grade: this.calculateGradeFromPercentage(
          subject.scores.length > 0 ?
            subject.scores.reduce((a, b) => a + b, 0) / subject.scores.length : 0
        ),
        trend: Math.random() > 0.5 ? 'up' : 'stable',
        credits: subject.credits,
        total_assessments: subject.scores.length
      }));

      // Calculate overall GPA
      const totalPoints = subjects.reduce((sum, subject) =>
        sum + (this.gradeToPoints(subject.grade) * subject.credits), 0);
      const totalCredits = subjects.reduce((sum, subject) => sum + subject.credits, 0);
      const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

      return {
        grades,
        subjects,
        gpa,
        class_rank: Math.floor(Math.random() * 50) + 1,
        total_students: 120
      };
    } catch (error) {
      console.error('Error fetching grades:', error);
      return {
        grades: [],
        subjects: [],
        gpa: 0,
        class_rank: 0,
        total_students: 0
      };
    }
  }

  // Helper methods
  calculateGradeFromProgress(progress) {
    if (progress >= 90) return 'A+';
    if (progress >= 85) return 'A';
    if (progress >= 80) return 'A-';
    if (progress >= 75) return 'B+';
    if (progress >= 70) return 'B';
    if (progress >= 65) return 'B-';
    if (progress >= 60) return 'C+';
    if (progress >= 55) return 'C';
    return 'D';
  }

  calculateGradeFromPercentage(percentage) {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 65) return 'D';
    return 'F';
  }

  gradeToPoints(grade) {
    const gradePoints = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    return gradePoints[grade] || 0.0;
  }

  getAssessmentType(assessmentName) {
    const name = assessmentName.toLowerCase();
    if (name.includes('final')) return 'final';
    if (name.includes('midterm') || name.includes('mid-term')) return 'midterm';
    if (name.includes('quiz')) return 'quiz';
    if (name.includes('project')) return 'project';
    if (name.includes('assignment')) return 'assignment';
    return 'quiz';
  }

  getNextClassTime() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'];
    const randomDay = days[Math.floor(Math.random() * days.length)];
    const randomTime = times[Math.floor(Math.random() * times.length)];
    return `${randomDay} ${randomTime}`;
  }

  // Get student enrollments from ERPNext
  async getStudentEnrollments(studentId) {
    try {
      const enrollments = await this.erpnext.getDocList('Program Enrollment', {
        fields: ['name', 'program', 'academic_year', 'academic_term', 'enrollment_date', 'student_batch_name'],
        filters: [['student', '=', studentId]]
      });

      return enrollments || [];
    } catch (error) {
      console.error('Failed to fetch student enrollments:', error);
      return [];
    }
  }

  // Get student courses from ERPNext
  async getStudentCourses(studentId) {
    try {
      const courseEnrollments = await this.erpnext.getDocList('Course Enrollment', {
        fields: ['name', 'course', 'course_name', 'enrollment_date', 'grade'],
        filters: [['student', '=', studentId]]
      });

      return courseEnrollments || [];
    } catch (error) {
      console.error('Failed to fetch student courses:', error);
      return [];
    }
  }
}

module.exports = StudentService;