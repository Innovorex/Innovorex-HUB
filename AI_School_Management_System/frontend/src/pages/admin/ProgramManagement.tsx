// Program Management with full CRUD and ERPNext sync
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useDepartments, usePrograms, useCourses } from '../../hooks/useRoleBasedQuery';

interface Course {
  id?: string;
  name?: string;
  course: string;
  course_name: string;
  required: boolean | number;
  idx?: number;
}

interface Program {
  id: string;
  name: string;
  program_name?: string;
  program_code?: string;
  program_abbreviation?: string;
  department?: string;
  description?: string;
  courses?: Course[];
  // Additional fields from portal
  created_at?: string;
  modified?: string;
}

interface ProgramManagementProps {
  readOnly?: boolean;
}

const ProgramManagement: React.FC<ProgramManagementProps> = ({ readOnly = false }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const instructorId = user?.instructorId || 'EDU-INS-2025-00002';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showManageCoursesModal, setShowManageCoursesModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState<Partial<Program>>({});
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);

  const queryClient = useQueryClient();

  // Fetch programs from backend (which syncs from ERPNext)
  const { data: programsData, isLoading, error } = usePrograms();

  // Fetch full program details with courses for expanded programs
  const { data: programDetails = {} } = useQuery({
    queryKey: ['program-details', Array.from(expandedPrograms)],
    queryFn: async () => {
      const detailsByProgram: Record<string, Program> = {};
      for (const programId of expandedPrograms) {
        try {
          const response = await api.get(`/programs/${programId}`);
          detailsByProgram[programId] = response.data.data;
        } catch (error) {
          console.error(`Failed to fetch details for program ${programId}:`, error);
          detailsByProgram[programId] = { id: programId, name: programId, courses: [] } as Program;
        }
      }
      return detailsByProgram;
    },
    enabled: expandedPrograms.size > 0,
  });

  // Fetch all available courses for assignment
  const { data: availableCourses = [] } = useCourses();

  // Fetch all departments - disable for teachers since they don't need it
  const { data: departments = [] } = useDepartments();

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: Partial<Program>) => {
      const response = await api.post('/programs/create', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Program created and synced to ERPNext successfully');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create program');
    }
  });

  // Update program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Program> }) => {
      const response = await api.put(`/programs/${id}`, data);
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Program updated and synced to ERPNext successfully');
      // Force immediate refetch of programs from backend
      await queryClient.invalidateQueries({ queryKey: ['programs'] });
      await queryClient.refetchQueries({ queryKey: ['programs'] });
      setShowEditModal(false);
      setSelectedProgram(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update program');
    }
  });

  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/programs/${id}`);
    },
    onSuccess: () => {
      toast.success('Program deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setShowDeleteModal(false);
      setSelectedProgram(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete program');
    }
  });

  // Update program courses mutation
  const updateCoursesMutation = useMutation({
    mutationFn: async ({ programId, courses }: { programId: string; courses: Course[] }) => {
      const response = await api.put(`/programs/${programId}/courses`, { courses });
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Courses updated successfully');
      queryClient.invalidateQueries({ queryKey: ['program-details'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setShowManageCoursesModal(false);

      // Keep the program expanded to show the updated courses
      const newExpanded = new Set(expandedPrograms);
      newExpanded.add(variables.programId);
      setExpandedPrograms(newExpanded);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update courses');
    }
  });

  const programs = Array.isArray(programsData) ? programsData : [];

  const toggleProgram = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  // Filter programs based on search and department
  const filteredPrograms = programs.filter((program: Program) => {
    const matchesSearch = searchTerm === '' ||
      (program.program_name || program.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.program_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.program_abbreviation || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === '' ||
      program.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const resetForm = () => {
    setFormData({});
  };

  const handleAddProgram = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setFormData({
      program_name: program.program_name || program.name,
      program_code: program.program_code,
      program_abbreviation: program.program_abbreviation,
      department: program.department,
      description: program.description
    });
    setShowEditModal(true);
  };

  const handleViewProgram = (program: Program) => {
    setSelectedProgram(program);
    setShowViewModal(true);
  };

  const handleDeleteProgram = (program: Program) => {
    setSelectedProgram(program);
    setShowDeleteModal(true);
  };

  const handleManageCourses = (program: Program) => {
    setSelectedProgram(program);
    // Load existing courses for this program
    const programDetail = programDetails[program.id || program.name];
    if (programDetail && programDetail.courses) {
      setSelectedCourses(programDetail.courses);
    } else {
      setSelectedCourses([]);
    }
    setShowManageCoursesModal(true);
  };

  const handleSubmitCourses = () => {
    if (selectedProgram) {
      updateCoursesMutation.mutate({
        programId: selectedProgram.id || selectedProgram.name,
        courses: selectedCourses
      });
    }
  };

  const addCourse = (courseName: string) => {
    const newCourse: Course = {
      course: courseName,
      course_name: courseName,
      required: false
    };
    setSelectedCourses([...selectedCourses, newCourse]);
  };

  const removeCourse = (index: number) => {
    setSelectedCourses(selectedCourses.filter((_, i) => i !== index));
  };

  const toggleCourseRequired = (index: number) => {
    const updated = [...selectedCourses];
    updated[index].required = !updated[index].required;
    setSelectedCourses(updated);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createProgramMutation.mutate(formData);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProgram) {
      updateProgramMutation.mutate({
        id: selectedProgram.id || selectedProgram.name,
        data: formData
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedProgram) {
      deleteProgramMutation.mutate(selectedProgram.id || selectedProgram.name);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Program</h1>
          <p className="text-gray-600 mt-1">Manage academic programs synced with ERPNext ({programs.length} total)</p>
        </div>
        {!isTeacher && !readOnly && (
          <button
            onClick={handleAddProgram}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Program
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Department Filter */}
        <div className="md:w-64">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map((dept: any) => (
              <option key={dept.id} value={dept.name}>
                {dept.department_name || dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program: Program, index: number) => (
          <motion.div
            key={program.id || program.name}
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
                    <h3 className="font-semibold text-gray-900">
                      {program.program_name || program.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {program.program_code || 'No code'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    <span>Department: {program.department || 'Not specified'}</span>
                  </div>

                  <div className="flex gap-2">
                    {program.program_abbreviation && (
                      <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        {program.program_abbreviation}
                      </span>
                    )}
                  </div>

                  {/* Show/Hide Courses Button */}
                  <button
                    onClick={() => toggleProgram(program.id || program.name)}
                    className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <BookOpenIcon className="h-4 w-4 mr-1" />
                    <span>Courses</span>
                    {expandedPrograms.has(program.id || program.name) ? (
                      <ChevronUpIcon className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </button>

                  {/* Courses List */}
                  {expandedPrograms.has(program.id || program.name) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-gray-700">Connected Courses:</h4>
                        {!isTeacher && !readOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleManageCourses(program);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Manage Courses
                          </button>
                        )}
                      </div>
                      {programDetails[program.id || program.name] ? (
                        <div className="space-y-1">
                          {programDetails[program.id || program.name].courses && programDetails[program.id || program.name].courses.length > 0 ? (
                            programDetails[program.id || program.name].courses.map((course: Course) => (
                              <div key={course.name || course.course} className="flex items-center text-xs">
                                <BookOpenIcon className="h-3 w-3 mr-1 text-gray-400" />
                                <span className="text-gray-600">
                                  {course.course_name || course.course}
                                </span>
                                {(course.required === 1 || course.required === true) && (
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

              {!isTeacher && !readOnly && (
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleViewProgram(program)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditProgram(program)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit Program"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProgram(program)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Program"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No programs found matching your search.</p>
        </div>
      )}

      {/* Add Program Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Program</h2>
            </div>
            <form onSubmit={handleSubmitAdd} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.program_name || ''}
                    onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Bachelor of Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Code
                  </label>
                  <input
                    type="text"
                    value={formData.program_code || ''}
                    onChange={(e) => setFormData({ ...formData, program_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., BCS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Abbreviation
                  </label>
                  <input
                    type="text"
                    value={formData.program_abbreviation || ''}
                    onChange={(e) => setFormData({ ...formData, program_abbreviation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., B.Sc CS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.department_name || dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter program description..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProgramMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {createProgramMutation.isPending ? 'Creating...' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {showEditModal && selectedProgram && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Program</h2>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.program_name || ''}
                    onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Code
                  </label>
                  <input
                    type="text"
                    value={formData.program_code || ''}
                    onChange={(e) => setFormData({ ...formData, program_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Abbreviation
                  </label>
                  <input
                    type="text"
                    value={formData.program_abbreviation || ''}
                    onChange={(e) => setFormData({ ...formData, program_abbreviation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.department_name || dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProgram(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProgramMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updateProgramMutation.isPending ? 'Updating...' : 'Update Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Program Modal */}
      {showViewModal && selectedProgram && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Program Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedProgram(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Program ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProgram.id || selectedProgram.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Program Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProgram.program_name || selectedProgram.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Program Code</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProgram.program_code || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Abbreviation</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProgram.program_abbreviation || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProgram.department || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProgram.description || 'No description available'}</p>
                </div>
                {selectedProgram.courses && selectedProgram.courses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Courses</label>
                    <div className="space-y-1">
                      {selectedProgram.courses.map((course) => (
                        <div key={course.id || course.course} className="flex items-center text-sm">
                          <BookOpenIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700">{course.course_name || course.course}</span>
                          {course.required && (
                            <span className="ml-2 text-xs text-green-600">(Required)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProgram.modified && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Modified</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedProgram.modified).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProgram && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Program</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedProgram.program_name || selectedProgram.name}"?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProgram(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteProgramMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deleteProgramMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Courses Modal */}
      {showManageCoursesModal && selectedProgram && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Courses for {selectedProgram.program_name || selectedProgram.name}
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Add Course</h3>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addCourse(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a course to add...</option>
                    {Array.isArray(availableCourses) ? availableCourses
                      .filter((course: any) =>
                        !selectedCourses.some(sc => sc.course === course.name)
                      ) : []
                      .map((course: any) => (
                        <option key={course.id || course.name} value={course.name}>
                          {course.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Current Courses</h3>
                {selectedCourses.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCourses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <BookOpenIcon className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {course.course_name || course.course}
                          </span>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={course.required === true || course.required === 1}
                              onChange={() => toggleCourseRequired(index)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-600">Required</span>
                          </label>
                        </div>
                        <button
                          onClick={() => removeCourse(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No courses assigned to this program</p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowManageCoursesModal(false);
                    setSelectedCourses([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCourses}
                  disabled={updateCoursesMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updateCoursesMutation.isPending ? 'Updating...' : 'Update Courses'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;