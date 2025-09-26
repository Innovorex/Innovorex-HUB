// components/ai/AIAgent.tsx - Intelligent AI Agent with action capabilities
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  UserPlusIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ACTION_REGISTRY, getActionsForContext } from '../../services/ActionRegistry';
import type { ActionDefinition as ActionDef, FieldDefinition as FieldDef } from '../../services/ActionRegistry';

// Context detection types
interface PageContext {
  route: string;
  module: string;
  availableActions: ActionDef[];
  currentData?: any;
}

// Use imported types from ActionRegistry
type ActionDefinition = ActionDef;
type FieldDefinition = FieldDef;

// AI Permissions based on user role
const AI_PERMISSIONS = {
  admin: {
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canView: true,
    allowedActions: ['all']
  },
  teacher: {
    canCreate: false,  // NO creating courses, programs, users
    canUpdate: false,  // NO updating system data
    canDelete: false,  // NO deleting anything
    canView: true,     // YES viewing/searching
    allowedActions: [
      'search',
      'view',
      'explain',
      'report',
      'attendance',  // Can mark attendance
      'grading'      // Can enter grades
    ]
  },
  student: {
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canView: true,
    allowedActions: ['search', 'view', 'explain']
  },
  parent: {
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canView: true,
    allowedActions: ['search', 'view', 'explain']
  }
};

// Message types
interface Message {
  id: string;
  type: 'user' | 'ai' | 'action' | 'form' | 'confirmation';
  content: string;
  timestamp: Date;
  metadata?: {
    action?: string;
    fields?: Record<string, any>;
    status?: 'pending' | 'collecting' | 'executing' | 'success' | 'error';
    missingFields?: string[];
  };
}

interface AIAgentProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  width?: 'small' | 'medium' | 'large';
}

