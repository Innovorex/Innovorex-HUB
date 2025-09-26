// pages/admin/Programs.tsx - Display all programs from ERPNext
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Course {
  id: string;
  name: string;
  code: string;
  required?: boolean;
}

interface Program {
  id: string;
  name: string;
  code: string;
  department: string;
  abbreviation: string;
  courses?: Course[];
}

const Programs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch programs from ERPNext
  const { data: programsData, isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get('/programs');
      return response.data;
    },
  });

  // Fetch courses for expanded programs
  const { data: coursesData = {} } = useQuery({
    queryKey: ['program-courses', Array.from(expandedPrograms)],
    queryFn: async () => {
      const coursesByProgram: Record<string, Course[]> = {};
      for (const programId of expandedPrograms) {
        const response = await api.get(`/courses?program=${programId}`);
        coursesByProgram[programId] = response.data;
      }
      return coursesByProgram;
    },
    enabled: expandedPrograms.size > 0,
  });

  const programs = programsData || [];

  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      const response = await api.delete(`/programs/${programId}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data && data.data) {
        queryClient.setQueryData(['programs'], data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['programs'] });
      }
      toast.success('Program deleted successfully');
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.exc_type === 'LinkExistsError'
        ? 'Cannot delete: Program has linked enrollments or courses'
        : 'Failed to delete program');
      setDeleteConfirm(null);
    },
  });

  const handleDeleteProgram = (programId: string) => {
    deleteProgramMutation.mutate(programId);
  };

  const toggleProgram = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  // Filter programs based on search
  const filteredPrograms = programs.filter((program: Program) =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.code.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-red-600">Error loading programs. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600 mt-1">Manage all academic programs ({programs.length} total)</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Program
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program: Program, index: number) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <AcademicCapIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{program.name}</h3>
                    <p className="text-sm text-gray-600">{program.code}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    <span>Department: {program.department || 'N/A'}</span>
                  </div>

                  {program.abbreviation && (
                    <div className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      {program.abbreviation}
                    </div>
                  )}

                  {/* Show/Hide Courses Button */}
                  <button
                    onClick={() => toggleProgram(program.id)}
                    className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <BookOpenIcon className="h-4 w-4 mr-1" />
                    <span>Courses</span>
                    {expandedPrograms.has(program.id) ? (
                      <ChevronUpIcon className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>

                  {/* Courses List */}
                  {expandedPrograms.has(program.id) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Connected Courses:</h4>
                      {coursesData[program.id] ? (
                        <div className="space-y-1">
                          {coursesData[program.id].length > 0 ? (
                            coursesData[program.id].map((course: Course) => (
                              <div key={course.id} className="flex items-center text-xs">
                                <BookOpenIcon className="h-3 w-3 mr-1 text-gray-400" />
                                <span className="text-gray-600">{course.name}</span>
                                {course.required && (
                                  <span className="ml-1 text-xs text-green-600">(Required)</span>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500 italic">No courses connected</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-400">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-2"></div>
                          Loading courses...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(program.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Delete confirmation */}
            {deleteConfirm === program.id && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800 mb-2">
                  Are you sure you want to delete this program? This will also remove it from ERPNext.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-3 py-1 text-sm text-gray-600 bg-white rounded border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteProgram(program.id)}
                    disabled={deleteProgramMutation.isPending}
                    className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteProgramMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No programs found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Programs;