/**
 * Responsive utilities hook for mobile-first responsive design
 * Provides viewport information and device-specific breakpoint detection
 */

import { useState, useEffect } from 'react';

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  specificDevice: DeviceType | null;
}

type DeviceType = 
  | 'iphone-se' 
  | 'iphone-12' 
  | 'iphone-14-pro' 
  | 'iphone-14-pro-max'
  | 'pixel-6' 
  | 'pixel-6-pro' 
  | 'samsung-s21' 
  | 'samsung-s22-ultra'
  | 'generic-mobile'
  | 'generic-tablet';

const BREAKPOINTS = {
  xs: 320,
  'sm-phone': 375,
  'iphone-se': 375,
  'samsung-s21': 384,
  'iphone-12': 390,
  'iphone-14-pro': 393,
  'pixel-6': 412,
  phone: 414,
  'lg-phone': 428,
  'pixel-6-pro': 428,
  'samsung-s22-ultra': 428,
  'iphone-14-pro-max': 430,
  tablet: 768,
  'lg-tablet': 1024,
  desktop: 1280,
  'xl-desktop': 1536,
};

export const useResponsive = (): ViewportInfo => {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isPhone: false,
        isLandscape: false,
        isPortrait: true,
        deviceType: 'desktop',
        specificDevice: null,
      };
    }

    return getViewportInfo();
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportInfo(getViewportInfo());
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(() => {
        setViewportInfo(getViewportInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Initial measurement
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return viewportInfo;
};

function getViewportInfo(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;
  const isPortrait = height >= width;

  // Device type classification
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isPhone = width < BREAKPOINTS.phone;

  let deviceType: 'mobile' | 'tablet' | 'desktop';
  if (isMobile) deviceType = 'mobile';
  else if (isTablet) deviceType = 'tablet';
  else deviceType = 'desktop';

  // Specific device detection (for mobile only)
  let specificDevice: DeviceType | null = null;
  if (isMobile) {
    if (width <= BREAKPOINTS['iphone-se'] + 5 && width >= BREAKPOINTS['iphone-se'] - 5) {
      specificDevice = 'iphone-se';
    } else if (width <= BREAKPOINTS['samsung-s21'] + 5 && width >= BREAKPOINTS['samsung-s21'] - 5) {
      specificDevice = 'samsung-s21';
    } else if (width <= BREAKPOINTS['iphone-12'] + 5 && width >= BREAKPOINTS['iphone-12'] - 5) {
      specificDevice = 'iphone-12';
    } else if (width <= BREAKPOINTS['iphone-14-pro'] + 5 && width >= BREAKPOINTS['iphone-14-pro'] - 5) {
      specificDevice = 'iphone-14-pro';
    } else if (width <= BREAKPOINTS['pixel-6'] + 5 && width >= BREAKPOINTS['pixel-6'] - 5) {
      specificDevice = 'pixel-6';
    } else if (width <= BREAKPOINTS['pixel-6-pro'] + 5 && width >= BREAKPOINTS['pixel-6-pro'] - 5) {
      specificDevice = 'pixel-6-pro';
    } else if (width <= BREAKPOINTS['samsung-s22-ultra'] + 5 && width >= BREAKPOINTS['samsung-s22-ultra'] - 5) {
      specificDevice = 'samsung-s22-ultra';
    } else if (width <= BREAKPOINTS['iphone-14-pro-max'] + 5 && width >= BREAKPOINTS['iphone-14-pro-max'] - 5) {
      specificDevice = 'iphone-14-pro-max';
    } else {
      specificDevice = 'generic-mobile';
    }
  } else if (isTablet) {
    specificDevice = 'generic-tablet';
  }

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isPhone,
    isLandscape,
    isPortrait,
    deviceType,
    specificDevice,
  };
}

// Hook for checking specific breakpoints
export const useBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[breakpoint];
};

// Hook for responsive values based on breakpoints
export const useResponsiveValue = <T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  const { deviceType } = useResponsive();
  
  return values[deviceType] ?? values.default;
};