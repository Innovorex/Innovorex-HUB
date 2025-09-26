// pages/student/StudentRouter.tsx - Student Section Router with nested routes
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from '../dashboards/StudentDashboard';
import StudentCourses from './StudentCourses';
import StudentAssignments from './StudentAssignments';
import StudentGrades from './StudentGrades';

const StudentRouter: React.FC = () => {
  return (
    <Routes>
      <Route index element={<StudentDashboard />} />
      <Route path="dashboard" element={<StudentDashboard />} />
      <Route path="courses" element={<StudentCourses />} />
      <Route path="assignments" element={<StudentAssignments />} />
      <Route path="grades" element={<StudentGrades />} />

      {/* Redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
};

export default StudentRouter;