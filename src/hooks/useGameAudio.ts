"use client";

import { useCallback, useRef } from "react";
import { useAudioManager, AudioId } from "./useAudioManager";

// ================================
// GAME AUDIO HOOK
// ================================

export interface UseGameAudioOptions {
    myPlayerId?: string | null;
    enabled?: boolean;
}

/**
 * Central hook for game audio triggers
 * 
 * Maps game events to appropriate sounds:
 * - GAME_STARTED -> card-deal.mp3
 * - CARD_PLAYED -> card-pay.mp3
 * - PLAYER_FINISHED -> win.mp3 (local player only)
 * - GAME_ENDED -> lose.mp3 (local player is loser)
 * - THULLA_TRIGGERED -> handled by useThullaEffects
 */
export function useGameAudio(options: UseGameAudioOptions = {}) {
    const { myPlayerId = null, enabled = true } = options;

    // Preload all game sounds
    const audio = useAudioManager({
        preload: ["cardPlay", "cardDeal", "win", "lose", "thulla"] as AudioId[],
        enabled,
    });

    // Prevent duplicate triggers
    const lastGameStartRef = useRef<string | null>(null);
    const lastFinishRef = useRef<string | null>(null);
    const lastGameEndRef = useRef<string | null>(null);

    /**
     * Play card deal sound on GAME_STARTED
     * Delayed slightly to sync with deal animation
     */
    const onGameStarted = useCallback((roomId: string) => {
        // Prevent duplicate triggers for same game
        if (lastGameStartRef.current === roomId) return;
        lastGameStartRef.current = roomId;

        // Delayed to sync with visual card deal
        setTimeout(() => {
            audio.playCardDeal();
        }, 200);
    }, [audio]);

    /**
     * Play card sound on CARD_PLAYED
     * Plays for every card thrown
     */
    const onCardPlayed = useCallback(() => {
        audio.playCardPlay();
    }, [audio]);

    /**
     * Play win sound when local player finishes (empties hand)
     * Only plays for the local client, not broadcast
     */
    const onPlayerFinished = useCallback((finishedPlayerId: string) => {
        // Only play for the local player
        if (!myPlayerId || finishedPlayerId !== myPlayerId) return;

        // Prevent duplicate triggers
        if (lastFinishRef.current === finishedPlayerId) return;
        lastFinishRef.current = finishedPlayerId;

        audio.playWin();
    }, [myPlayerId, audio]);

    /**
     * Play lose sound when local player is the loser (last remaining)
     * Overrides other sounds
     */
    const onGameEnded = useCallback((loserPlayerId: string) => {
        // Only play for the loser
        if (!myPlayerId || loserPlayerId !== myPlayerId) return;

        // Prevent duplicate triggers
        if (lastGameEndRef.current === loserPlayerId) return;
        lastGameEndRef.current = loserPlayerId;

        // Stop other sounds and play lose sound
        audio.stopAll();
        audio.playLose();
    }, [myPlayerId, audio]);

    /**
     * Reset tracking refs (call when joining new game)
     */
    const reset = useCallback(() => {
        lastGameStartRef.current = null;
        lastFinishRef.current = null;
        lastGameEndRef.current = null;
    }, []);

    return {
        // Event handlers
        onGameStarted,
        onCardPlayed,
        onPlayerFinished,
        onGameEnded,
        reset,

        // State
        isMuted: audio.isMuted,
        isReady: audio.isLoaded && audio.isUnlocked,

        // Controls
        toggleMute: audio.toggleMute,
        unlockAudio: audio.unlockAudio,
    };
}
