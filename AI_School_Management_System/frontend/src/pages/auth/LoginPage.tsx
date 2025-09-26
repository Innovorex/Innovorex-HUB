// pages/auth/LoginPage.tsx - ERPNext-style login page with Innovorex branding
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface LoginCredentials {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);

      // Redirect based on role
      const roleRoutes = {
        student: '/student',
        teacher: '/teacher',
        parent: '/parent',
        admin: '/admin'
      };
      navigate(roleRoutes[data.user.role] || '/');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-200 rounded-full opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Header Section */}
          <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-r from-blue-600 to-blue-700">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Innovorex Logo */}
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <div className="text-2xl font-bold text-blue-600">
                  <svg viewBox="0 0 100 100" className="w-10 h-10">
                    <text x="50" y="55" textAnchor="middle" className="text-lg font-bold fill-blue-600">I</text>
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
              <p className="text-blue-100 text-sm">Login to Innovorex AI School Portal</p>
            </motion.div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username / Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter username or email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    required
                  />
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </motion.div>

              {/* Sign In Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In →'
                  )}
                </button>
              </motion.div>

              {/* Error Message */}
              {loginMutation.error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
                >
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    {(loginMutation.error as any)?.message || 'Login failed. Please try again.'}
                  </div>
                </motion.div>
              )}
            </form>

            {/* Secure Login Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-700 font-medium">Secure Login</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use your assigned credentials to access the portal
              </p>
            </motion.div>
          </div>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="px-8 py-6 bg-blue-50 border-t border-blue-100"
          >
            <h4 className="text-sm font-semibold text-blue-800 mb-3 text-center">Demo Credentials</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-700 mb-1">Student</div>
                <div className="text-gray-600">student@demo.com</div>
                <div className="text-gray-600">password123</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-700 mb-1">Teacher</div>
                <div className="text-gray-600">teacher@demo.com</div>
                <div className="text-gray-600">password123</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-700 mb-1">Parent</div>
                <div className="text-gray-600">parent@demo.com</div>
                <div className="text-gray-600">password123</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-700 mb-1">Admin</div>
                <div className="text-gray-600">admin@demo.com</div>
                <div className="text-gray-600">password123</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500">
            © 2025 Innovorex Business Solutions. All rights reserved.
          </p>
          <div className="mt-2">
            <Link
              to="/auth/register"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              New to the platform? Create an account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;