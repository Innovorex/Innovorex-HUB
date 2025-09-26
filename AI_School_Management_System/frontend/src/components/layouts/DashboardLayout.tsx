// components/layouts/DashboardLayout.tsx - ERPNext-style dashboard layout
import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  PowerIcon,
  UserCircleIcon,
  HomeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  navigation?: NavigationItem[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  actions?: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  navigation = [],
  activeTab,
  onTabChange,
  actions,
}) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  // Close mobile sidebar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && !(event.target as Element)?.closest('.mobile-sidebar')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Close dropdowns on mobile when orientation changes
  React.useEffect(() => {
    const handleOrientationChange = () => {
      setProfileDropdownOpen(false);
      setSidebarOpen(false);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="mobile-sidebar fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-300 shadow-lg z-50"
          >
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-2 py-2 border-b border-gray-200">
              <img
                src="/logo.jpg"
                alt=""
                className="h-32 w-32 object-contain"
              />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="mt-4 px-4">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange?.(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      {item.name}
                    </button>
                  );
                })}
              </div>

              {/* Mobile User Profile Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center px-3 py-2">
                  {user?.profile_image ? (
                    <img
                      className="h-10 w-10 rounded-full border border-gray-300"
                      src={user.profile_image}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                      <span className="text-gray-600 font-medium text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <UserCircleIcon className="h-5 w-5 mr-3 text-gray-500" />
                    My Profile
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-500" />
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md"
                  >
                    <PowerIcon className="h-5 w-5 mr-3 text-red-500" />
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          </motion.div>
        </div>
      )}

      {/* ERPNext-style Header */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-40 shadow-sm">
        <div className="px-3 sm:px-4">
          <div className="flex justify-between items-center h-14">
            {/* Left side - ERPNext style navbar */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 lg:hidden touch-manipulation"
                aria-label="Open navigation menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {/* Logo and welcome message */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src="/logo.jpg"
                    alt=""
                    className="h-7 w-7 object-contain"
                  />
                </div>

                {/* Welcome Message */}
                <div className="hidden sm:block">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Welcome, {user?.name || 'User'}</span>
                    <span className="text-gray-500 ml-2">• Role: {
                      user?.role === 'admin' ? 'Administrator' :
                      user?.role === 'teacher' ? 'Instructor' :
                      user?.role === 'student' ? 'Student' :
                      user?.role === 'parent' ? 'Parent' :
                      user?.role || 'User'
                    }</span>
                  </div>
                </div>

                {/* Breadcrumb navigation */}
                <nav className="flex items-center space-x-1 text-sm">
                  <button className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <HomeIcon className="h-4 w-4 mr-1" />
                    <span>Home</span>
                  </button>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-900 font-medium">{title}</span>
                </nav>
              </div>
            </div>

            {/* Right side - ERPNext style toolbar */}
            <div className="flex items-center space-x-2">
              {/* Actions */}
              {actions}

              {/* ERPNext-style notifications */}
              <button className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors">
                <BellIcon className="h-5 w-5" />
              </button>

              {/* ERPNext-style profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center p-1 text-sm rounded hover:bg-gray-100 transition-colors"
                >
                  {user?.profile_image ? (
                    <img
                      className="h-7 w-7 rounded-full border border-gray-300"
                      src={user.profile_image}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-7 w-7 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                      <span className="text-gray-600 font-medium text-xs">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="ml-2 text-gray-700 hidden sm:block text-sm">{user?.name}</span>
                  <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-500" />
                </button>

                {/* ERPNext-style profile dropdown menu */}
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-1 w-56 bg-white rounded border border-gray-300 shadow-lg py-1 z-50"
                  >
                    <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                      <p className="text-xs text-blue-700 capitalize font-medium">{user?.role}</p>
                    </div>

                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center">
                      <UserCircleIcon className="h-4 w-4 mr-2 text-gray-500" />
                      My Profile
                    </button>

                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center">
                      <Cog6ToothIcon className="h-4 w-4 mr-2 text-gray-500" />
                      User Settings
                    </button>

                    <div className="border-t border-gray-200 mt-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 flex items-center"
                      >
                        <PowerIcon className="h-4 w-4 mr-2 text-gray-500" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ERPNext-style page header with subtitle */}
      {subtitle && (
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            </div>
            {actions && (
              <div className="hidden sm:block">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ERPNext-style navigation tabs (if provided) */}
      {navigation.length > 0 && (
        <div className="bg-white border-b border-gray-300">
          {/* Desktop Navigation */}
          <div className="hidden lg:block px-3 sm:px-4">
            <nav className="flex space-x-6">
              {navigation.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange?.(item.id)}
                    className={`
                      flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors
                      ${isActive
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Navigation - Horizontal Scroll */}
          <div className="lg:hidden px-3">
            <nav className="flex space-x-1 overflow-x-auto scrollbar-hide py-2">
              {navigation.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange?.(item.id)}
                    className={`
                      flex items-center px-4 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap touch-manipulation
                      ${isActive
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ERPNext-style main content */}
      <main className="flex-1">
        <div className="px-3 sm:px-4 py-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;