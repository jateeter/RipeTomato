/**
 * Responsive Utilities Tests (Fixed)
 */

import {
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
  DESKTOP_BREAKPOINT,
  DEVICE_WIDTHS,
  RESPONSIVE_CLASSES,
  getResponsiveClasses,
  getContainerClasses,
  getGridClasses,
  getButtonClasses,
  getCardClasses,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
  getSafeAreaClasses,
  getNavigationClasses
} from '../responsive';

// Mock window object
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

describe('Responsive Utilities', () => {
  describe('Constants', () => {
    it('should define breakpoint constants', () => {
      expect(MOBILE_BREAKPOINT).toBe(768);
      expect(TABLET_BREAKPOINT).toBe(1024);
      expect(DESKTOP_BREAKPOINT).toBe(1280);
    });

    it('should define device widths', () => {
      expect(typeof DEVICE_WIDTHS).toBe('object');
      expect(DEVICE_WIDTHS['iphone-se']).toBe(375);
      expect(DEVICE_WIDTHS['ipad-mini']).toBe(768);
      expect(Object.keys(DEVICE_WIDTHS).length).toBeGreaterThan(0);
    });

    it('should define responsive classes', () => {
      expect(typeof RESPONSIVE_CLASSES).toBe('object');
      expect(RESPONSIVE_CLASSES.mobileContainer).toContain('w-full');
      expect(RESPONSIVE_CLASSES.tabletContainer).toContain('max-w-4xl');
      expect(RESPONSIVE_CLASSES.desktopContainer).toContain('max-w-7xl');
    });
  });

  describe('Viewport Detection', () => {
    it('should identify mobile viewport', () => {
      (window as any).innerWidth = 320;
      expect(isMobileViewport()).toBe(true);
      
      (window as any).innerWidth = 800;
      expect(isMobileViewport()).toBe(false);
    });

    it('should identify tablet viewport', () => {
      (window as any).innerWidth = 768;
      expect(isTabletViewport()).toBe(true);
      
      (window as any).innerWidth = 1200;
      expect(isTabletViewport()).toBe(true);
      
      (window as any).innerWidth = 600;
      expect(isTabletViewport()).toBe(false);
      
      (window as any).innerWidth = 1400;
      expect(isTabletViewport()).toBe(false);
    });

    it('should identify desktop viewport', () => {
      (window as any).innerWidth = 1280;
      expect(isDesktopViewport()).toBe(true);
      
      (window as any).innerWidth = 1400;
      expect(isDesktopViewport()).toBe(true);
      
      (window as any).innerWidth = 1000;
      expect(isDesktopViewport()).toBe(false);
    });

    it('should handle missing window object', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(isMobileViewport()).toBe(false);
      expect(isTabletViewport()).toBe(false);
      expect(isDesktopViewport()).toBe(true); // Default to desktop
      
      global.window = originalWindow;
    });
  });

  describe('Class Generators', () => {
    it('should generate responsive classes', () => {
      const classes = getResponsiveClasses('text-sm', 'text-base', 'text-lg');
      expect(classes).toContain('text-sm');
      expect(classes).toContain('tablet:text-base');
      expect(classes).toContain('desktop:text-lg');
    });

    it('should generate container classes', () => {
      expect(getContainerClasses('narrow')).toContain('max-w-2xl');
      expect(getContainerClasses('wide')).toContain('max-w-7xl');
      expect(getContainerClasses('full')).toContain('w-full');
    });

    it('should generate grid classes', () => {
      const gridClasses = getGridClasses(1, 2, 3);
      expect(gridClasses).toContain('grid');
      expect(gridClasses).toContain('grid-cols-1');
      expect(gridClasses).toContain('tablet:grid-cols-2');
      expect(gridClasses).toContain('desktop:grid-cols-3');
    });

    it('should generate button classes', () => {
      const primaryButton = getButtonClasses('primary', 'md');
      expect(primaryButton).toContain('bg-blue-600');
      expect(primaryButton).toContain('text-white');
      
      const secondaryButton = getButtonClasses('secondary', 'sm');
      expect(secondaryButton).toContain('bg-gray-600');
      
      const outlineButton = getButtonClasses('outline', 'lg');
      expect(outlineButton).toContain('border');
      expect(outlineButton).toContain('bg-white');
    });

    it('should generate card classes', () => {
      const elevatedCard = getCardClasses(true);
      expect(elevatedCard).toContain('bg-white');
      expect(elevatedCard).toContain('shadow-sm');
      
      const flatCard = getCardClasses(false);
      expect(flatCard).toContain('bg-white');
      expect(flatCard).not.toContain('shadow-sm');
    });

    it('should generate safe area classes', () => {
      const safeAreaClasses = getSafeAreaClasses();
      expect(safeAreaClasses).toContain('pt-safe-top');
      expect(safeAreaClasses).toContain('pb-safe-bottom');
    });

    it('should generate navigation classes', () => {
      const mobileNav = getNavigationClasses(true);
      expect(mobileNav).toContain('fixed');
      expect(mobileNav).toContain('bottom-0');
      
      const desktopNav = getNavigationClasses(false);
      expect(desktopNav).toContain('sticky');
      expect(desktopNav).toContain('top-0');
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle window resize events', () => {
      (window as any).innerWidth = 320;
      expect(isMobileViewport()).toBe(true);
      
      (window as any).innerWidth = 800;
      expect(isTabletViewport()).toBe(true);
      
      (window as any).innerWidth = 1400;
      expect(isDesktopViewport()).toBe(true);
    });

    it('should provide consistent breakpoint behavior', () => {
      const testWidths = [320, 640, 768, 1024, 1280, 1600];
      
      testWidths.forEach(width => {
        (window as any).innerWidth = width;
        
        const mobile = isMobileViewport();
        const tablet = isTabletViewport();
        const desktop = isDesktopViewport();
        
        // Exactly one should be true
        const trueCount = [mobile, tablet, desktop].filter(Boolean).length;
        expect(trueCount).toBe(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme viewport sizes', () => {
      (window as any).innerWidth = 1;
      expect(isMobileViewport()).toBe(true);
      
      (window as any).innerWidth = 9999;
      expect(isDesktopViewport()).toBe(true);
    });

    it('should handle exactly breakpoint values', () => {
      (window as any).innerWidth = MOBILE_BREAKPOINT;
      expect(isMobileViewport()).toBe(false);
      expect(isTabletViewport()).toBe(true);
      
      (window as any).innerWidth = DESKTOP_BREAKPOINT;
      expect(isTabletViewport()).toBe(false);
      expect(isDesktopViewport()).toBe(true);
    });
  });
});