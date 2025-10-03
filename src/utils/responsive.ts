/**
 * Responsive utility functions and constants
 * Provides helper functions for responsive design patterns
 */

export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;
export const DESKTOP_BREAKPOINT = 1280;

// Device-specific viewport widths (in portrait mode)
export const DEVICE_WIDTHS = {
  'iphone-se': 375,
  'iphone-12': 390,
  'iphone-14-pro': 393,
  'iphone-14-pro-max': 430,
  'pixel-6': 412,
  'pixel-6-pro': 428,
  'samsung-s21': 384,
  'samsung-s22-ultra': 428,
  'ipad-mini': 768,
  'ipad': 820,
  'ipad-pro': 1024,
} as const;

// CSS classes for responsive design patterns
export const RESPONSIVE_CLASSES = {
  // Container classes
  mobileContainer: 'w-full max-w-mobile px-4 mx-auto',
  tabletContainer: 'w-full max-w-4xl px-6 mx-auto',
  desktopContainer: 'w-full max-w-7xl px-8 mx-auto',
  
  // Grid layouts
  mobileGrid: 'grid grid-cols-1 gap-4',
  tabletGrid: 'grid grid-cols-2 lg:grid-cols-3 gap-6',
  desktopGrid: 'grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8',
  
  // Flex layouts
  mobileFlex: 'flex flex-col space-y-4',
  tabletFlex: 'flex flex-col lg:flex-row lg:space-x-6 lg:space-y-0 space-y-4',
  desktopFlex: 'flex flex-row space-x-8',
  
  // Text sizes
  mobileText: 'text-sm-mobile',
  tabletText: 'text-base',
  desktopText: 'text-lg',
  
  // Button sizes
  mobileButton: 'px-4 py-2 text-sm-mobile',
  tabletButton: 'px-6 py-3 text-base',
  desktopButton: 'px-8 py-4 text-lg',
  
  // Spacing
  mobilePadding: 'p-4',
  tabletPadding: 'p-6',
  desktopPadding: 'p-8',
  
  // Heights
  mobileHeight: 'min-h-mobile-screen',
  tabletHeight: 'min-h-screen',
  desktopHeight: 'min-h-screen',
} as const;

/**
 * Generate responsive class string based on device type
 */
export const getResponsiveClasses = (
  mobile: string,
  tablet?: string,
  desktop?: string
): string => {
  const classes = [mobile];
  
  if (tablet) {
    classes.push(`tablet:${tablet}`);
  }
  
  if (desktop) {
    classes.push(`desktop:${desktop}`);
  }
  
  return classes.join(' ');
};

/**
 * Get container classes based on content type
 */
export const getContainerClasses = (contentType: 'narrow' | 'wide' | 'full' = 'wide'): string => {
  const baseClasses = 'w-full mx-auto px-4 sm-phone:px-6';
  
  switch (contentType) {
    case 'narrow':
      return `${baseClasses} max-w-2xl`;
    case 'wide':
      return `${baseClasses} max-w-7xl`;
    case 'full':
      return 'w-full px-4 sm-phone:px-6';
    default:
      return `${baseClasses} max-w-7xl`;
  }
};

/**
 * Get grid classes for responsive layouts
 */
export const getGridClasses = (
  mobileColumns: number = 1,
  tabletColumns: number = 2,
  desktopColumns: number = 3
): string => {
  return [
    'grid gap-4',
    `grid-cols-${mobileColumns}`,
    `tablet:grid-cols-${tabletColumns}`,
    `desktop:grid-cols-${desktopColumns}`,
    'tablet:gap-6',
    'desktop:gap-8'
  ].join(' ');
};

/**
 * Get button classes for responsive design
 */
export const getButtonClasses = (
  variant: 'primary' | 'secondary' | 'outline' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): string => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size classes (responsive)
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs-mobile tablet:text-sm tablet:px-4',
    md: 'px-4 py-2 text-sm-mobile tablet:px-6 tablet:py-3 tablet:text-base',
    lg: 'px-6 py-3 text-base-mobile tablet:px-8 tablet:py-4 tablet:text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  };
  
  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
};

/**
 * Get card classes for responsive design
 */
export const getCardClasses = (elevated: boolean = true): string => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200';
  const shadowClasses = elevated 
    ? 'shadow-sm hover:shadow-md transition-shadow' 
    : '';
  const paddingClasses = 'p-4 tablet:p-6';
  
  return `${baseClasses} ${shadowClasses} ${paddingClasses}`;
};

/**
 * Check if current viewport matches mobile breakpoint
 */
export const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

/**
 * Check if current viewport matches tablet breakpoint
 */
export const isTabletViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < DESKTOP_BREAKPOINT;
};

/**
 * Check if current viewport matches desktop breakpoint
 */
export const isDesktopViewport = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= DESKTOP_BREAKPOINT;
};

/**
 * Get safe area classes for devices with notches/dynamic islands
 */
export const getSafeAreaClasses = (): string => {
  return 'pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right';
};

/**
 * Get navigation classes for mobile/desktop differences
 */
export const getNavigationClasses = (isMobile: boolean): string => {
  if (isMobile) {
    return 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50';
  }
  return 'sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-40';
};