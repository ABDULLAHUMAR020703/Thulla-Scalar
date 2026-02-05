"use client";

import { useCallback, useRef } from "react";
import { useVibration } from "./useVibration";
import { useScreenShake } from "./useScreenShake";
import { useAudioManager } from "./useAudioManager";

// ================================
// THULLA EFFECT HOOK
// ================================

/**
 * Combined hook for THULLA event effects
 * 
 * Triggers:
 * - Screen shake (GPU accelerated)
 * - Device vibration (mobile)
 * - Audio playback (thulla.mp3)
 */
export function useThullaEffects() {
    const vibration = useVibration();
    const screenShake = useScreenShake();
    const audio = useAudioManager({ preload: ["thulla"] });

    const isTriggeredRef = useRef(false);
    const cooldownRef = useRef<NodeJS.Timeout | null>(null);

    const COOLDOWN_MS = 600; // Prevent rapid re-triggers

    /**
     * Trigger all THULLA effects
     */
    const triggerThulla = useCallback((): void => {
        // Prevent rapid re-triggers
        if (isTriggeredRef.current) {
            return;
        }

        isTriggeredRef.current = true;

        // 1. Trigger screen shake
        screenShake.shakeThulla();

        // 2. Trigger vibration (mobile only)
        vibration.vibrateThulla();

        // 3. Play THULLA sound
        audio.playThulla();

        // Reset after cooldown
        cooldownRef.current = setTimeout(() => {
            isTriggeredRef.current = false;
        }, COOLDOWN_MS);
    }, [screenShake, vibration, audio]);

    /**
     * Stop all effects
     */
    const stopEffects = useCallback((): void => {
        screenShake.stop();
        vibration.stop();
        audio.stopAll();
        isTriggeredRef.current = false;

        if (cooldownRef.current) {
            clearTimeout(cooldownRef.current);
            cooldownRef.current = null;
        }
    }, [screenShake, vibration, audio]);

    return {
        // State
        isShaking: screenShake.isShaking,
        shakeStyle: screenShake.shakeStyle,
        vibrationSupported: vibration.isSupported,
        audioUnlocked: audio.isUnlocked,

        // Actions
        triggerThulla,
        stopEffects,

        // Individual controls (for testing)
        shake: screenShake.shake,
        vibrate: vibration.vibrate,
        playSound: audio.play,
    };
}
