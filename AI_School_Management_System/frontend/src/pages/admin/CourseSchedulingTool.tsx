import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  WrenchScrewdriverIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  HomeModernIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const CourseSchedulingTool = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/frappe/Course');
      return response.data?.data || [];
    },
  });

  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const response = await api.get('/frappe/Instructor');
      return response.data?.data || [];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get('/frappe/Room');
      return response.data?.data || [];
    },
  });

  const { data: schedules, refetch: refetchSchedules } = useQuery({
    queryKey: ['scheduling-tool-data'],
    queryFn: async () => {
      const response = await api.get('/frappe/Course Schedule');
      return response.data?.data || [];
    },
  });

  const handleGenerateSchedule = () => {
    alert('Schedule generation feature will be implemented with backend integration');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <WrenchScrewdriverIcon className="h-7 w-7 mr-3 text-blue-600" />
                Course Scheduling Tool
              </h2>
              <p className="text-gray-600 mt-1">Automated course schedule generation and management</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Parameters</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a course...</option>
                  {courses?.map((course: any) => (
                    <option key={course.name} value={course.name}>
                      {course.course_name || course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Instructor
                </label>
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an instructor...</option>
                  {instructors?.map((instructor: any) => (
                    <option key={instructor.name} value={instructor.name}>
                      {instructor.instructor_name || instructor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Room
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a room...</option>
                  {rooms?.map((room: any) => (
                    <option key={room.name} value={room.name}>
                      {room.room_name || room.name} - Capacity: {room.seating_capacity || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleGenerateSchedule}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Generate Schedule
                </button>
                <button
                  onClick={() => refetchSchedules()}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Scheduling Statistics</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BookOpenIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{courses?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Instructors</p>
                      <p className="text-2xl font-bold text-gray-900">{instructors?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <HomeModernIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Available Rooms</p>
                      <p className="text-2xl font-bold text-gray-900">{rooms?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CalendarIcon className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Schedules</p>
                      <p className="text-2xl font-bold text-gray-900">{schedules?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Scheduling Tips</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Select all parameters before generating a schedule</li>
                  <li>• Check room availability and capacity</li>
                  <li>• Verify instructor availability for the selected period</li>
                  <li>• Review generated schedules before confirming</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Schedules</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {schedules?.slice(0, 5).map((schedule: any) => (
                    <tr key={schedule.name}>
                      <td className="px-4 py-2 text-sm">{schedule.course || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{schedule.instructor || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{schedule.room || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">
                        {schedule.from_time || 'N/A'} - {schedule.to_time || 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!schedules || schedules.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                        No schedules found. Generate a new schedule to get started.
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

export default CourseSchedulingTool;