// main.tsx - Application entry point with mobile optimizations
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/mobile.css';

// Prevent mobile zoom on form inputs globally
const preventZoom = () => {
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    );
  }
};

// Mobile-specific initialization
const initMobileOptimizations = () => {
  // Prevent zoom on form inputs
  preventZoom();

  // Add touch-friendly classes to body
  document.body.classList.add('mobile-tap-highlight');

  // Handle iOS safe areas
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.body.classList.add('safe-area-padding');
  }

  // Prevent pull-to-refresh on mobile
  document.body.style.overscrollBehavior = 'none';

  // Optimize for mobile keyboards
  if ('visualViewport' in window) {
    const viewport = window.visualViewport;
    const handleViewportChange = () => {
      if (viewport && viewport.height < window.innerHeight * 0.75) {
        document.body.classList.add('mobile-keyboard-padding');
      } else {
        document.body.classList.remove('mobile-keyboard-padding');
      }
    };

    viewport?.addEventListener('resize', handleViewportChange);
  }
};

// Initialize mobile optimizations
initMobileOptimizations();

// Create root and render app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);