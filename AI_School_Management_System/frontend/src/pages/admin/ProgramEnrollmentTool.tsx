import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  PlayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const ProgramEnrollmentTool = () => {
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [batchMode, setBatchMode] = useState(false);

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get('/frappe/Program');
      return response.data?.data || [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/frappe/Student');
      return response.data?.data || [];
    },
  });

  const { data: enrollments, refetch: refetchEnrollments } = useQuery({
    queryKey: ['program-enrollments'],
    queryFn: async () => {
      const response = await api.get('/frappe/Program Enrollment');
      return response.data?.data || [];
    },
  });

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleBatchEnroll = () => {
    if (!selectedProgram || selectedStudents.length === 0) {
      alert('Please select a program and at least one student');
      return;
    }
    alert(`Batch enrollment feature will be implemented with backend integration.
Selected: ${selectedStudents.length} students for program: ${selectedProgram}`);
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students?.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students?.map((student: any) => student.name) || []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <WrenchScrewdriverIcon className="h-7 w-7 mr-3 text-purple-600" />
                Program Enrollment Tool
              </h2>
              <p className="text-gray-600 mt-1">Batch enrollment and management of student program registrations</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrollment Parameters */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Enrollment Parameters</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Program
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Choose a program...</option>
                    {programs?.map((program: any) => (
                      <option key={program.name} value={program.name}>
                        {program.program_name || program.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enrollment Date
                  </label>
                  <input
                    type="date"
                    value={enrollmentDate}
                    onChange={(e) => setEnrollmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="batchMode"
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="batchMode" className="text-sm text-gray-700">
                  Enable batch enrollment mode
                </label>
              </div>

              {/* Student Selection */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Select Students</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      {selectedStudents.length === students?.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-sm text-gray-500">
                      ({selectedStudents.length} selected)
                    </span>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded">
                  {students?.map((student: any) => (
                    <div
                      key={student.name}
                      className="flex items-center p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.name)}
                        onChange={() => handleStudentSelection(student.name)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-3"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{student.student_email_id || 'No email'}</p>
                      </div>
                      <span className="text-xs text-gray-400">{student.name}</span>
                    </div>
                  ))}
                  {(!students || students.length === 0) && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No students found
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleBatchEnroll}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  disabled={!selectedProgram || selectedStudents.length === 0}
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Enroll Students ({selectedStudents.length})
                </button>
                <button
                  onClick={() => refetchEnrollments()}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Enrollment Statistics</h3>

              <div className="space-y-3">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Programs</p>
                      <p className="text-2xl font-bold text-gray-900">{programs?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Available Students</p>
                      <p className="text-2xl font-bold text-gray-900">{students?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ClipboardDocumentListIcon className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Enrollments</p>
                      <p className="text-2xl font-bold text-gray-900">{enrollments?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Selected for Enrollment</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedStudents.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Enrollment Tips
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Select program before choosing students</li>
                  <li>• Check student eligibility requirements</li>
                  <li>• Set appropriate enrollment date</li>
                  <li>• Use batch mode for multiple enrollments</li>
                  <li>• Review enrollments before confirming</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Enrollments */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Enrollments</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enrollment Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {enrollments?.slice(0, 5).map((enrollment: any) => (
                    <tr key={enrollment.name}>
                      <td className="px-4 py-2 text-sm">{enrollment.student || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{enrollment.program || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{enrollment.enrollment_date || 'N/A'}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!enrollments || enrollments.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                        No enrollments found. Use the tool above to create new enrollments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramEnrollmentTool;