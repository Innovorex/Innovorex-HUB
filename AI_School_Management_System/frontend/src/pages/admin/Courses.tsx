// pages/admin/Courses.tsx - Course Management with ERPNext sync
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../hooks/useRoleBasedQuery';

interface Course {
  id: string;
  name: string;
  course_name: string;
  course_code: string;
  department: string;
  course_abbreviation: string;
  topics?: any[];
}

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  onSave: (data: Partial<Course>) => void;
}

const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, course, onSave }) => {
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    department: '',
    course_abbreviation: '',
  });

  // Update form data when course prop changes
  React.useEffect(() => {
    if (course) {
      setFormData({
        course_name: course.course_name || '',
        course_code: course.course_code || '',
        department: course.department || '',
        course_abbreviation: course.course_abbreviation || '',
      });
    } else {
      setFormData({
        course_name: '',
        course_code: '',
        department: '',
        course_abbreviation: '',
      });
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
              {course ? 'Edit Course' : 'Add New Course'}
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
                Course Name *
              </label>
              <input
                type="text"
                required
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., MATH101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                <option value="CBSE - SRS">CBSE - SRS</option>
                <option value="ICSE - SRS">ICSE - SRS</option>
                <option value="STATE - SRS">STATE - SRS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Abbreviation
              </label>
              <input
                type="text"
                value={formData.course_abbreviation}
                onChange={(e) => setFormData({ ...formData, course_abbreviation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., MATH"
              />
            </div>

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
                {course ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface CoursesProps {
  readOnly?: boolean;
}

const Courses: React.FC<CoursesProps> = ({ readOnly = false }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch courses from ERPNext - use teacher endpoint if teacher
  const { data: coursesData, isLoading, error } = useCourses();

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      const response = await api.post('/courses', courseData);
      return response.data;
    },
    onSuccess: (data) => {
      // Check if data contains the courses list
      if (data && data.data) {
        queryClient.setQueryData(['courses'], data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      }
      toast.success('Course created successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error('Failed to create course');
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Course> & { id: string }) => {
      const response = await api.put(`/courses/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Check if data contains the courses list
      if (data && data.data) {
        queryClient.setQueryData(['courses'], data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      }
      toast.success('Course updated successfully');
      setIsModalOpen(false);
      setSelectedCourse(null);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Failed to update course');
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await api.delete(`/courses/${courseId}`);
      return response.data;
    },
    onSuccess: (data) => {
      // Check if data contains the courses list
      if (data && data.data) {
        queryClient.setQueryData(['courses'], data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      }
      toast.success('Course deleted successfully');
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete course');
    },
  });

  const courses = Array.isArray(coursesData) ? coursesData : [];

  // Filter courses based on search
  const filteredCourses = courses.filter((course: Course) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (course.course_name?.toLowerCase() || '').includes(searchLower) ||
      (course.course_code?.toLowerCase() || '').includes(searchLower) ||
      (course.name?.toLowerCase() || '').includes(searchLower)
    );
  });

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleSaveCourse = (data: Partial<Course>) => {
    if (selectedCourse) {
      // Include all existing data and override with new data
      updateCourseMutation.mutate({
        ...selectedCourse,
        ...data,
        id: selectedCourse.id
      });
    } else {
      createCourseMutation.mutate(data);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    deleteCourseMutation.mutate(courseId);
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
        <p className="text-red-600">Error loading courses. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">Manage all courses from ERPNext ({courses.length} total)</p>
        </div>
        {!isTeacher && !readOnly && (
          <button
            onClick={handleAddCourse}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Course
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course: Course, index: number) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <BookOpenIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{course.course_name || course.name}</h3>
                    <p className="text-sm text-gray-600">{course.course_code || ''}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    <span>Department: {course.department || 'N/A'}</span>
                  </div>

                  {course.course_abbreviation && (
                    <div className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {course.course_abbreviation}
                    </div>
                  )}
                </div>
              </div>

              {!isTeacher && !readOnly && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(course.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Delete confirmation */}
            {deleteConfirm === course.id && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800 mb-2">Are you sure you want to delete this course?</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-3 py-1 text-sm text-gray-600 bg-white rounded border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No courses found matching your search.</p>
        </div>
      )}

      {/* Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCourse(null);
        }}
        course={selectedCourse}
        onSave={handleSaveCourse}
      />
    </div>
  );
};

export default Courses;