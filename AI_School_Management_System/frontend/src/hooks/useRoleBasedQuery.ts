// hooks/useRoleBasedQuery.ts - Hook for role-based API endpoint selection
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface RoleBasedEndpoints {
  admin: string;
  teacher: string;
}

export const useRoleBasedQuery = <TData = any>(
  baseQueryKey: string,
  endpoints: RoleBasedEndpoints,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const instructorId = user?.instructorId || 'EDU-INS-2025-00001';

  const endpoint = isTeacher ? endpoints.teacher : endpoints.admin;
  const finalEndpoint = endpoint.replace('{instructorId}', instructorId);

  return useQuery<TData>({
    queryKey: [baseQueryKey, user?.role, instructorId],
    queryFn: async () => {
      const response = await api.get(finalEndpoint);
      // Handle both direct array and {success, data} wrapper formats
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    },
    enabled: isAuthenticated && !isLoading && !!user, // Only run when authenticated
    ...options,
  });
};

// Pre-configured hooks for common endpoints
export const useCourses = () => {
  return useRoleBasedQuery(
    'courses',
    {
      admin: '/courses',
      teacher: '/teacher/courses/{instructorId}',
    }
  );
};

export const usePrograms = () => {
  return useRoleBasedQuery(
    'programs',
    {
      admin: '/programs',
      teacher: '/teacher/programs/{instructorId}',
    }
  );
};

export const useStudents = () => {
  return useRoleBasedQuery(
    'students',
    {
      admin: '/admin/students',
      teacher: '/teacher/students/{instructorId}',
    }
  );
};

export const useDepartments = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isTeacher = user?.role === 'teacher';

  return useQuery({
    queryKey: ['departments', user?.role],
    queryFn: async () => {
      // Teachers should only see their department, but for simplicity
      // we'll still fetch all departments and filter in UI
      const response = await api.get('/departments');
      return response.data;
    },
    enabled: isAuthenticated && !isLoading && !!user && !isTeacher, // Only run when authenticated and not teacher
  });
};