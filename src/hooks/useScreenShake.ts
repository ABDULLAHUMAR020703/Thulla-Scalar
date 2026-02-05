"use client";

import { useCallback, useRef, useState } from "react";

// ================================
// SHAKE CONFIGURATION
// ================================

export interface ShakeConfig {
    duration: number;      // Total duration in ms
    intensity: number;     // Shake intensity (pixels)
    frequency: number;     // Number of shakes
    easing: string;        // CSS easing function
}

export const SHAKE_PRESETS: Record<string, ShakeConfig> = {
    // THULLA - intense shake
    thulla: {
        duration: 500,
        intensity: 8,
        frequency: 6,
        easing: "cubic-bezier(0.36, 0.07, 0.19, 0.97)",
    },
    // Light shake for errors
    error: {
        duration: 300,
        intensity: 4,
        frequency: 4,
        easing: "ease-out",
    },
    // Subtle notification shake
    notify: {
        duration: 200,
        intensity: 2,
        frequency: 3,
        easing: "ease-in-out",
    },
};

export type ShakePreset = keyof typeof SHAKE_PRESETS;

// ================================
// SCREEN SHAKE HOOK
// ================================

/**
 * Hook for triggering GPU-accelerated screen shake
 * 
 * - Uses CSS transform (GPU accelerated)
 * - No layout reflow
 * - Debounced to prevent overlap
 * - Returns shake state and trigger function
 */
export function useScreenShake() {
    const [isShaking, setIsShaking] = useState(false);
    const [shakeStyle, setShakeStyle] = useState<React.CSSProperties>({});
    const animationRef = useRef<number | null>(null);
    const isActiveRef = useRef(false);

    /**
     * Stop any ongoing shake
     */
    const stop = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        isActiveRef.current = false;
        setIsShaking(false);
        setShakeStyle({});
    }, []);

    /**
     * Trigger screen shake with config
     */
    const shake = useCallback((preset: ShakePreset | ShakeConfig = "thulla"): void => {
        // Prevent overlap
        if (isActiveRef.current) {
            return;
        }

        const config = typeof preset === "string" ? SHAKE_PRESETS[preset] : preset;
        const { duration, intensity, frequency } = config;

        isActiveRef.current = true;
        setIsShaking(true);

        const startTime = performance.now();
        const shakeInterval = duration / (frequency * 2);

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;

            if (elapsed >= duration) {
                stop();
                return;
            }

            // Calculate decay (shake intensity decreases over time)
            const progress = elapsed / duration;
            const decay = 1 - progress;

            // Calculate current shake offset using sine wave
            const phase = (elapsed / shakeInterval) * Math.PI;
            const xOffset = Math.sin(phase) * intensity * decay;
            const yOffset = Math.cos(phase * 0.7) * intensity * decay * 0.5;
            const rotation = Math.sin(phase * 1.3) * 0.5 * decay;

            // Apply GPU-accelerated transform
            setShakeStyle({
                transform: `translate3d(${xOffset}px, ${yOffset}px, 0) rotate(${rotation}deg)`,
                willChange: "transform",
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [stop]);

    /**
     * Trigger THULLA shake preset
     */
    const shakeThulla = useCallback((): void => {
        shake("thulla");
    }, [shake]);

    // Cleanup on unmount
    // Note: useEffect cleanup handled by component unmount

    return {
        isShaking,
        shakeStyle,
        shake,
        shakeThulla,
        stop,
    };
}

// ================================
// CSS KEYFRAME SHAKE (ALTERNATIVE)
// ================================

/**
 * Generate CSS keyframes for shake animation
 * Can be used as className instead of inline styles
 */
export const shakeKeyframes = `
@keyframes thulla-shake {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  10% { transform: translate3d(-8px, -2px, 0) rotate(-0.5deg); }
  20% { transform: translate3d(7px, 1px, 0) rotate(0.5deg); }
  30% { transform: translate3d(-6px, -1px, 0) rotate(-0.3deg); }
  40% { transform: translate3d(5px, 1px, 0) rotate(0.3deg); }
  50% { transform: translate3d(-4px, 0, 0) rotate(-0.2deg); }
  60% { transform: translate3d(3px, 0, 0) rotate(0.2deg); }
  70% { transform: translate3d(-2px, 0, 0) rotate(-0.1deg); }
  80% { transform: translate3d(1px, 0, 0) rotate(0.1deg); }
  90% { transform: translate3d(-1px, 0, 0) rotate(0deg); }
}

.shake-thulla {
  animation: thulla-shake 500ms cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
}
`;
