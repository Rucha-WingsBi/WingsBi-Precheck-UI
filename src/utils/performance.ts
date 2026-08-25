import { debounce } from 'lodash';

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Debounced function
 */
export const createDebounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number = 300
): ((...args: Parameters<T>) => void) => {
    return debounce(func, wait);
};

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * 
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle
 * @returns Throttled function
 */
export const createThrottle = <T extends (...args: any[]) => any>(
    func: T,
    wait: number = 300
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    let lastRun = 0;

    return (...args: Parameters<T>) => {
        const now = Date.now();

        if (now - lastRun >= wait) {
            func(...args);
            lastRun = now;
        } else {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                func(...args);
                lastRun = Date.now();
            }, wait - (now - lastRun));
        }
    };
};

/**
 * Performance monitoring utility
 */
export const performanceMonitor = {
    /**
     * Measure the execution time of a function
     */
    measure: <T extends (...args: any[]) => any>(
        name: string,
        func: T
    ): ((...args: Parameters<T>) => ReturnType<T>) => {
        return (...args: Parameters<T>): ReturnType<T> => {
            const start = performance.now();
            const result = func(...args);
            const end = performance.now();

            if (import.meta.env.MODE === 'development') {
                console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
            }

            return result;
        };
    },

    /**
     * Mark a performance entry
     */
    mark: (name: string) => {
        if (import.meta.env.MODE === 'development') {
            performance.mark(name);
        }
    },

    /**
     * Measure between two marks
     */
    measureBetween: (name: string, startMark: string, endMark: string) => {
        if (import.meta.env.MODE === 'development') {
            try {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name)[0];
                console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
            } catch (error) {
                console.warn(`Failed to measure ${name}:`, error);
            }
        }
    },
};

/**
 * Memoization utility for expensive computations
 */
export const memoize = <T extends (...args: any[]) => any>(
    func: T,
    resolver?: (...args: Parameters<T>) => string
): T => {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>): ReturnType<T> => {
        const key = resolver ? resolver(...args) : JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key)!;
        }

        const result = func(...args);
        cache.set(key, result);
        return result;
    }) as T;
};

/**
 * Request deduplication utility
 */
export class RequestDeduplicator {
    private pending = new Map<string, Promise<any>>();

    /**
     * Deduplicate requests with the same key
     */
    async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
        if (this.pending.has(key)) {
            return this.pending.get(key) as Promise<T>;
        }

        const promise = requestFn().finally(() => {
            this.pending.delete(key);
        });

        this.pending.set(key, promise);
        return promise;
    }

    /**
     * Clear all pending requests
     */
    clear() {
        this.pending.clear();
    }
}

/**
 * Lazy load utility with retry logic
 */
export const lazyWithRetry = <T extends React.ComponentType<any>>(
    componentImport: () => Promise<{ default: T }>,
    retries: number = 3
): React.LazyExoticComponent<T> => {
    return React.lazy(async () => {
        let lastError: Error | null = null;

        for (let i = 0; i < retries; i++) {
            try {
                return await componentImport();
            } catch (error) {
                lastError = error as Error;

                // Wait before retrying (exponential backoff)
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
        }

        throw lastError || new Error('Failed to load component');
    });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Export React for lazy loading utility
import React from 'react';
