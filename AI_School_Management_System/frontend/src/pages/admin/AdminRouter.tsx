// pages/admin/AdminRouter.tsx - Unified Router for Admin and Teacher with role-based access
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from '../dashboards/AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminSystemHealth from './AdminSystemHealth';
import UserManagement from './UserManagement';
import Courses from './Courses';
import ProgramManagement from './ProgramManagement';
import StudentGroups from './StudentGroups';
import ProgramEnrollment from './ProgramEnrollment';
import ProgramEnrollmentTool from './ProgramEnrollmentTool';
import CourseEnrollment from './CourseEnrollment';
import CourseSchedule from './CourseSchedule';
import Topic from './Topic';
import CourseSchedulingTool from './CourseSchedulingTool';
import KnowledgeBase from './KnowledgeBase';
import AIChat from './AIChat';

// Academic Setup
import AcademicYear from './AcademicYear';
import AcademicTerm from './AcademicTerm';
import Room from './Room';
import Instructor from './Instructor';
import InstructorAttendance from './InstructorAttendance';
import InstructorPayroll from './InstructorPayroll';

// Student Management
import Student from './Student';
import StudentApplicant from './StudentApplicant';
import StudentAdmission from './StudentAdmission';
import StudentBatch from './StudentBatch';
import StudentCategory from './StudentCategory';
import Guardian from './Guardian';
import StudentLog from './StudentLog';

// Attendance
import StudentAttendance from './StudentAttendance';
import AttendanceTool from './AttendanceTool';
import LeaveApplication from './LeaveApplication';

// Assessment
import AssessmentPlan from './AssessmentPlan';
import AssessmentGroup from './AssessmentGroup';
import AssessmentResult from './AssessmentResult';
import AssessmentCriteria from './AssessmentCriteria';
import GradingScale from './GradingScale';

// Fees Management
import FeeCategory from './FeeCategory';
import FeeStructure from './FeeStructure';
import Fees from './Fees';
import FeeSchedule from './FeeSchedule';
import SalesInvoice from './SalesInvoice';
import PaymentEntry from './PaymentEntry';

const AdminRouter: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const basePath = isTeacher ? '/teacher' : '/admin';

  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      {!isTeacher && (
        <>
          <Route path="users" element={<UserManagement />} />
          <Route path="user-management" element={<UserManagement />} />
        </>
      )}

      {/* Course Management Routes */}
      <Route path="courses" element={<Courses readOnly={isTeacher} />} />
      <Route path="program-management" element={<ProgramManagement readOnly={isTeacher} />} />
      <Route path="student-groups" element={<StudentGroups readOnly={isTeacher} />} />
      {!isTeacher && (
        <>
          <Route path="program-enrollment" element={<ProgramEnrollment />} />
          <Route path="program-enrollment-tool" element={<ProgramEnrollmentTool />} />
          <Route path="course-enrollment" element={<CourseEnrollment />} />
          <Route path="course-scheduling-tool" element={<CourseSchedulingTool />} />
        </>
      )}
      <Route path="course-schedule" element={<CourseSchedule readOnly={isTeacher} />} />
      <Route path="topic" element={<Topic readOnly={isTeacher} />} />
      <Route path="knowledge-base/*" element={<KnowledgeBase />} />
      <Route path="ai-chat" element={<AIChat />} />

      {/* Academic Setup Routes */}
      <Route path="academic-year" element={<AcademicYear />} />
      <Route path="academic-term" element={<AcademicTerm />} />
      <Route path="room" element={<Room />} />
      {!isTeacher && (
        <>
          <Route path="instructor" element={<Instructor />} />
          <Route path="instructor-attendance" element={<InstructorAttendance />} />
          <Route path="instructor-payroll" element={<InstructorPayroll />} />
        </>
      )}

      {/* Student Management Routes */}
      <Route path="student" element={<Student readOnly={isTeacher} />} />
      {!isTeacher && (
        <>
          <Route path="student-applicant" element={<StudentApplicant />} />
          <Route path="student-admission" element={<StudentAdmission />} />
          <Route path="student-batch" element={<StudentBatch />} />
          <Route path="student-category" element={<StudentCategory />} />
          <Route path="guardian" element={<Guardian />} />
          <Route path="student-log" element={<StudentLog />} />
        </>
      )}

      {/* Attendance Routes */}
      <Route path="student-attendance" element={<StudentAttendance />} />
      <Route path="student-attendance-tool" element={<AttendanceTool />} />
      <Route path="student-leave-application" element={<LeaveApplication />} />

      {/* Assessment Routes */}
      <Route path="assessment-plan" element={<AssessmentPlan />} />
      <Route path="assessment-group" element={<AssessmentGroup />} />
      <Route path="assessment-result" element={<AssessmentResult />} />
      <Route path="assessment-criteria" element={<AssessmentCriteria />} />
      <Route path="grading-scale" element={<GradingScale />} />

      {/* Fees Management Routes - Admin Only */}
      {!isTeacher && (
        <>
          <Route path="fee-category" element={<FeeCategory />} />
          <Route path="fee-structure" element={<FeeStructure />} />
          <Route path="fees" element={<Fees />} />
          <Route path="fee-schedule" element={<FeeSchedule />} />
          <Route path="sales-invoice" element={<SalesInvoice />} />
          <Route path="payment-entry" element={<PaymentEntry />} />
        </>
      )}

      <Route path="system-health" element={<AdminSystemHealth />} />

      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to={basePath} replace />} />
    </Routes>
  );
};

export default AdminRouter;