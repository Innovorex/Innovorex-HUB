// App.tsx - Main application with role-based routing and complete authentication
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Conditionally import devtools only in development
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools })))
  : () => null;
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';

// Lazy load pages for better performance on 4GB system
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const PendingApprovalPage = lazy(() => import('./pages/auth/PendingApprovalPage'));
const StudentRouter = lazy(() => import('./pages/student/StudentRouter'));
const ParentDashboard = lazy(() => import('./pages/dashboards/ParentDashboard'));
const AdminRouter = lazy(() => import('./pages/admin/AdminRouter'));
const NotFoundPage = lazy(() => import('./pages/common/NotFoundPage'));

// React Query client with memory optimization for 4GB constraint
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on authentication or permission errors
        const status = (error as any)?.response?.status;
        if ([401, 403, 404].includes(status)) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Role-based dashboard router
const DashboardRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check account status
  if (user.status && user.status !== 'active') {
    return <Navigate to="/account/pending" replace />;
  }

  // Redirect to appropriate dashboard based on role
  const roleRoutes = {
    student: '/student',
    teacher: '/teacher',
    parent: '/parent',
    admin: '/admin',
  };

  return <Navigate to={roleRoutes[user.role] || '/auth/login'} replace />;
};

// Main App Routes Component (inside AuthProvider)
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app min-h-screen bg-gray-100">
      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        <Routes>
          {/* Public Authentication Routes */}
          <Route
            path="/auth/login"
            element={
              !isAuthenticated ? <LoginPage /> : <DashboardRouter />
            }
          />
          <Route
            path="/auth/register"
            element={
              !isAuthenticated ? <RegisterPage /> : <DashboardRouter />
            }
          />

          {/* Account Status Routes */}
          <Route path="/account/pending" element={<PendingApprovalPage />} />

          {/* Dashboard redirect */}
          <Route path="/" element={<DashboardRouter />} />

          {/* Protected Role-based Dashboard Routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentRouter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <AdminLayout>
                  <AdminRouter />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/*"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <AdminRouter />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy Routes (for backward compatibility) */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/register" element={<Navigate to="/auth/register" replace />} />

          {/* 404 Route - Must be last */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #d1fae5',
              background: '#f0fdf4',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #fed7d7',
              background: '#fef2f2',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppRoutes />

            {/* React Query DevTools (development only - lazy loaded) */}
            {import.meta.env.DEV && (
              <Suspense fallback={null}>
                <ReactQueryDevtools
                  initialIsOpen={false}
                  position="bottom-right"
                />
              </Suspense>
            )}
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;