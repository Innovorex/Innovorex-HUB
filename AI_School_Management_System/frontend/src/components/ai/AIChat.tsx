// components/ai/AIChat.tsx - Interactive AI tutor chat interface
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    subject?: string;
    appropriateness?: 'appropriate' | 'needs_guidance' | 'inappropriate';
    confidence?: number;
  };
}

interface AIChatProps {
  studentId: string;
  onClose: () => void;
  initialContext?: {
    subject?: string;
    topic?: string;
    grade_level?: string;
  };
}

const AIChat: React.FC<AIChatProps> = ({ studentId, onClose, initialContext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history
  const { data: chatHistory } = useQuery({
    queryKey: ['ai-chat-history', studentId],
    queryFn: async () => {
      const response = await api.get(`/ai/history/${studentId}`);
      return response.data.messages || [];
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.post('/ai/chat', {
        student_id: studentId,
        message,
        context: initialContext,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Show guidance if needed
      if (data.metadata?.appropriateness === 'needs_guidance') {
        showGuidanceMessage();
      } else if (data.metadata?.appropriateness === 'inappropriate') {
        showWarningMessage();
      }

      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      setIsTyping(false);
    },
  });

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: `Hi there! 🎓 I'm your AI tutor, here to help you learn and understand concepts better.

I'm here to:
• Explain difficult concepts
• Help you understand your homework
• Provide study tips and strategies
• Answer questions about your subjects

Remember: I'll guide you to think through problems rather than giving direct answers. This helps you learn better!

What would you like to explore today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Load chat history when available
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0 && messages.length === 1) {
      setMessages(prev => [...prev, ...chatHistory]);
    }
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Send to AI
    sendMessageMutation.mutate(inputMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const showGuidanceMessage = () => {
    const guidanceMessage: Message = {
      id: Date.now().toString() + '_guidance',
      type: 'system',
      content: `💡 Remember: I'm here to help you understand and learn, not to do your work for you. Try thinking through the problem step by step!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, guidanceMessage]);
  };

  const showWarningMessage = () => {
    const warningMessage: Message = {
      id: Date.now().toString() + '_warning',
      type: 'system',
      content: `⚠️ I can't help with that type of request. Let's focus on learning and understanding concepts instead!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, warningMessage]);
  };

  // Quick suggestion buttons
  const quickSuggestions = [
    { text: "Explain this concept", icon: BookOpenIcon },
    { text: "Help me understand", icon: LightBulbIcon },
    { text: "Study tips", icon: SparklesIcon },
  ];

  return (
    <div className="flex flex-col h-80 sm:h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-blue-200 bg-white rounded-t-xl">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">AI Tutor</h3>
            <p className="text-xs text-gray-500">Here to help you learn! 🎓</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          aria-label="Close AI chat"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
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
                  max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl text-sm
                  ${message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : message.type === 'system'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                  }
                `}
              >
                {message.type === 'system' && (
                  <div className="flex items-center mb-1">
                    {message.content.includes('💡') && <LightBulbIcon className="h-4 w-4 mr-1" />}
                    {message.content.includes('⚠️') && <ExclamationTriangleIcon className="h-4 w-4 mr-1" />}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{message.content}</div>

                <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
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
            <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-200 px-4 py-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions (when no messages) */}
      {messages.length === 1 && (
        <div className="px-3 sm:px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion.text)}
                className="flex items-center px-3 py-1.5 bg-white text-gray-600 text-xs sm:text-sm rounded-full border border-gray-200 hover:bg-gray-50 transition-colors touch-manipulation"
              >
                <suggestion.icon className="h-3 w-3 mr-1" />
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-blue-200 bg-white rounded-b-xl">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your studies..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            className="p-2.5 sm:p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Academic integrity reminder */}
        <div className="mt-2 text-xs text-gray-500 flex items-start">
          <LightBulbIcon className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
          <span>I'm here to help you learn and understand, not to do your homework for you!</span>
        </div>
      </div>
    </div>
  );
};

export default AIChat;