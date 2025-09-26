// components/layouts/AdminLayout.tsx - Persistent Admin Layout with Sidebar
import React, { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AIAgent from '../ai/AIAgent';
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  PowerIcon,
  UserCircleIcon,
  HomeIcon,
  XMarkIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  ServerIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  ChevronRightIcon,
  BookOpenIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ChatBubbleBottomCenterTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserPlusIcon,
  DocumentDuplicateIcon,
  CalculatorIcon,
  HomeModernIcon,
  CalendarIcon,
  DocumentIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isTeacher = user?.role === 'teacher';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [programManagementOpen, setProgramManagementOpen] = useState(false);
  const [courseManagementOpen, setCourseManagementOpen] = useState(false);
  const [studentManagementOpen, setStudentManagementOpen] = useState(false);
  const [instructorManagementOpen, setInstructorManagementOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(false);
  const [aiAgentOpen, setAiAgentOpen] = useState(false);

  // Auto-open dropdowns based on current path
  React.useEffect(() => {
    const isProgramManagementPath =
      location.pathname.includes('/programs') ||
      location.pathname.includes('/program-enrollment');

    const isCourseManagementPath =
      location.pathname.includes('/courses') ||
      location.pathname.includes('/course-enrollment');

    const isStudentManagementPath =
      (location.pathname.includes('/student') &&
       !location.pathname.includes('/student-attendance') &&
       !location.pathname.includes('/student-leave-application')) ||
      location.pathname.includes('/student-groups') ||
      location.pathname.includes('/student-applicant') ||
      location.pathname.includes('/student-admission') ||
      location.pathname.includes('/student-batch') ||
      location.pathname.includes('/student-category') ||
      location.pathname.includes('/guardian') ||
      location.pathname.includes('/student-log');

    const isInstructorManagementPath =
      location.pathname.includes('/instructor') ||
      location.pathname.includes('/instructor-attendance') ||
      location.pathname.includes('/instructor-payroll');

    const isAttendancePath =
      location.pathname.includes('/student-attendance') ||
      location.pathname.includes('/student-leave-application');

    const isAssessmentPath =
      location.pathname.includes('/assessment');

    const isAcademicPath =
      location.pathname.includes('/academic-year') ||
      location.pathname.includes('/academic-term') ||
      location.pathname.includes('/room');

    const isFeesManagementPath =
      location.pathname.includes('/fee-category') ||
      location.pathname.includes('/fee-structure') ||
      location.pathname.includes('/fees') ||
      location.pathname.includes('/fee-schedule') ||
      location.pathname.includes('/sales-invoice') ||
      location.pathname.includes('/payment-entry');

    setProgramManagementOpen(isProgramManagementPath);
    setCourseManagementOpen(isCourseManagementPath);
    setStudentManagementOpen(isStudentManagementPath);
    setInstructorManagementOpen(isInstructorManagementPath);
    setAttendanceOpen(isAttendancePath);
    setAssessmentOpen(isAssessmentPath);
    setAcademicOpen(isAcademicPath);
    setFeesOpen(isFeesManagementPath);
  }, [location.pathname]);

  // Close mobile sidebar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && !(event.target as Element)?.closest('.mobile-sidebar')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Get current page title from location
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'User Management';
    if (path.includes('/courses')) return 'Courses';
    if (path.includes('/program-management')) return 'Program';
    if (path.includes('/student-groups')) return 'Student Groups';
    if (path.includes('/program-enrollment')) return 'Program Enrollment';
    if (path.includes('/course-enrollment')) return 'Course Enrollment';
    if (path.includes('/sales-invoice')) return 'Sales Invoice';
    if (path.includes('/payment-entry')) return 'Payment Entry';
    if (path.includes('/fee-schedule')) return 'Fee Schedule';
    if (path.includes('/fee-structure')) return 'Fee Structure';
    if (path.includes('/fee-category')) return 'Fee Category';
    if (path.includes('/fees')) return 'Fees';
    if (path.includes('/knowledge-base')) return 'Knowledge Base';
    if (path.includes('/ai-chat')) return 'AI Assistant';
    if (path.includes('/system-health')) return 'System Health';
    return 'Dashboard';
  };

  const isActivePath = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-800 to-blue-900 text-white overflow-y-auto">
          {/* Logo Section */}
          <div className="flex items-center justify-center h-20 px-2 py-2 border-b border-blue-700">
            <img
              src="/logo.jpg"
              alt=""
              className="w-48 h-48 object-contain"
            />
          </div>

          {/* Navigation Menu */}
          <nav className="mt-6 px-3 flex-1">
            <div className="space-y-1">
              <Link
                to={isTeacher ? "/teacher/dashboard" : "/admin/dashboard"}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActivePath(isTeacher ? '/teacher/dashboard' : '/admin/dashboard') ||
                  location.pathname === (isTeacher ? '/teacher' : '/admin')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <ChartBarIcon className="h-5 w-5 mr-3" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>

              {!isTeacher && (
                <Link
                  to="/admin/users"
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActivePath('/admin/users')
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <UsersIcon className="h-5 w-5 mr-3" />
                  <span className="text-sm">User Management</span>
                </Link>
              )}

              {/* Program Management Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setProgramManagementOpen(!programManagementOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-3" />
                    <span className="text-sm">Program Management</span>
                  </div>
                  {programManagementOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {programManagementOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1"
                  >
                    <Link
                      to={isTeacher ? "/teacher/program-management" : "/admin/program-management"}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(isTeacher ? '/teacher/program-management' : '/admin/program-management')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <AcademicCapIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">{isTeacher ? 'My Programs' : 'Program'}</span>
                    </Link>

                    {!isTeacher && (
                      <>
                        <Link
                          to="/admin/program-enrollment"
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActivePath('/admin/program-enrollment')
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                          }`}
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">Program Enrollment</span>
                        </Link>

                        <Link
                          to="/admin/program-enrollment-tool"
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActivePath('/admin/program-enrollment-tool')
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                          }`}
                        >
                          <WrenchScrewdriverIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">Program Enrollment Tool</span>
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Course Management Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setCourseManagementOpen(!courseManagementOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <BuildingLibraryIcon className="h-5 w-5 mr-3" />
                    <span className="text-sm">Course Management</span>
                  </div>
                  {courseManagementOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {courseManagementOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1"
                  >
                    <Link
                      to={isTeacher ? "/teacher/courses" : "/admin/courses"}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(isTeacher ? '/teacher/courses' : '/admin/courses')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <BookOpenIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">{isTeacher ? 'My Courses' : 'Courses'}</span>
                    </Link>

                    {!isTeacher && (
                      <Link
                        to="/admin/course-enrollment"
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                          isActivePath('/admin/course-enrollment')
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                        }`}
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-3" />
                        <span className="text-sm">Course Enrollment</span>
                      </Link>
                    )}

                    <Link
                      to={isTeacher ? "/teacher/course-schedule" : "/admin/course-schedule"}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(isTeacher ? '/teacher/course-schedule' : '/admin/course-schedule')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <CalendarIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Course Schedule</span>
                    </Link>

                    <Link
                      to={isTeacher ? "/teacher/topic" : "/admin/topic"}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(isTeacher ? '/teacher/topic' : '/admin/topic')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <DocumentIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Topic</span>
                    </Link>

                    {!isTeacher && (
                      <Link
                        to="/admin/course-scheduling-tool"
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                          isActivePath('/admin/course-scheduling-tool')
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                        }`}
                      >
                        <WrenchScrewdriverIcon className="h-4 w-4 mr-3" />
                        <span className="text-sm">Course Scheduling Tool</span>
                      </Link>
                    )}
                  </motion.div>
                )}
              </div>


              {/* Academic Setup Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setAcademicOpen(!academicOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-3" />
                    <span className="text-sm">Academic Setup</span>
                  </div>
                  {academicOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {academicOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1"
                  >
                    <Link
                      to="/admin/academic-year"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/academic-year')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <CalendarDaysIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Academic Year</span>
                    </Link>
                    <Link
                      to="/admin/academic-term"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/academic-term')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <ClockIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Academic Term</span>
                    </Link>
                    <Link
                      to="/admin/room"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/room')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <HomeModernIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Rooms</span>
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Student Management Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setStudentManagementOpen(!studentManagementOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-3" />
                    <span className="text-sm">Student Management</span>
                  </div>
                  {studentManagementOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {studentManagementOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1"
                  >
                    <Link
                      to={isTeacher ? "/teacher/student" : "/admin/student"}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(isTeacher ? '/teacher/student' : '/admin/student')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <UsersIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">{isTeacher ? 'My Students' : 'Students'}</span>
                    </Link>
                    <Link
                      to={isTeacher ? "/teacher/student-groups" : "/admin/student-groups"}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(isTeacher ? '/teacher/student-groups' : '/admin/student-groups')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <UserGroupIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Student Groups</span>
                    </Link>
                    {!isTeacher && (
                      <>
                        <Link
                          to="/admin/student-applicant"
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActivePath('/admin/student-applicant')
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                          }`}
                        >
                          <UserPlusIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">Student Applicant</span>
                        </Link>
                        <Link
                          to="/admin/student-admission"
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActivePath('/admin/student-admission')
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                          }`}
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">Student Admission</span>
                        </Link>
                        <Link
                          to="/admin/student-batch"
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActivePath('/admin/student-batch')
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                          }`}
                        >
                          <UserGroupIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">Student Batch</span>
                        </Link>
                        <Link
                          to="/admin/student-category"
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActivePath('/admin/student-category')
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                          }`}
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">Student Category</span>
                        </Link>
                        <Link
                          to="/admin/guardian"
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActivePath('/admin/guardian')
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                          }`}
                        >
                          <UsersIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">Guardian</span>
                        </Link>
                        <Link
                          to="/admin/student-log"
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            isActivePath('/admin/student-log')
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                          }`}
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-3" />
                          <span className="text-sm">Student Log</span>
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Instructor Management Section - Admin Only */}
              {!isTeacher && (
                <div className="space-y-1">
                  <button
                    onClick={() => setInstructorManagementOpen(!instructorManagementOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
                  >
                    <div className="flex items-center">
                      <UsersIcon className="h-5 w-5 mr-3" />
                      <span className="text-sm">Instructor Management</span>
                    </div>
                    {instructorManagementOpen ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>

                  {instructorManagementOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 space-y-1"
                    >
                      <Link
                        to="/admin/instructor"
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                          isActivePath('/admin/instructor') && !isActivePath('/admin/instructor-attendance')
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                        }`}
                      >
                        <UsersIcon className="h-4 w-4 mr-3" />
                        <span className="text-sm">Instructors</span>
                      </Link>
                      <Link
                        to="/admin/instructor-attendance"
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                          isActivePath('/admin/instructor-attendance')
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                        }`}
                      >
                        <ClipboardDocumentCheckIcon className="h-4 w-4 mr-3" />
                        <span className="text-sm">Instructor Attendance</span>
                      </Link>
                      <Link
                        to="/admin/instructor-payroll"
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                          isActivePath('/admin/instructor-payroll')
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                        }`}
                      >
                        <BanknotesIcon className="h-4 w-4 mr-3" />
                        <span className="text-sm">Instructor Payroll</span>
                      </Link>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Attendance Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setAttendanceOpen(!attendanceOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 mr-3" />
                    <span className="text-sm">Attendance</span>
                  </div>
                  {attendanceOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {attendanceOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1"
                  >
                    <Link
                      to="/admin/student-attendance"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/student-attendance')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Student Attendance</span>
                    </Link>
                    <Link
                      to="/admin/student-attendance-tool"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/student-attendance-tool')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Attendance Tool</span>
                    </Link>
                    <Link
                      to="/admin/student-leave-application"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/student-leave-application')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Leave Applications</span>
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Assessment Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setAssessmentOpen(!assessmentOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <CalculatorIcon className="h-5 w-5 mr-3" />
                    <span className="text-sm">Assessment</span>
                  </div>
                  {assessmentOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {assessmentOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1"
                  >
                    <Link
                      to="/admin/assessment-plan"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/assessment-plan')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Assessment Plan</span>
                    </Link>
                    <Link
                      to="/admin/assessment-group"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/assessment-group')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <UserGroupIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Assessment Group</span>
                    </Link>
                    <Link
                      to="/admin/assessment-result"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/assessment-result')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Assessment Result</span>
                    </Link>
                    <Link
                      to="/admin/assessment-criteria"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/assessment-criteria')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Assessment Criteria</span>
                    </Link>
                    <Link
                      to="/admin/grading-scale"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/grading-scale')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <CalculatorIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Grading Scale</span>
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Fees Management Section - Admin Only */}
              {!isTeacher && (
                <div className="space-y-1">
                  <button
                    onClick={() => setFeesOpen(!feesOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
                  >
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                      <span className="text-sm">Fees Management</span>
                    </div>
                    {feesOpen ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>

                {feesOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1"
                  >
                    <Link
                      to="/admin/fee-category"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/fee-category')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Fee Category</span>
                    </Link>
                    <Link
                      to="/admin/fee-structure"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/fee-structure')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <BuildingOfficeIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Fee Structure</span>
                    </Link>
                    <Link
                      to="/admin/fees"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/fees')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <CurrencyDollarIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Fees</span>
                    </Link>
                    <Link
                      to="/admin/fee-schedule"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/fee-schedule')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <CalendarDaysIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Fee Schedule</span>
                    </Link>
                    <Link
                      to="/admin/sales-invoice"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/sales-invoice')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Sales Invoice</span>
                    </Link>
                    <Link
                      to="/admin/payment-entry"
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin/payment-entry')
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-300 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <BanknotesIcon className="h-4 w-4 mr-3" />
                      <span className="text-sm">Payment Entry</span>
                    </Link>
                  </motion.div>
                  )}
                </div>
              )}

              {/* Knowledge Base - Available to All */}
              <Link
                to={isTeacher ? "/teacher/knowledge-base" : "/admin/knowledge-base"}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActivePath('/admin/knowledge-base')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <BeakerIcon className="h-5 w-5 mr-3" />
                <span className="text-sm font-medium">Knowledge Base</span>
              </Link>

              <Link
                to="/admin/system-health"
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActivePath('/admin/system-health')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <ServerIcon className="h-5 w-5 mr-3" />
                <span className="text-sm">System Health</span>
              </Link>

              <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
                <ShieldCheckIcon className="h-5 w-5 mr-3" />
                <span className="text-sm">Security Center</span>
              </a>

              <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
                <DocumentTextIcon className="h-5 w-5 mr-3" />
                <span className="text-sm">Reports</span>
              </a>

              <a href="#" className="flex items-center px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors">
                <CogIcon className="h-5 w-5 mr-3" />
                <span className="text-sm">System Settings</span>
              </a>
            </div>
          </nav>

          {/* User Profile at Bottom */}
          <div className="p-4">
            <div className="bg-blue-700 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-white">{user?.name}</div>
                  <div className="text-xs text-blue-300">{user?.role === 'teacher' ? 'Instructor' : 'System Administrator'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="mobile-sidebar fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-lg z-50"
          >
            {/* Same navigation content as desktop */}
            <div className="flex items-center justify-between h-16 px-2 py-2 border-b border-blue-700">
              <img
                src="/logo.jpg"
                alt=""
                className="w-32 h-32 object-contain"
              />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-blue-200 hover:text-white hover:bg-blue-700 rounded transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile navigation - same as desktop */}
            <nav className="mt-6 px-3 flex-1">
              {/* Same navigation items */}
            </nav>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-300 sticky top-0 z-40 shadow-sm">
          <div className="px-3 sm:px-4">
            <div className="flex justify-between items-center h-14">
              {/* Left side */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 lg:hidden"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>

                {/* Welcome Message */}
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">Welcome, {user?.name || 'User'}</span>
                      <span className="text-gray-500 ml-2">• Role: {
                        user?.role === 'admin' ? 'Administrator' :
                        user?.role === 'teacher' ? 'Instructor' :
                        user?.role === 'student' ? 'Student' :
                        user?.role === 'parent' ? 'Parent' :
                        user?.role || 'User'
                      }</span>
                    </div>
                  </div>

                  {/* Breadcrumb */}
                  <nav className="flex items-center space-x-1 text-sm">
                    <Link to="/admin" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                      <HomeIcon className="h-4 w-4 mr-1" />
                      <span>Home</span>
                    </Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-900 font-medium">{getPageTitle()}</span>
                  </nav>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-2">
                {/* AI Assistant Button */}
                <button
                  onClick={() => setAiAgentOpen(!aiAgentOpen)}
                  className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
                >
                  <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1.5" />
                  <span className="text-sm font-medium">AI Agent</span>
                </button>

                <button className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors">
                  <BellIcon className="h-5 w-5" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center p-1 text-sm rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-7 w-7 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                      <span className="text-gray-600 font-medium text-xs">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="ml-2 text-gray-700 hidden sm:block text-sm">{user?.name}</span>
                    <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-500" />
                  </button>

                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-1 w-56 bg-white rounded border border-gray-300 shadow-lg py-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                        <p className="text-xs text-blue-700 capitalize font-medium">{user?.role}</p>
                      </div>

                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center">
                        <UserCircleIcon className="h-4 w-4 mr-2 text-gray-500" />
                        My Profile
                      </button>

                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center">
                        <CogIcon className="h-4 w-4 mr-2 text-gray-500" />
                        User Settings
                      </button>

                      <div className="border-t border-gray-200 mt-1">
                        <button
                          onClick={logout}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 flex items-center"
                        >
                          <PowerIcon className="h-4 w-4 mr-2 text-gray-500" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>

      {/* AI Agent Panel */}
      <AIAgent
        isOpen={aiAgentOpen}
        onClose={() => setAiAgentOpen(false)}
        position="right"
        width="medium"
      />
    </div>
  );
};

export default AdminLayout;