const AIAgent: React.FC<AIAgentProps> = ({
  isOpen,
  onClose,
  position = 'right',
  width = 'medium'
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userPermissions = AI_PERMISSIONS[user?.role as keyof typeof AI_PERMISSIONS] || AI_PERMISSIONS.student;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<PageContext | null>(null);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Width mapping
  const widthClasses = {
    small: 'w-96',
    medium: 'w-1/2',
    large: 'w-2/3'
  };

  // Use comprehensive action registry

  // Detect context based on current route
  useEffect(() => {
    const detectContext = () => {
      const path = location.pathname;
      let module = 'other';

      // Detect module from path - covers all portal sections
      if (path.includes('/users')) module = 'users';
      else if (path.includes('/program-enrollment')) module = 'programs';
      else if (path.includes('/programs')) module = 'programs';
      else if (path.includes('/course-enrollment')) module = 'courses';
      else if (path.includes('/courses')) module = 'courses';
      else if (path.includes('/student-groups')) module = 'student-management';
      else if (path.includes('/student-admission')) module = 'student-management';
      else if (path.includes('/student-applicant')) module = 'student-management';
      else if (path.includes('/student-batch')) module = 'student-management';
      else if (path.includes('/student-category')) module = 'student-management';
      else if (path.includes('/student-log')) module = 'student-management';
      else if (path.includes('/guardian')) module = 'student-management';
      else if (path.includes('/students')) module = 'student-management';
      else if (path.includes('/instructor-attendance')) module = 'instructor-management';
      else if (path.includes('/instructor-payroll')) module = 'instructor-management';
      else if (path.includes('/instructor')) module = 'instructor-management';
      else if (path.includes('/student-attendance')) module = 'attendance';
      else if (path.includes('/student-leave-application')) module = 'attendance';
      else if (path.includes('/attendance')) module = 'attendance';
      else if (path.includes('/assessment')) module = 'assessment';
      else if (path.includes('/grades')) module = 'assessment';
      else if (path.includes('/report-card')) module = 'assessment';
      else if (path.includes('/fee-category')) module = 'fees';
      else if (path.includes('/fee-structure')) module = 'fees';
      else if (path.includes('/fee-schedule')) module = 'fees';
      else if (path.includes('/sales-invoice')) module = 'fees';
      else if (path.includes('/payment-entry')) module = 'fees';
      else if (path.includes('/fees')) module = 'fees';
      else if (path.includes('/academic-year')) module = 'academic-settings';
      else if (path.includes('/academic-term')) module = 'academic-settings';
      else if (path.includes('/room')) module = 'academic-settings';
      else if (path.includes('/knowledge-base')) module = 'knowledge-base';
      else if (path.includes('/dashboard')) module = 'dashboard';

      // Get actions for this module using the registry
      let availableActions = getActionsForContext(module);

      // Filter actions based on user permissions
      if (user?.role === 'teacher') {
        availableActions = availableActions.filter(action => {
          // Allow only GET (view) actions and specific allowed actions
          if (action.method === 'GET') return true;

          // Allow attendance and grading actions
          if (action.id.includes('attendance') || action.id.includes('grade')) return true;

          // Block all create, update, delete actions
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(action.method)) return false;

          return false;
        });
      }

      setContext({
        route: path,
        module,
        availableActions,
        currentData: null
      });
    };

    detectContext();
  }, [location]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && context) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: getContextualWelcome(),
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [context]);

  // Get contextual welcome message
  const getContextualWelcome = () => {
    if (!context) return "Hello! I'm your AI assistant. How can I help you today?";

    const moduleMessages: Record<string, string> = {
      users: "I'm ready to help you manage users. You can ask me to:\n• Add a new student, teacher, or parent\n• Update user information\n• Delete users\n• Search for users\n\nFor example: 'Add Cherry Makkuba as a student in 9th grade'",

      programs: "I can help you manage academic programs. Try asking:\n• Create a new program\n• Enroll students in programs\n• Update program details\n\nFor example: 'Create a Computer Science program for 4 years'",

      courses: "I'll assist you with course management. I can:\n• Create new courses\n• Assign instructors to courses\n• Enroll students in courses\n• Create course schedules\n\nFor example: 'Add Mathematics course with code MATH101'",

      'student-management': "I'm here to help manage students. You can:\n• Create new student records\n• Create student groups/sections\n• Add guardian information\n• Manage student batches\n\nFor example: 'Create a new student John Doe'",

      'instructor-management': "I can help manage instructors. Available actions:\n• Add new instructors\n• Assign courses to instructors\n• Update instructor information\n\nFor example: 'Add Dr. Smith as a Professor in Computer Science'",

      attendance: "I'll help you manage attendance. You can:\n• Mark student attendance\n• Submit leave applications\n• Bulk mark attendance\n• Generate attendance reports\n\nFor example: 'Mark John present for today'",

      assessment: "I can assist with assessments. Try:\n• Create new assessments/exams\n• Submit student grades\n• Generate report cards\n\nFor example: 'Create a midterm exam for Mathematics'",

      fees: "I'll help you manage fees. Available actions:\n• Create fee structures\n• Set up payment schedules\n• Record payments\n• Generate invoices\n\nFor example: 'Create tuition fee structure for Computer Science'",

      'academic-settings': "I can help configure academic settings:\n• Create academic years\n• Set up academic terms/semesters\n• Add classrooms/labs\n\nFor example: 'Create academic year 2024-2025'",

      dashboard: "Welcome to your dashboard! I can help you:\n• Generate various reports\n• Navigate to different modules\n• Perform quick actions\n\nJust tell me what you need!",

      'knowledge-base': "I can help you manage educational content:\n• Upload course materials\n• Search documents\n• Answer questions about courses\n\nFor example: 'Upload chemistry notes for grade 10'",

      other: "I'm your AI assistant. I can help you with various tasks across the portal. What would you like to do?"
    };

    return moduleMessages[context.module] || moduleMessages.other;
  };

  // Parse user intent and extract action
  const parseIntentMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.post('/ai/parse-intent', {
        message,
        context: {
          module: context?.module,
          availableActions: context?.availableActions?.map(a => ({
            id: a.id,
            name: a.name,
            requiredFields: a.requiredFields.map(f => f.name)
          }))
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      handleParsedIntent(data);
    },
    onError: (error) => {
      console.error('Intent parsing error:', error);
      // Fallback to local parsing
      handleLocalIntentParsing(inputMessage);
    }
  });

  // Handle parsed intent from AI
  const handleParsedIntent = (intentData: any) => {
    const { action, entities, missingFields, confidence } = intentData;

    if (confidence < 0.5) {
      const clarificationMessage: Message = {
        id: Date.now().toString() + '_clarify',
        type: 'ai',
        content: "I'm not sure I understood that correctly. Could you please rephrase or be more specific?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, clarificationMessage]);
      setIsTyping(false);
      return;
    }

    if (action) {
      const actionDef = context?.availableActions.find(a => a.id === action);
      if (actionDef) {
        setPendingAction(actionDef);
        setFormData(entities || {});

        if (missingFields && missingFields.length > 0) {
          requestMissingFields(actionDef, entities, missingFields);
        } else {
          confirmAction(actionDef, entities);
        }
      }
    } else {
      // No specific action, provide general response
      handleGeneralQuery(inputMessage);
    }
  };

  // Local intent parsing fallback
  const handleLocalIntentParsing = (message: string) => {
    const lowerMessage = message.toLowerCase();

    // Get available actions for current context
    const availableActions = context?.availableActions || [];

    // Common action keywords
    const actionKeywords = {
      create: ['create', 'add', 'new', 'register', 'setup', 'establish'],
      update: ['update', 'edit', 'modify', 'change'],
      delete: ['delete', 'remove', 'cancel'],
      search: ['search', 'find', 'lookup', 'get'],
      assign: ['assign', 'allocate'],
      mark: ['mark', 'record'],
      generate: ['generate', 'create report', 'export']
    };

    // Try to match action from available actions
    for (const action of availableActions) {
      const actionName = action.name.toLowerCase();
      const actionWords = actionName.split(' ');

      // Check if message contains action keywords
      let matches = false;
      for (const [type, keywords] of Object.entries(actionKeywords)) {
        for (const keyword of keywords) {
          if (lowerMessage.includes(keyword) && actionWords.some(word => lowerMessage.includes(word))) {
            matches = true;
            break;
          }
        }
      }

      if (matches) {
        // Extract data based on action fields
        const extractedData: Record<string, any> = {};

        // Extract common patterns
        const nameMatch = message.match(/(?:add|create|register)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
        if (nameMatch) {
          // Try to map to appropriate field names
          if (action.requiredFields.some(f => f.name === 'fullName')) {
            extractedData.fullName = nameMatch[1];
          } else if (action.requiredFields.some(f => f.name === 'student_name')) {
            extractedData.student_name = nameMatch[1];
          } else if (action.requiredFields.some(f => f.name === 'program_name')) {
            extractedData.program_name = nameMatch[1];
          } else if (action.requiredFields.some(f => f.name === 'course_name')) {
            extractedData.course_name = nameMatch[1];
          }
        }

        // Extract numbers
        const numberMatch = message.match(/(\d+)/);
        if (numberMatch) {
          if (lowerMessage.includes('grade') || lowerMessage.includes('class')) {
            extractedData.grade = numberMatch[1];
          } else if (lowerMessage.includes('year')) {
            extractedData.duration = numberMatch[1];
          } else if (lowerMessage.includes('credit')) {
            extractedData.credits = numberMatch[1];
          }
        }

        // Extract dates
        const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateFields = action.requiredFields.filter(f => f.type === 'date');
          if (dateFields.length > 0) {
            extractedData[dateFields[0].name] = dateMatch[1];
          }
        }

        setPendingAction(action);
        setFormData(extractedData);

        const missingFields = action.requiredFields
          .filter(field => !extractedData[field.name])
          .map(field => field.name);

        if (missingFields.length > 0) {
          requestMissingFields(action, extractedData, missingFields);
        } else {
          confirmAction(action, extractedData);
        }
        setIsTyping(false);
        return;
      }
    }

    // If no specific action matched, handle as general query
    handleGeneralQuery(message);
    setIsTyping(false);
  };

  // Request missing fields from user
  const requestMissingFields = (action: ActionDefinition, currentData: any, missingFields: string[]) => {
    const fields = action.requiredFields.filter(f => missingFields.includes(f.name));

    const requestMessage: Message = {
      id: Date.now().toString() + '_request',
      type: 'form',
      content: `I need a few more details to ${action.name.toLowerCase()}:`,
      timestamp: new Date(),
      metadata: {
        action: action.id,
        fields: currentData,
        status: 'collecting',
        missingFields: missingFields
      }
    };

    setMessages(prev => [...prev, requestMessage]);
    setIsTyping(false);
  };

  // Confirm action before execution
  const confirmAction = (action: ActionDefinition, data: any) => {
    const confirmMessage: Message = {
      id: Date.now().toString() + '_confirm',
      type: 'confirmation',
      content: `I'm ready to ${action.name.toLowerCase()} with the following details:\n\n${
        Object.entries(data).map(([key, value]) => `• ${key}: ${value}`).join('\n')
      }\n\nShall I proceed?`,
      timestamp: new Date(),
      metadata: {
        action: action.id,
        fields: data,
        status: 'pending'
      }
    };

    setMessages(prev => [...prev, confirmMessage]);
    setIsTyping(false);
  };

  // Execute action with permission check
  const executeAction = async (action: ActionDefinition, data: any) => {
    // Check permissions based on action type
    const actionType = action.method.toUpperCase();

    if (actionType === 'POST' && !userPermissions.canCreate) {
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: `❌ Permission Denied: As a ${user?.role}, you cannot create new records. Please contact an administrator for assistance.`,
        timestamp: new Date(),
        metadata: { status: 'error' }
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Permission denied: Cannot create records');
      return;
    }

    if (actionType === 'DELETE' && !userPermissions.canDelete) {
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: `❌ Permission Denied: As a ${user?.role}, you cannot delete records. Please contact an administrator for assistance.`,
        timestamp: new Date(),
        metadata: { status: 'error' }
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Permission denied: Cannot delete records');
      return;
    }

    if ((actionType === 'PUT' || actionType === 'PATCH') && !userPermissions.canUpdate) {
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: `❌ Permission Denied: As a ${user?.role}, you cannot update records. Please contact an administrator for assistance.`,
        timestamp: new Date(),
        metadata: { status: 'error' }
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Permission denied: Cannot update records');
      return;
    }

    setIsTyping(true);

    try {
      // Replace placeholders in the endpoint with actual values
      let endpoint = action.apiEndpoint;
      if (endpoint.includes('{')) {
        // Replace {userId} with actual userId from data
        if (endpoint.includes('{userId}') && data.userId) {
          endpoint = endpoint.replace('{userId}', encodeURIComponent(data.userId));
        }
        // Add more replacements as needed for other placeholders
        Object.keys(data).forEach(key => {
          const placeholder = `{${key}}`;
          if (endpoint.includes(placeholder)) {
            endpoint = endpoint.replace(placeholder, encodeURIComponent(data[key]));
          }
        });
      }

      // For DELETE requests, don't send body data if the parameters are in the URL
      let response;
      if (action.method === 'DELETE' && !endpoint.includes('{')) {
        // URL parameters have been replaced, no need to send body
        response = await api[action.method.toLowerCase()](endpoint);
      } else if (action.method === 'GET') {
        // For GET requests, append data as query parameters
        const params = new URLSearchParams(data).toString();
        const finalEndpoint = params ? `${endpoint}?${params}` : endpoint;
        response = await api.get(finalEndpoint);
      } else {
        // For POST, PUT, etc., send data in body
        response = await api[action.method.toLowerCase()](endpoint, data);
      }

      const successMessage: Message = {
        id: Date.now().toString() + '_success',
        type: 'action',
        content: `✅ Successfully completed: ${action.name}\n\n${response.data.message || 'Operation completed successfully.'}`,
        timestamp: new Date(),
        metadata: {
          status: 'success'
        }
      };

      setMessages(prev => [...prev, successMessage]);
      toast.success(`${action.name} completed successfully!`);

      // Clear pending action and form data
      setPendingAction(null);
      setFormData({});

    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'action',
        content: `❌ Failed to ${action.name.toLowerCase()}: ${error.response?.data?.message || error.message}`,
        timestamp: new Date(),
        metadata: {
          status: 'error'
        }
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error(`Failed: ${error.response?.data?.message || error.message}`);
    }

    setIsTyping(false);
  };

  // Handle general queries
  const handleGeneralQuery = async (query: string) => {
    try {
      const response = await api.post('/kb/chat/message', {
        message: query,
        course_id: 'general',
        program_id: 'general',
        session_id: `agent-${Date.now()}`
      });

      const aiResponse: Message = {
        id: Date.now().toString() + '_general',
        type: 'ai',
        content: response.data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: Message = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: "I'm having trouble processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);
    }

    setIsTyping(false);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Check if responding to a form request
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'form' && lastMessage.metadata?.status === 'collecting') {
      // Process form response
      handleFormResponse(inputMessage.trim(), lastMessage.metadata);
    } else if (lastMessage?.type === 'confirmation' && inputMessage.toLowerCase().includes('yes')) {
      // Execute confirmed action
      const action = context?.availableActions.find(a => a.id === lastMessage.metadata?.action);
      if (action && lastMessage.metadata?.fields) {
        executeAction(action, lastMessage.metadata.fields);
      }
    } else {
      // Parse new intent
      parseIntentMutation.mutate(inputMessage.trim());
    }
  };

  // Handle form field responses
  const handleFormResponse = (response: string, metadata: any) => {
    // Parse response to extract field values
    // This is simplified - in production, use more sophisticated parsing
    const updatedData = { ...metadata.fields };

    // Simple extraction for missing fields
    if (metadata.missingFields?.includes('email') && response.includes('@')) {
      updatedData.email = response.match(/\S+@\S+\.\S+/)?.[0];
    }

    // Add more field extraction logic as needed

    setFormData(updatedData);

    // Check if all required fields are now present
    const action = context?.availableActions.find(a => a.id === metadata.action);
    if (action) {
      const stillMissing = action.requiredFields
        .filter(field => field.required && !updatedData[field.name])
        .map(field => field.name);

      if (stillMissing.length === 0) {
        confirmAction(action, updatedData);
      } else {
        requestMissingFields(action, updatedData, stillMissing);
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Quick action buttons based on context
  const getQuickActions = () => {
    if (!context?.availableActions || context.availableActions.length === 0) {
      return [];
    }

    return context.availableActions.slice(0, 3).map(action => ({
      text: action.name,
      icon: action.icon,
      onClick: () => {
        setInputMessage(`${action.name}`);
        inputRef.current?.focus();
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: position === 'right' ? '100%' : '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: position === 'right' ? '100%' : '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`fixed inset-y-0 ${position}-0 ${widthClasses[width]} bg-white shadow-2xl z-50 flex flex-col`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Agent Assistant</h2>
            <p className="text-sm text-blue-100">
              {context?.module ? `Currently in: ${context.module}` : 'Ready to help'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close AI Agent"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Context Bar */}
      {context?.availableActions && context.availableActions.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center space-x-2">
            <InformationCircleIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              I can perform {context.availableActions.length} action{context.availableActions.length > 1 ? 's' : ''} on this page
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] px-4 py-3 rounded-2xl
                  ${message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : message.type === 'action'
                    ? message.metadata?.status === 'success'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                    : message.type === 'confirmation'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : message.type === 'form'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }
                `}
              >
                {/* Message icon for special types */}
                {message.type === 'action' && (
                  <div className="flex items-center mb-2">
                    {message.metadata?.status === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                    ) : message.metadata?.status === 'error' ? (
                      <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                    ) : (
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Form fields display */}
                {message.type === 'form' && message.metadata?.missingFields && (
                  <div className="mt-3 space-y-2">
                    {pendingAction?.requiredFields
                      .filter(f => message.metadata?.missingFields?.includes(f.name))
                      .map(field => (
                        <div key={field.name} className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{field.label}:</span>
                          {field.type === 'select' ? (
                            <select
                              className="flex-1 px-2 py-1 bg-white border border-purple-300 rounded text-sm"
                              onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                            >
                              <option value="">Select...</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              className="flex-1 px-2 py-1 bg-white border border-purple-300 rounded text-sm"
                              onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                            />
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* Confirmation buttons */}
                {message.type === 'confirmation' && message.metadata?.status === 'pending' && (
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        const action = context?.availableActions.find(a => a.id === message.metadata?.action);
                        if (action && message.metadata?.fields) {
                          executeAction(action, message.metadata.fields);
                        }
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Yes, proceed
                    </button>
                    <button
                      onClick={() => {
                        setPendingAction(null);
                        setFormData({});
                        const cancelMessage: Message = {
                          id: Date.now().toString() + '_cancel',
                          type: 'ai',
                          content: 'Action cancelled. How else can I help you?',
                          timestamp: new Date(),
                        };
                        setMessages(prev => [...prev, cancelMessage]);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm border border-gray-200 px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && getQuickActions().length > 0 && (
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {getQuickActions().map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="flex items-center px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              pendingAction
                ? "Type your response or 'cancel' to abort..."
                : "Type a command or ask a question..."
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Context hint */}
        <div className="mt-2 text-xs text-gray-500">
          {context?.module === 'users' && "Try: 'Add John Doe as a student in 10th grade'"}
          {context?.module === 'programs' && "Try: 'Create a new Computer Science program'"}
          {context?.module === 'courses' && "Try: 'Add a Mathematics course with code MATH101'"}
          {(!context?.module || context.module === 'other') && "I can help you navigate and perform tasks. Just ask!"}
        </div>
      </div>
    </motion.div>
  );
};

export default AIAgent;