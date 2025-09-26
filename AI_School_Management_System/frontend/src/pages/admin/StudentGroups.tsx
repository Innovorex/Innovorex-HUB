// pages/admin/StudentGroups.tsx - Display all student groups from ERPNext
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon,
  UserIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';

interface Student {
  id: string;
  name: string;
  rollNumber: number;
  active: boolean;
}

interface Instructor {
  id: string;
  name: string;
}

interface StudentGroup {
  id: string;
  name: string;
  academicYear: string;
  academicTerm: string;
  groupBasedOn: string;
  program: string;
  batch: string;
  maxStrength: number;
  currentStrength: number;
  disabled: boolean;
  students: Student[];
  instructors: Instructor[];
}

const StudentGroups: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch student groups from ERPNext
  const { data: groupsData, isLoading, error } = useQuery({
    queryKey: ['student-groups'],
    queryFn: async () => {
      const response = await api.get('/student-groups');
      return response.data;
    },
  });

  const groups = groupsData || [];

  // Toggle expansion of group details
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Filter groups based on search
  const filteredGroups = groups.filter((group: StudentGroup) =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.batch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading student groups. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Groups</h1>
          <p className="text-gray-600 mt-1">Manage all student groups ({groups.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Group
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search student groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group: StudentGroup, index: number) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <UserGroupIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{group.groupBasedOn}</span>
                      {group.disabled && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Disabled</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    <span>{group.academicYear} • {group.academicTerm}</span>
                  </div>

                  {group.program && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-2" />
                      <span>Program: {group.program}</span>
                    </div>
                  )}

                  {group.batch && (
                    <div className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                      Batch: {group.batch}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <UsersIcon className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="text-gray-600">
                        {group.currentStrength}/{group.maxStrength} Students
                      </span>
                    </div>
                    {group.instructors.length > 0 && (
                      <div className="flex items-center text-sm">
                        <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-gray-600">
                          {group.instructors.length} Instructor{group.instructors.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Show/Hide Details Button */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>View Details</span>
                    {expandedGroups.has(group.id) ? (
                      <ChevronUpIcon className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {expandedGroups.has(group.id) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                      {/* Instructors */}
                      {group.instructors.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">Instructors:</h4>
                          <div className="space-y-1">
                            {group.instructors.map((instructor: Instructor) => (
                              <div key={instructor.id} className="flex items-center text-xs">
                                <UserIcon className="h-3 w-3 mr-1 text-gray-400" />
                                <span className="text-gray-600">{instructor.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Students */}
                      {group.students.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">
                            Students ({group.students.length}):
                          </h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {group.students.map((student: Student) => (
                              <div key={student.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center">
                                  <span className="text-gray-500 mr-2">#{student.rollNumber}</span>
                                  <span className="text-gray-600">{student.name}</span>
                                </div>
                                {student.active ? (
                                  <span className="text-green-600 text-xs">Active</span>
                                ) : (
                                  <span className="text-gray-400 text-xs">Inactive</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {group.students.length === 0 && group.instructors.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No students or instructors assigned</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No student groups found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default StudentGroups;