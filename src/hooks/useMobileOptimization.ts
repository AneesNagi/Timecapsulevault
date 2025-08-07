import { useState, useEffect } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';

export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Responsive grid columns
  const gridColumns = useBreakpointValue({
    base: 1,    // Mobile
    sm: 1,      // Small mobile
    md: 2,      // Tablet
    lg: 3,      // Desktop
    xl: 4       // Large desktop
  });

  // Responsive spacing
  const spacing = useBreakpointValue({
    base: 3,    // Mobile
    sm: 4,      // Small mobile
    md: 5,      // Tablet
    lg: 6,      // Desktop
    xl: 8       // Large desktop
  });

  // Responsive padding
  const padding = useBreakpointValue({
    base: 4,    // Mobile
    sm: 5,      // Small mobile
    md: 6,      // Tablet
    lg: 8,      // Desktop
    xl: 10      // Large desktop
  });

  // Responsive font sizes
  const fontSize = useBreakpointValue({
    base: 'sm',     // Mobile
    sm: 'md',       // Small mobile
    md: 'lg',       // Tablet
    lg: 'xl',       // Desktop
    xl: '2xl'       // Large desktop
  });

  // Responsive button sizes
  const buttonSize = useBreakpointValue({
    base: 'sm',     // Mobile
    sm: 'md',       // Small mobile
    md: 'md',       // Tablet
    lg: 'lg',       // Desktop
    xl: 'lg'        // Large desktop
  });

  // Touch-friendly spacing
  const touchSpacing = useBreakpointValue({
    base: 12,   // Mobile - larger for touch
    sm: 10,     // Small mobile
    md: 8,      // Tablet
    lg: 6,      // Desktop
    xl: 6       // Large desktop
  });

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
      
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const handleResize = () => {
      checkDeviceType();
    };

    const handleOrientationChange = () => {
      setTimeout(checkDeviceType, 100); // Small delay for orientation change
    };

    // Initial check
    checkDeviceType();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Touch detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouchDevice();
  }, []);

  // Performance optimization for mobile
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      // Check for low-end devices
      const memory = (navigator as any).deviceMemory;
      const cores = (navigator as any).hardwareConcurrency;
      
      if (memory && memory < 4) {
        setIsLowPerformance(true);
      } else if (cores && cores < 4) {
        setIsLowPerformance(true);
      } else {
        setIsLowPerformance(false);
      }
    };

    checkPerformance();
  }, []);

  return {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isLowPerformance,
    orientation,
    
    // Responsive values
    gridColumns,
    spacing,
    padding,
    fontSize,
    buttonSize,
    touchSpacing,
    
    // Utility functions
    getResponsiveValue: <T>(values: {
      mobile?: T;
      tablet?: T;
      desktop?: T;
      default?: T;
    }) => {
      if (isMobile && values.mobile !== undefined) return values.mobile;
      if (isTablet && values.tablet !== undefined) return values.tablet;
      if (isDesktop && values.desktop !== undefined) return values.desktop;
      return values.default;
    },
    
    // Mobile-specific optimizations
    shouldReduceAnimations: isLowPerformance || isMobile,
    shouldUseCompactLayout: isMobile && orientation === 'portrait',
    shouldUseTouchOptimized: isTouchDevice,
  };
}; 