// pages/admin/ProgramEnrollment.tsx - Program Enrollment with ERPNext sync
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

interface ProgramEnrollment {
  id: string;
  name: string;
  student: string;
  student_name: string;
  program: string;
  academic_year: string;
  academic_term: string;
  enrollment_date: string;
  courses: ProgramCourse[];
}

interface ProgramCourse {
  course: string;
  course_name: string;
  required?: boolean;
}

interface Student {
  id: string;
  name: string;
  student_name: string;
}

interface Program {
  id: string;
  name: string;
  program_name?: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface AcademicTerm {
  id: string;
  name: string;
  academic_year: string;
}

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment?: ProgramEnrollment | null;
  onSave: (data: Partial<ProgramEnrollment>) => void;
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ isOpen, onClose, enrollment, onSave }) => {
  const [formData, setFormData] = useState({
    student: '',
    program: '',
    academic_year: '',
    academic_term: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    courses: [] as ProgramCourse[],
  });
  const [availableCourses, setAvailableCourses] = useState<ProgramCourse[]>([]);

  // Fetch dropdown data
  const { data: students = [] } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const response = await api.get('/students-list');
      return response.data;
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get('/programs');
      return response.data;
    },
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await api.get('/academic-years');
      return response.data;
    },
  });

  const { data: academicTerms = [] } = useQuery({
    queryKey: ['academic-terms'],
    queryFn: async () => {
      const response = await api.get('/academic-terms');
      return response.data;
    },
  });

  // Update form data when enrollment prop changes
  React.useEffect(() => {
    if (enrollment) {
      setFormData({
        student: enrollment.student || '',
        program: enrollment.program || '',
        academic_year: enrollment.academic_year || '',
        academic_term: enrollment.academic_term || '',
        enrollment_date: enrollment.enrollment_date || new Date().toISOString().split('T')[0],
        courses: enrollment.courses || [],
      });
    } else {
      setFormData({
        student: '',
        program: '',
        academic_year: '',
        academic_term: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        courses: [],
      });
    }
  }, [enrollment]);

  // Fetch available courses when program changes
  React.useEffect(() => {
    if (formData.program) {
      const fetchProgramCourses = async () => {
        try {
          const response = await api.get(`/programs/${formData.program}/courses`);
          setAvailableCourses(response.data);

          // If this is a new enrollment, automatically select required courses
          if (!enrollment) {
            const requiredCourses = response.data.filter((course: ProgramCourse) => course.required);
            setFormData(prev => ({ ...prev, courses: requiredCourses }));
          }
        } catch (error) {
          console.error('Failed to fetch program courses:', error);
          setAvailableCourses([]);
        }
      };
      fetchProgramCourses();
    } else {
      setAvailableCourses([]);
      setFormData(prev => ({ ...prev, courses: [] }));
    }
  }, [formData.program, enrollment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCourseToggle = (course: ProgramCourse) => {
    const isSelected = formData.courses.some(c => c.course === course.course);
    if (isSelected) {
      // Don't allow deselecting required courses
      if (course.required) {
        toast.error('Required courses cannot be deselected');
        return;
      }
      setFormData(prev => ({
        ...prev,
        courses: prev.courses.filter(c => c.course !== course.course)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        courses: [...prev.courses, course]
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg p-6 w-full max-w-md"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {enrollment ? 'Edit Enrollment' : 'New Enrollment'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>
              <select
                required
                value={formData.student}
                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Student</option>
                {students.map((student: Student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_name} ({student.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program *
              </label>
              <select
                required
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Program</option>
                {programs.map((program: Program) => (
                  <option key={program.id} value={program.id}>
                    {program.program_name || program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year *
              </label>
              <select
                required
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year: AcademicYear) => (
                  <option key={year.id} value={year.name}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Term
              </label>
              <select
                value={formData.academic_term}
                onChange={(e) => setFormData({ ...formData, academic_term: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Academic Term</option>
                {academicTerms.map((term: AcademicTerm) => (
                  <option key={term.id} value={term.name}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enrollment Date *
              </label>
              <input
                type="date"
                required
                value={formData.enrollment_date}
                onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Course Selection */}
            {availableCourses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Courses *
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {availableCourses.map((course) => {
                    const isSelected = formData.courses.some(c => c.course === course.course);
                    return (
                      <div key={course.course} className="flex items-center mb-2 last:mb-0">
                        <input
                          type="checkbox"
                          id={`course-${course.course}`}
                          checked={isSelected}
                          onChange={() => handleCourseToggle(course)}
                          disabled={course.required && isSelected}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`course-${course.course}`} className="ml-2 text-sm text-gray-700 flex-1">
                          {course.course_name}
                          {course.required && (
                            <span className="ml-1 text-red-500 text-xs">(Required)</span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected {formData.courses.length} out of {availableCourses.length} courses
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {enrollment ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const ProgramEnrollment: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<ProgramEnrollment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch program enrollments from ERPNext
  const { data: enrollmentsData, isLoading, error } = useQuery({
    queryKey: ['program-enrollments'],
    queryFn: async () => {
      const response = await api.get('/program-enrollments');
      return response.data;
    },
  });

  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentData: Partial<ProgramEnrollment>) => {
      const response = await api.post('/program-enrollments', enrollmentData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data && data.data) {
        queryClient.setQueryData(['program-enrollments'], data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['program-enrollments'] });
      }
      toast.success('Enrollment created successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error('Failed to create enrollment');
    },
  });

  // Update enrollment mutation
  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProgramEnrollment> & { id: string }) => {
      const response = await api.put(`/program-enrollments/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data && data.data) {
        queryClient.setQueryData(['program-enrollments'], data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['program-enrollments'] });
      }
      toast.success('Enrollment updated successfully');
      setIsModalOpen(false);
      setSelectedEnrollment(null);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Failed to update enrollment');
    },
  });

  // Delete enrollment mutation
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await api.delete(`/program-enrollments/${enrollmentId}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data && data.data) {
        queryClient.setQueryData(['program-enrollments'], data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['program-enrollments'] });
      }
      toast.success('Enrollment deleted successfully');
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete enrollment');
    },
  });

  const enrollments = enrollmentsData || [];

  // Filter enrollments based on search
  const filteredEnrollments = enrollments.filter((enrollment: ProgramEnrollment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (enrollment.student_name?.toLowerCase() || '').includes(searchLower) ||
      (enrollment.student?.toLowerCase() || '').includes(searchLower) ||
      (enrollment.program?.toLowerCase() || '').includes(searchLower) ||
      (enrollment.academic_year?.toLowerCase() || '').includes(searchLower)
    );
  });

  const handleAddEnrollment = () => {
    setSelectedEnrollment(null);
    setIsModalOpen(true);
  };

  const handleEditEnrollment = (enrollment: ProgramEnrollment) => {
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  const handleSaveEnrollment = (data: Partial<ProgramEnrollment>) => {
    if (selectedEnrollment) {
      updateEnrollmentMutation.mutate({
        ...selectedEnrollment,
        ...data,
        id: selectedEnrollment.id
      });
    } else {
      createEnrollmentMutation.mutate(data);
    }
  };

  const handleDeleteEnrollment = (enrollmentId: string) => {
    deleteEnrollmentMutation.mutate(enrollmentId);
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
        <p className="text-red-600">Error loading program enrollments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Enrollment</h1>
          <p className="text-gray-600 mt-1">Manage student program enrollments from ERPNext ({enrollments.length} total)</p>
        </div>
        <button
          onClick={handleAddEnrollment}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Enrollment
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search enrollments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Term
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnrollments.map((enrollment: ProgramEnrollment, index: number) => (
                <motion.tr
                  key={enrollment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.student_name}</div>
                        <div className="text-sm text-gray-500">{enrollment.student}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-4 w-4 text-green-600 mr-2" />
                      <div className="text-sm text-gray-900">{enrollment.program}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.academic_year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.academic_term || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {enrollment.courses?.length || 0} courses
                      {enrollment.courses && enrollment.courses.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {enrollment.courses.slice(0, 2).map(c => c.course_name).join(', ')}
                          {enrollment.courses.length > 2 && ` +${enrollment.courses.length - 2} more`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {enrollment.enrollment_date ? new Date(enrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEnrollment(enrollment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(enrollment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Delete confirmation */}
                    {deleteConfirm === enrollment.id && (
                      <div className="absolute right-6 mt-2 p-3 bg-red-50 rounded-lg shadow-lg z-10">
                        <p className="text-sm text-red-800 mb-2">Delete this enrollment?</p>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 text-sm text-gray-600 bg-white rounded border border-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteEnrollment(enrollment.id)}
                            className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEnrollments.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No program enrollments found matching your search.</p>
        </div>
      )}

      {/* Enrollment Modal */}
      <EnrollmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEnrollment(null);
        }}
        enrollment={selectedEnrollment}
        onSave={handleSaveEnrollment}
      />
    </div>
  );
};

export default ProgramEnrollment;