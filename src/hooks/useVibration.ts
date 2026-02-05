"use client";

import { useCallback, useRef } from "react";

// ================================
// VIBRATION PATTERNS
// ================================

export const VIBRATION_PATTERNS = {
    // THULLA event - strong feedback
    thulla: [100, 50, 200],
    // Card played - subtle tap
    cardPlay: [30],
    // Trick won - celebration
    trickWin: [50, 30, 50],
    // Error - warning
    error: [100, 100, 100],
    // Success
    success: [50, 50, 100],
} as const;

export type VibrationPattern = keyof typeof VIBRATION_PATTERNS;

// ================================
// VIBRATION HOOK
// ================================

/**
 * Hook for triggering device vibration with fallback
 * 
 * - Uses navigator.vibrate() when available
 * - Safe fallback on unsupported devices (iOS, Desktop)
 * - Debounced to prevent overlap
 */
export function useVibration() {
    const isVibrating = useRef(false);
    const lastVibrationTime = useRef(0);
    const DEBOUNCE_MS = 100;

    /**
     * Check if vibration is supported
     */
    const isSupported = useCallback((): boolean => {
        return typeof navigator !== "undefined" && "vibrate" in navigator;
    }, []);

    /**
     * Trigger a vibration pattern
     */
    const vibrate = useCallback((pattern: VibrationPattern | number[]): boolean => {
        // Check support
        if (!isSupported()) {
            return false;
        }

        // Debounce
        const now = Date.now();
        if (now - lastVibrationTime.current < DEBOUNCE_MS) {
            return false;
        }

        // Prevent overlap
        if (isVibrating.current) {
            return false;
        }

        try {
            const vibrationPattern = Array.isArray(pattern)
                ? pattern
                : VIBRATION_PATTERNS[pattern];

            isVibrating.current = true;
            lastVibrationTime.current = now;

            const success = navigator.vibrate(vibrationPattern);

            // Calculate total duration
            const totalDuration = vibrationPattern.reduce((sum, val) => sum + val, 0);

            // Reset flag after vibration completes
            setTimeout(() => {
                isVibrating.current = false;
            }, totalDuration + 50);

            return success;
        } catch {
            // Silently fail - vibration not critical
            isVibrating.current = false;
            return false;
        }
    }, [isSupported]);

    /**
     * Stop any ongoing vibration
     */
    const stop = useCallback((): void => {
        if (isSupported()) {
            try {
                navigator.vibrate(0);
                isVibrating.current = false;
            } catch {
                // Ignore errors
            }
        }
    }, [isSupported]);

    /**
     * Trigger THULLA vibration
     */
    const vibrateThulla = useCallback((): boolean => {
        return vibrate("thulla");
    }, [vibrate]);

    return {
        isSupported: isSupported(),
        vibrate,
        vibrateThulla,
        stop,
    };
}
