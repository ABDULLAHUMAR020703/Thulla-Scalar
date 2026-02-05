"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ================================
// AUDIO PATHS (from /public folder)
// ================================

export const AUDIO_PATHS = {
    thulla: "/audio/thulla.mp3",
    cardPlay: "/audio/card-play.mp3",
    cardDeal: "/audio/card-deal.mp3",
    trickWin: "/audio/trick-win.mp3",
    gameStart: "/audio/game-start.mp3",
    gameWin: "/audio/game-win.mp3",
    gameLose: "/audio/game-lose.mp3",
    buttonClick: "/audio/button-click.mp3",
} as const;

export type AudioId = keyof typeof AUDIO_PATHS;

// ================================
// AUDIO MANAGER HOOK (PERSISTENT)
// ================================

export interface UseAudioManagerOptions {
    preload?: AudioId[];
    volume?: number;
    enabled?: boolean;
}

/**
 * Persistent audio manager using useRef
 * 
 * - Only ONE Audio instance per sound
 * - Preloads on mount
 * - Resets currentTime before playback
 * - Handles errors gracefully
 */
export function useAudioManager(options: UseAudioManagerOptions = {}) {
    const {
        preload = ["thulla"],
        volume = 0.7,
        enabled = true
    } = options;

    // Persistent audio cache using useRef - survives re-renders
    const audioCacheRef = useRef<Map<AudioId, HTMLAudioElement>>(new Map());
    const isUnlockedRef = useRef(false);
    const unlockAttemptedRef = useRef(false);

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const lastPlayTimeRef = useRef<Map<AudioId, number>>(new Map());
    const DEBOUNCE_MS = 100;

    // ================================
    // CREATE AUDIO INSTANCE (ONCE)
    // ================================

    const getOrCreateAudio = useCallback((audioId: AudioId): HTMLAudioElement | null => {
        // Return existing instance
        if (audioCacheRef.current.has(audioId)) {
            return audioCacheRef.current.get(audioId)!;
        }

        // Create new instance (only happens ONCE per audioId)
        try {
            const audio = new Audio();
            audio.preload = "auto";
            audio.volume = volume;
            audio.src = AUDIO_PATHS[audioId];

            audioCacheRef.current.set(audioId, audio);
            console.log(`[Audio] Created instance: ${audioId}`);

            return audio;
        } catch (error) {
            console.error(`[Audio] Failed to create: ${audioId}`, error);
            return null;
        }
    }, [volume]);

    // ================================
    // PRELOAD ON MOUNT
    // ================================

    useEffect(() => {
        if (!enabled) {
            setIsLoaded(true);
            return;
        }

        // Create and preload audio instances
        const loadPromises = preload.map((audioId) => {
            return new Promise<void>((resolve) => {
                const audio = getOrCreateAudio(audioId);
                if (!audio) {
                    resolve();
                    return;
                }

                // Already loaded
                if (audio.readyState >= 3) {
                    resolve();
                    return;
                }

                audio.oncanplaythrough = () => {
                    console.log(`[Audio] Loaded: ${audioId}`);
                    resolve();
                };

                audio.onerror = () => {
                    console.warn(`[Audio] Error loading: ${audioId}`);
                    resolve();
                };

                // Trigger load
                audio.load();
            });
        });

        Promise.all(loadPromises).then(() => {
            setIsLoaded(true);
            console.log("[Audio] All preloaded");
        });
    }, [preload, enabled, getOrCreateAudio]);

    // ================================
    // AUDIO UNLOCK (MOBILE)
    // ================================

    const unlockAudio = useCallback(async (): Promise<boolean> => {
        if (isUnlockedRef.current) {
            return true;
        }

        if (unlockAttemptedRef.current) {
            return isUnlockedRef.current;
        }

        unlockAttemptedRef.current = true;

        try {
            // Play silent audio to unlock
            const silentAudio = new Audio();
            silentAudio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1jXQ==";
            silentAudio.volume = 0.01;

            await silentAudio.play();
            silentAudio.pause();

            isUnlockedRef.current = true;
            setIsUnlocked(true);
            console.log("[Audio] Unlocked");
            return true;
        } catch (error) {
            console.warn("[Audio] Unlock failed:", error);
            return false;
        }
    }, []);

    // Auto-unlock on user interaction
    useEffect(() => {
        if (isUnlockedRef.current || !enabled) return;

        const handleInteraction = () => {
            unlockAudio();
        };

        window.addEventListener("click", handleInteraction, { once: true });
        window.addEventListener("touchstart", handleInteraction, { once: true });

        return () => {
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("touchstart", handleInteraction);
        };
    }, [unlockAudio, enabled]);

    // ================================
    // PLAY AUDIO (REUSE INSTANCE)
    // ================================

    const play = useCallback(async (audioId: AudioId): Promise<boolean> => {
        if (!enabled) return false;

        // Debounce
        const now = Date.now();
        const lastPlay = lastPlayTimeRef.current.get(audioId) ?? 0;
        if (now - lastPlay < DEBOUNCE_MS) {
            return false;
        }
        lastPlayTimeRef.current.set(audioId, now);

        // Get existing audio instance
        const audio = getOrCreateAudio(audioId);
        if (!audio) {
            console.error(`[Audio] No instance: ${audioId}`);
            return false;
        }

        try {
            // Reset to start for instant replay
            audio.currentTime = 0;
            audio.volume = volume;

            await audio.play();
            console.log(`[Audio] Playing: ${audioId}`);
            return true;
        } catch (error) {
            console.error(`[Audio] Play error: ${audioId}`, error);

            // Try unlock on first failure
            if (!isUnlockedRef.current) {
                await unlockAudio();
            }
            return false;
        }
    }, [enabled, volume, getOrCreateAudio, unlockAudio]);

    // ================================
    // CONVENIENCE FUNCTIONS
    // ================================

    const playThulla = useCallback(() => play("thulla"), [play]);
    const playCardPlay = useCallback(() => play("cardPlay"), [play]);
    const playCardDeal = useCallback(() => play("cardDeal"), [play]);
    const playTrickWin = useCallback(() => play("trickWin"), [play]);
    const playGameStart = useCallback(() => play("gameStart"), [play]);
    const playGameWin = useCallback(() => play("gameWin"), [play]);
    const playGameLose = useCallback(() => play("gameLose"), [play]);
    const playButtonClick = useCallback(() => play("buttonClick"), [play]);

    // ================================
    // STOP ALL
    // ================================

    const stopAll = useCallback(() => {
        audioCacheRef.current.forEach((audio, audioId) => {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch (error) {
                console.warn(`[Audio] Stop error: ${audioId}`, error);
            }
        });
    }, []);

    // ================================
    // SET VOLUME
    // ================================

    const setVolume = useCallback((newVolume: number) => {
        const clamped = Math.max(0, Math.min(1, newVolume));
        audioCacheRef.current.forEach((audio) => {
            audio.volume = clamped;
        });
    }, []);

    return {
        // State
        isUnlocked,
        isLoaded,

        // Core functions
        play,
        stopAll,
        setVolume,
        unlockAudio,

        // Convenience functions
        playThulla,
        playCardPlay,
        playCardDeal,
        playTrickWin,
        playGameStart,
        playGameWin,
        playGameLose,
        playButtonClick,
    };
}
