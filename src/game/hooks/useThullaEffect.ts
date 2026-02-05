"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSound } from "@/hooks/useSound";

interface ThullaEffectState {
    isActive: boolean;
    playerName: string;
    playerId: string | null;
    targetPosition: { x: number; y: number };
}

interface ThullaEffectOptions {
    soundEnabled?: boolean;
    autoHide?: boolean;
    autoHideDelay?: number;
}

/**
 * Hook to manage Thulla event effects (sound, animations, state)
 */
export function useThullaEffect(options: ThullaEffectOptions = {}) {
    const {
        soundEnabled = true,
        autoHide = true,
        autoHideDelay = 3000
    } = options;

    const [state, setState] = useState<ThullaEffectState>({
        isActive: false,
        playerName: "",
        playerId: null,
        targetPosition: { x: 0, y: 0 },
    });

    const { play } = useSound({ volume: 0.8 });
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    /**
     * Trigger the Thulla effect
     */
    const triggerThulla = useCallback((
        playerId: string,
        playerName: string,
        targetPosition?: { x: number; y: number }
    ) => {
        // Clear any existing timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        // Play sound
        if (soundEnabled) {
            play("thulla");
        }

        // Set state
        setState({
            isActive: true,
            playerName,
            playerId,
            targetPosition: targetPosition ?? { x: window.innerWidth / 2, y: 100 },
        });

        // Auto-hide after delay
        if (autoHide) {
            hideTimeoutRef.current = setTimeout(() => {
                setState((prev) => ({ ...prev, isActive: false }));
            }, autoHideDelay);
        }
    }, [soundEnabled, play, autoHide, autoHideDelay]);

    /**
     * Manually hide the Thulla effect
     */
    const hideThulla = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        setState((prev) => ({ ...prev, isActive: false }));
    }, []);

    /**
     * Handle animation complete
     */
    const onAnimationComplete = useCallback(() => {
        setState((prev) => ({ ...prev, isActive: false }));
    }, []);

    return {
        // State
        isActive: state.isActive,
        playerName: state.playerName,
        playerId: state.playerId,
        targetPosition: state.targetPosition,

        // Actions
        triggerThulla,
        hideThulla,
        onAnimationComplete,
    };
}

/**
 * Hook for animation sequencing
 */
export function useAnimationSequence() {
    const [currentStep, setCurrentStep] = useState<string | null>(null);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(clearTimeout);
        };
    }, []);

    /**
     * Run a sequence of animations with delays
     */
    const runSequence = useCallback((
        steps: Array<{ name: string; delay: number; action?: () => void }>
    ) => {
        // Clear existing timeouts
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];

        let totalDelay = 0;

        steps.forEach((step) => {
            totalDelay += step.delay;

            const timeout = setTimeout(() => {
                setCurrentStep(step.name);
                step.action?.();
            }, totalDelay);

            timeoutsRef.current.push(timeout);
        });

        // Reset after all steps complete
        const resetTimeout = setTimeout(() => {
            setCurrentStep(null);
        }, totalDelay + 100);
        timeoutsRef.current.push(resetTimeout);
    }, []);

    /**
     * Cancel current sequence
     */
    const cancelSequence = useCallback(() => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
        setCurrentStep(null);
    }, []);

    return {
        currentStep,
        runSequence,
        cancelSequence,
    };
}

/**
 * Hook for screen shake effect
 */
export function useScreenShake() {
    const [isShaking, setIsShaking] = useState(false);
    const [intensity, setIntensity] = useState(10);

    const shake = useCallback((duration: number = 400, shakeIntensity: number = 10) => {
        setIntensity(shakeIntensity);
        setIsShaking(true);

        setTimeout(() => {
            setIsShaking(false);
        }, duration);
    }, []);

    const shakeVariants = {
        shake: {
            x: [0, -intensity, intensity, -intensity, intensity, -intensity / 2, intensity / 2, 0],
            y: [0, intensity / 2, -intensity / 2, intensity / 2, -intensity / 2, intensity / 4, -intensity / 4, 0],
            transition: { duration: 0.4 },
        },
        still: {
            x: 0,
            y: 0,
        },
    };

    return {
        isShaking,
        shake,
        shakeVariants,
        currentVariant: isShaking ? "shake" : "still",
    };
}
