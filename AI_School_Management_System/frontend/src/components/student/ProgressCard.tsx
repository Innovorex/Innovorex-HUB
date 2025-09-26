// components/student/ProgressCard.tsx - Beautiful subject progress visualization
import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

interface ProgressCardProps {
  subject: string;
  understanding: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  color: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  subject,
  understanding,
  trend,
  color,
}) => {
  // Subject emoji mapping for school vibe
  const subjectEmojis: { [key: string]: string } = {
    'Mathematics': '📐',
    'Math': '📐',
    'English': '📚',
    'English Language Arts': '📚',
    'Science': '🔬',
    'Chemistry': '⚗️',
    'Physics': '⚛️',
    'Biology': '🧬',
    'History': '📜',
    'Social Studies': '🌍',
    'Geography': '🗺️',
    'Art': '🎨',
    'Music': '🎵',
    'Physical Education': '⚽',
    'PE': '⚽',
    'Computer Science': '💻',
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'default': '📖'
  };

  const getSubjectEmoji = (subjectName: string): string => {
    return subjectEmojis[subjectName] || subjectEmojis.default;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'up':
        return 'Improving! 📈';
      case 'down':
        return 'Needs Focus 📉';
      default:
        return 'Steady Progress';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getUnderstandingLevel = () => {
    if (understanding >= 90) return { text: 'Excellent! 🌟', color: 'text-green-600' };
    if (understanding >= 80) return { text: 'Great! 👍', color: 'text-blue-600' };
    if (understanding >= 70) return { text: 'Good 👌', color: 'text-purple-600' };
    if (understanding >= 60) return { text: 'Getting There 💪', color: 'text-orange-600' };
    return { text: 'Keep Trying! 🎯', color: 'text-red-600' };
  };

  const level = getUnderstandingLevel();

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{getSubjectEmoji(subject)}</span>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">{subject}</h4>
            <div className={`text-xs ${level.color} font-medium`}>
              {level.text}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {understanding}%
          </div>
          <div className={`text-xs flex items-center ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">{getTrendText()}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${understanding}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-2 rounded-full relative overflow-hidden"
            style={{ backgroundColor: color }}
          >
            {/* Animated shine effect */}
            <motion.div
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>

        {/* Progress milestones */}
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Encouraging message based on performance */}
      <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
        {understanding >= 90 && "🎉 You're mastering this subject! Keep it up!"}
        {understanding >= 80 && understanding < 90 && "🚀 You're doing great! Almost there!"}
        {understanding >= 70 && understanding < 80 && "📚 Good progress! Keep studying!"}
        {understanding >= 60 && understanding < 70 && "💪 You're improving! Don't give up!"}
        {understanding < 60 && "🎯 Every expert was once a beginner. You've got this!"}
      </div>
    </motion.div>
  );
};

export default ProgressCard;