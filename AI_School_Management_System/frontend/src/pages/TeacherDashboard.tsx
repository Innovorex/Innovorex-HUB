import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  attendance: number;
  averageGrade: number;
  lastAssignment: string;
}

interface ClassSchedule {
  id: string;
  className: string;
  time: string;
  room: string;
  students: number;
  topic: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  submitted: number;
  total: number;
  class: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
}

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const instructorId = 'EDU-INS-2025-00002'; // Maths Instructor ID

        const response = await axios.get(
          `https://server.innovorex.co.in/api/teacher/dashboard/${instructorId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');

        // Fallback to static data if API fails
        setDashboardData({
          instructor: {
            name: 'Maths Instructor',
            email: 'maths.instructor@innovorex.co.in',
            department: 'Mathematics',
            image: null
          },
          stats: {
            totalStudents: 45,
            todaysClasses: 4,
            attendanceRate: 87,
            averagePerformance: 87
          },
          schedule: [
            {
              id: '1',
              course: 'Mathematics - Grade 10',
              room: 'Room 301',
              time: '9:00 AM - 9:45 AM',
              students: 25
            }
          ],
          recentAssignments: [
            {
              id: 'ASSIGN-001',
              title: 'Algebra Practice Set 1',
              course: 'Mathematics',
              dueDate: '2024-12-25',
              submitted: 20,
              total: 25
            }
          ],
          topStudents: [
            { name: 'Rahul Sharma', course: 'Mathematics', grade: 'A+', percentage: 95 }
          ],
          courses: ['Mathematics']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const [teacherInfo] = useState({
    name: dashboardData?.instructor?.name || 'Maths Instructor',
    email: dashboardData?.instructor?.email || 'maths.instructor@innovorex.co.in',
    department: dashboardData?.instructor?.department || 'Mathematics',
    employeeId: 'EDU-INS-2025-00002',
    subjects: dashboardData?.courses || ['Mathematics'],
    totalStudents: dashboardData?.stats?.totalStudents || 45,
    totalClasses: dashboardData?.stats?.todaysClasses || 4
  });

  // Use real data from API or fallback to static data
  const todaySchedule = dashboardData?.schedule || [];
  const recentAssignments = dashboardData?.recentAssignments || [];
  const topStudents = dashboardData?.topStudents || [];

  const attendanceToday = {
    present: Math.floor((dashboardData?.stats?.attendanceRate || 87) * (dashboardData?.stats?.totalStudents || 67) / 100),
    absent: Math.floor((100 - (dashboardData?.stats?.attendanceRate || 87)) * (dashboardData?.stats?.totalStudents || 67) / 100 * 0.7),
    late: Math.floor((100 - (dashboardData?.stats?.attendanceRate || 87)) * (dashboardData?.stats?.totalStudents || 67) / 100 * 0.3),
    total: dashboardData?.stats?.totalStudents || 67
  };

  const [performanceData] = useState({
    averageScore: 78.5,
    improvement: 5.2,
    assignmentCompletion: 85,
    classParticipation: 72
  });

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-100 text-green-800';
    if (grade >= 80) return 'bg-blue-100 text-blue-800';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const markAttendance = async (studentId: string, status: string) => {
    try {
      await axios.post('https://server.innovorex.co.in/api/teacher/attendance', {
        studentId,
        courseScheduleId: selectedClass?.id,
        status,
        date: new Date().toISOString().split('T')[0]
      });
      alert(`Attendance marked as ${status}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{teacherInfo.totalStudents}</p>
                <p className="text-xs text-gray-500 mt-1">Across all classes</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                <p className="text-2xl font-semibold text-gray-900">{todaySchedule.length}</p>
                <p className="text-xs text-gray-500 mt-1">4 completed, 0 remaining</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {((attendanceToday.present / attendanceToday.total) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{attendanceToday.present}/{attendanceToday.total} present</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
                <p className="text-2xl font-semibold text-gray-900">{performanceData.averageScore}%</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{performanceData.improvement}% this month
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-600" />
                  Today's Schedule
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {todaySchedule.map((schedule, index) => (
                    <div key={schedule.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          index < 2 ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{schedule.className}</h3>
                              <p className="text-sm text-gray-600 mt-1">{schedule.topic}</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {schedule.time}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {schedule.students} students
                                </span>
                                <span className="text-xs text-gray-500">{schedule.room}</span>
                              </div>
                            </div>
                            {index < 2 && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Assignments */}
            <div className="bg-white rounded-lg shadow mt-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                  Recent Assignments
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentAssignments.map(assignment => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{assignment.class}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">Due: {assignment.dueDate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {assignment.submitted}/{assignment.total}
                          </div>
                          <div className="text-xs text-gray-500">Submitted</div>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Attendance Overview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Today's Attendance</h2>
              </div>
              <div className="p-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <svg className="w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56 * (attendanceToday.present / attendanceToday.total)} ${2 * Math.PI * 56}`}
                        strokeDashoffset="0"
                        className="text-green-500 transform -rotate-90 origin-center"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {((attendanceToday.present / attendanceToday.total) * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Present</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-semibold">{attendanceToday.present}</span>
                    </div>
                    <p className="text-xs text-gray-500">Present</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-sm font-semibold">{attendanceToday.absent}</span>
                    </div>
                    <p className="text-xs text-gray-500">Absent</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-semibold">{attendanceToday.late}</span>
                    </div>
                    <p className="text-xs text-gray-500">Late</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Students */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  Top Students
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topStudents.map((student, index) => (
                    <div key={student.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`text-xs ${getGradeColor(student.averageGrade)} px-2 py-0.5 rounded`}>
                            {student.averageGrade}%
                          </span>
                          <span className={`text-xs ${getAttendanceColor(student.attendance)}`}>
                            {student.attendance}% attendance
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center">
                      <ClipboardList className="w-5 h-5 mr-3 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Mark Attendance</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => alert('Assignment creation feature coming soon!')}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-3 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Create Assignment</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setShowGradesModal(true)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-3 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Enter Grades</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="flex items-center">
                      <Mail className="w-5 h-5 mr-3 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Send Announcement</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  onChange={(e) => setSelectedClass(todaySchedule[parseInt(e.target.value)])}
                >
                  <option value="">Choose a class</option>
                  {todaySchedule.map((cls, index) => (
                    <option key={cls.id} value={index}>
                      {cls.course} - {cls.time}
                    </option>
                  ))}
                </select>
              </div>
              {selectedClass && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Students in {selectedClass.course}
                  </p>
                  {topStudents.slice(0, 3).map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm text-gray-900">{student.name}</span>
                      <div className="space-x-2">
                        <button
                          onClick={() => markAttendance(student.id, 'Present')}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => markAttendance(student.id, 'Absent')}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grades Modal */}
      {showGradesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enter Grades</h3>
              <button
                onClick={() => setShowGradesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment/Test
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Select assignment</option>
                  {recentAssignments.map((assignment: any) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Students</p>
                {topStudents.slice(0, 3).map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm text-gray-900">{student.name}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Grade"
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
              <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                Save Grades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;