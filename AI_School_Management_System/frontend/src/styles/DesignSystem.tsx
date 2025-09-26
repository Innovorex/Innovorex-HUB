// Design System for AI-Enabled School Management System
// Clean, friendly, and educational-themed design

export const colors = {
  // Primary School Colors
  primary: {
    main: '#4A90E2',      // Friendly blue
    light: '#7BB3F0',     // Light blue
    dark: '#2E5C8A',      // Navy blue
    50: '#F0F7FF',        // Very light blue
    100: '#E1EFFF',       // Light blue background
    200: '#C3DFFF',       // Soft blue
  },

  // Educational Subject Colors
  subjects: {
    math: '#FF6B6B',       // Warm red
    science: '#4ECDC4',    // Teal
    english: '#45B7D1',    // Sky blue
    history: '#96CEB4',    // Sage green
    art: '#FECA57',        // Golden yellow
    default: '#9B9B9B',    // Neutral gray
  },

  // Semantic Colors
  success: '#27AE60',      // Green
  warning: '#F39C12',      // Orange
  error: '#E74C3C',        // Red
  info: '#3498DB',         // Blue

  // Neutral Colors
  gray: {
    50: '#F8F9FA',
    100: '#F1F3F4',
    200: '#E8EAED',
    300: '#DADCE0',
    400: '#BDC1C6',
    500: '#9AA0A6',
    600: '#80868B',
    700: '#5F6368',
    800: '#3C4043',
    900: '#202124',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F0F7FF',
  },

  // AI-specific Colors
  ai: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    primary: '#667eea',
    secondary: '#764ba2',
  }
};

export const typography = {
  fontFamily: {
    primary: '"Inter", "Segoe UI", "Roboto", sans-serif',
    heading: '"Poppins", "Inter", sans-serif',
    mono: '"Fira Code", "Monaco", monospace',
  },

  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
  '5xl': '6rem',   // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

export const transitions = {
  default: 'all 0.2s ease-in-out',
  fast: 'all 0.1s ease-in-out',
  slow: 'all 0.3s ease-in-out',
};

// Component-specific styles
export const components = {
  card: {
    background: colors.background.primary,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.md,
    border: `1px solid ${colors.gray[200]}`,
    padding: spacing.xl,
    transition: transitions.default,

    hover: {
      boxShadow: shadows.lg,
      transform: 'translateY(-2px)',
    }
  },

  button: {
    primary: {
      background: colors.primary.main,
      color: colors.background.primary,
      borderRadius: borderRadius.lg,
      padding: `${spacing.md} ${spacing.xl}`,
      fontWeight: typography.fontWeight.medium,
      transition: transitions.default,

      hover: {
        background: colors.primary.dark,
        transform: 'translateY(-1px)',
        boxShadow: shadows.md,
      }
    },

    secondary: {
      background: colors.background.primary,
      color: colors.primary.main,
      border: `2px solid ${colors.primary.main}`,
      borderRadius: borderRadius.lg,
      padding: `${spacing.md} ${spacing.xl}`,
      fontWeight: typography.fontWeight.medium,
      transition: transitions.default,

      hover: {
        background: colors.primary.main,
        color: colors.background.primary,
      }
    }
  },

  input: {
    borderRadius: borderRadius.lg,
    border: `2px solid ${colors.gray[300]}`,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: typography.fontSize.base,
    transition: transitions.default,

    focus: {
      border: `2px solid ${colors.primary.main}`,
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    }
  },

  dashboard: {
    sidebar: {
      background: colors.background.primary,
      borderRight: `1px solid ${colors.gray[200]}`,
      width: '280px',
    },

    header: {
      background: colors.background.primary,
      borderBottom: `1px solid ${colors.gray[200]}`,
      height: '80px',
      padding: `0 ${spacing['2xl']}`,
    },

    content: {
      background: colors.background.secondary,
      padding: spacing['2xl'],
      minHeight: 'calc(100vh - 80px)',
    }
  }
};

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Animation variants for Framer Motion
export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  },

  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 }
  },

  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  card: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    whileHover: { y: -2, transition: { duration: 0.2 } },
    transition: { duration: 0.3 }
  }
};