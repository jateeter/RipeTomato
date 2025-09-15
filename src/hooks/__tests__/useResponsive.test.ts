/**
 * Tests for useResponsive hook
 */

import { renderHook } from '@testing-library/react';
import { useResponsive, useBreakpoint, useResponsiveValue } from '../useResponsive';

// Mock window.innerWidth and window.innerHeight
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

const mockInnerHeight = (height: number) => {
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset to default desktop size
    mockInnerWidth(1280);
    mockInnerHeight(720);
  });

  it('should detect mobile viewport', () => {
    mockInnerWidth(375);
    mockInnerHeight(667);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType).toBe('mobile');
  });

  it('should detect tablet viewport', () => {
    mockInnerWidth(768);
    mockInnerHeight(1024);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.deviceType).toBe('tablet');
  });

  it('should detect desktop viewport', () => {
    mockInnerWidth(1280);
    mockInnerHeight(720);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.deviceType).toBe('desktop');
  });

  it('should detect iPhone SE specifically', () => {
    mockInnerWidth(375);
    mockInnerHeight(667);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.specificDevice).toBe('iphone-se');
  });

  it('should detect iPhone 12 specifically', () => {
    mockInnerWidth(390);
    mockInnerHeight(844);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.specificDevice).toBe('iphone-12');
  });

  it('should detect Pixel 6 specifically', () => {
    mockInnerWidth(412);
    mockInnerHeight(915);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.specificDevice).toBe('pixel-6');
  });

  it('should detect landscape orientation', () => {
    mockInnerWidth(667);
    mockInnerHeight(375);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isPortrait).toBe(false);
  });

  it('should detect portrait orientation', () => {
    mockInnerWidth(375);
    mockInnerHeight(667);

    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isLandscape).toBe(false);
    expect(result.current.isPortrait).toBe(true);
  });
});

describe('useBreakpoint', () => {
  it('should detect tablet breakpoint', () => {
    mockInnerWidth(768);
    
    const { result } = renderHook(() => useBreakpoint('tablet'));
    
    expect(result.current).toBe(true);
  });

  it('should not detect desktop breakpoint on mobile', () => {
    mockInnerWidth(375);
    
    const { result } = renderHook(() => useBreakpoint('desktop'));
    
    expect(result.current).toBe(false);
  });
});

describe('useResponsiveValue', () => {
  it('should return mobile value on mobile device', () => {
    mockInnerWidth(375);
    
    const values = {
      mobile: 'mobile-value',
      tablet: 'tablet-value',
      desktop: 'desktop-value',
      default: 'default-value'
    };
    
    const { result } = renderHook(() => useResponsiveValue(values));
    
    expect(result.current).toBe('mobile-value');
  });

  it('should return tablet value on tablet device', () => {
    mockInnerWidth(768);
    
    const values = {
      mobile: 'mobile-value',
      tablet: 'tablet-value',
      desktop: 'desktop-value',
      default: 'default-value'
    };
    
    const { result } = renderHook(() => useResponsiveValue(values));
    
    expect(result.current).toBe('tablet-value');
  });

  it('should return desktop value on desktop device', () => {
    mockInnerWidth(1280);
    
    const values = {
      mobile: 'mobile-value',
      tablet: 'tablet-value',
      desktop: 'desktop-value',
      default: 'default-value'
    };
    
    const { result } = renderHook(() => useResponsiveValue(values));
    
    expect(result.current).toBe('desktop-value');
  });

  it('should return default value when device-specific value not provided', () => {
    mockInnerWidth(1280);
    
    const values = {
      mobile: 'mobile-value',
      default: 'default-value'
    };
    
    const { result } = renderHook(() => useResponsiveValue(values));
    
    expect(result.current).toBe('default-value');
  });
});