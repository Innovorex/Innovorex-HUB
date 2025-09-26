// vite.config.ts - Vite configuration optimized for 4GB RAM deployment
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true
    })
  ],

  // Development server configuration
  server: {
    host: '0.0.0.0',
    port: 7000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // Build optimization for resource constraints
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps to save space

    // Optimize chunks for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for stable dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI chunk for UI components
          ui: ['@heroicons/react', 'framer-motion'],
          // Data chunk for data fetching
          data: ['@tanstack/react-query', 'axios'],
        },
        // Optimize asset naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },

    // Performance optimizations
    chunkSizeWarningLimit: 1000, // 1MB chunks

    // Use terser for production minification
    minify: process.env.NODE_ENV === 'production' ? 'terser' : 'esbuild',
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
    }
  },

  // CSS optimization
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },

  // Dependency optimization - Pre-bundle heavy dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'react-hot-toast',
      'framer-motion',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid'
    ],
    exclude: ['@tanstack/react-query-devtools']
  },

  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },

  // Enable esbuild for faster builds
  esbuild: {
    // Remove console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Enable JSX automatic runtime
    jsx: 'automatic',
  },

  // Preview server configuration
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  }
});