import { useMediaQuery, useTheme } from '@mui/material';
import { useMemo } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'projector';

export interface ResponsiveInfo {
    isMobile: boolean;
    isTablet: boolean;
    isLaptop: boolean;
    isDesktop: boolean;
    isProjector: boolean;
    deviceType: DeviceType;
    isTouch: boolean;
    orientation: 'portrait' | 'landscape';
}

/**
 * Custom hook for responsive behavior and device detection
 * 
 * @returns Responsive information object
 */
export const useResponsive = (): ResponsiveInfo => {
    const theme = useTheme();

    // Breakpoint queries
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 960px
    const isLaptop = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 960px - 1280px
    const isDesktop = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 1280px - 1920px
    const isProjector = useMediaQuery(theme.breakpoints.up('xl')); // >= 1920px

    // Orientation
    const isPortrait = useMediaQuery('(orientation: portrait)');

    // Touch detection
    const isTouch = useMemo(() => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }, []);

    // Determine device type
    const deviceType: DeviceType = useMemo(() => {
        if (isMobile) return 'mobile';
        if (isTablet) return 'tablet';
        if (isLaptop) return 'laptop';
        if (isDesktop) return 'desktop';
        if (isProjector) return 'projector';
        return 'desktop'; // fallback
    }, [isMobile, isTablet, isLaptop, isDesktop, isProjector]);

    return {
        isMobile,
        isTablet,
        isLaptop,
        isDesktop,
        isProjector,
        deviceType,
        isTouch,
        orientation: isPortrait ? 'portrait' : 'landscape',
    };
};

/**
 * Get responsive value based on current breakpoint
 * 
 * @param values - Object with values for each breakpoint
 * @returns Value for current breakpoint
 */
export const useResponsiveValue = <T,>(values: {
    mobile?: T;
    tablet?: T;
    laptop?: T;
    desktop?: T;
    projector?: T;
    default: T;
}): T => {
    const { deviceType } = useResponsive();

    return values[deviceType] ?? values.default;
};

/**
 * Get responsive spacing based on device type
 */
export const useResponsiveSpacing = () => {
    const { deviceType } = useResponsive();

    const spacing = useMemo(() => {
        switch (deviceType) {
            case 'mobile':
                return { xs: 1, sm: 1.5, md: 2, lg: 2.5 };
            case 'tablet':
                return { xs: 1.5, sm: 2, md: 2.5, lg: 3 };
            case 'laptop':
                return { xs: 2, sm: 2.5, md: 3, lg: 3.5 };
            case 'desktop':
                return { xs: 2.5, sm: 3, md: 3.5, lg: 4 };
            case 'projector':
                return { xs: 3, sm: 4, md: 5, lg: 6 };
            default:
                return { xs: 2, sm: 2.5, md: 3, lg: 3.5 };
        }
    }, [deviceType]);

    return spacing;
};

/**
 * Get responsive font sizes
 */
export const useResponsiveFontSize = () => {
    const { deviceType } = useResponsive();

    return useMemo(() => {
        switch (deviceType) {
            case 'mobile':
                return { small: '0.75rem', medium: '0.875rem', large: '1rem' };
            case 'tablet':
                return { small: '0.875rem', medium: '1rem', large: '1.125rem' };
            case 'laptop':
                return { small: '1rem', medium: '1.125rem', large: '1.25rem' };
            case 'desktop':
                return { small: '1.125rem', medium: '1.25rem', large: '1.5rem' };
            case 'projector':
                return { small: '1.5rem', medium: '1.75rem', large: '2rem' };
            default:
                return { small: '1rem', medium: '1.125rem', large: '1.25rem' };
        }
    }, [deviceType]);
};

/**
 * Get responsive grid columns
 */
export const useResponsiveColumns = (
    mobile: number = 1,
    tablet: number = 2,
    laptop: number = 3,
    desktop: number = 4,
    projector: number = 6
) => {
    const { deviceType } = useResponsive();

    return useMemo(() => {
        switch (deviceType) {
            case 'mobile':
                return mobile;
            case 'tablet':
                return tablet;
            case 'laptop':
                return laptop;
            case 'desktop':
                return desktop;
            case 'projector':
                return projector;
            default:
                return desktop;
        }
    }, [deviceType, mobile, tablet, laptop, desktop, projector]);
};
