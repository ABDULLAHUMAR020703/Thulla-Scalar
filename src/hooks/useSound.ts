"use client";

import { useRef, useEffect, useCallback, useState } from "react";

// Sound file paths
export const SOUNDS = {
    thulla: "/audio/thulla.mp3",
    cardPlay: "/audio/card-play.mp3",
    cardDeal: "/audio/card-deal.mp3",
    win: "/audio/win.mp3",
    lose: "/audio/lose.mp3",
    click: "/audio/click.mp3",
    notification: "/audio/notification.mp3",
} as const;

export type SoundName = keyof typeof SOUNDS;

interface UseSoundOptions {
    volume?: number;
    preload?: boolean;
}

interface SoundInstance {
    audio: HTMLAudioElement;
    loaded: boolean;
}

// Global audio context for mobile autoplay fix
let audioContext: AudioContext | null = null;
let audioUnlocked = false;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

// Unlock audio on first user interaction (mobile fix)
function unlockAudio() {
    if (audioUnlocked) return;

    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
        ctx.resume();
    }

    // Create and play silent audio to unlock
    const silentAudio = new Audio();
    silentAudio.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1NvZnR3YXJlAExhdmY1Ny44My4xMDAA//uQwAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
    silentAudio.volume = 0.01;
    silentAudio.play().catch(() => { });

    audioUnlocked = true;
}

// Add unlock listener
if (typeof window !== "undefined") {
    const events = ["touchstart", "touchend", "mousedown", "keydown"];
    const unlock = () => {
        unlockAudio();
        events.forEach((e) => document.removeEventListener(e, unlock));
    };
    events.forEach((e) => document.addEventListener(e, unlock, { once: true }));
}

/**
 * Hook for playing game sounds with preloading and mobile support
 */
export function useSound(options: UseSoundOptions = {}) {
    const { volume = 1.0, preload = true } = options;
    const soundsRef = useRef<Map<SoundName, SoundInstance>>(new Map());
    const [isReady, setIsReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const volumeRef = useRef(volume);

    // Update volume ref
    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    // Preload sounds
    useEffect(() => {
        if (!preload || typeof window === "undefined") return;

        const loadSound = (name: SoundName, path: string) => {
            const audio = new Audio();
            audio.preload = "auto";
            audio.src = path;

            const instance: SoundInstance = { audio, loaded: false };

            audio.addEventListener("canplaythrough", () => {
                instance.loaded = true;
            });

            audio.load();
            soundsRef.current.set(name, instance);
        };

        Object.entries(SOUNDS).forEach(([name, path]) => {
            loadSound(name as SoundName, path);
        });

        setIsReady(true);

        return () => {
            soundsRef.current.forEach((instance) => {
                instance.audio.pause();
                instance.audio.src = "";
            });
            soundsRef.current.clear();
        };
    }, [preload]);

    // Play a sound
    const play = useCallback((name: SoundName, customVolume?: number) => {
        if (isMuted || typeof window === "undefined") return;

        unlockAudio();

        let instance = soundsRef.current.get(name);

        // Create instance if not preloaded
        if (!instance) {
            const audio = new Audio(SOUNDS[name]);
            instance = { audio, loaded: true };
            soundsRef.current.set(name, instance);
        }

        const audio = instance.audio;
        audio.volume = Math.min(1, Math.max(0, customVolume ?? volumeRef.current));
        audio.currentTime = 0;

        audio.play().catch((err) => {
            console.warn(`Failed to play sound ${name}:`, err);
        });
    }, [isMuted]);

    // Stop a sound
    const stop = useCallback((name: SoundName) => {
        const instance = soundsRef.current.get(name);
        if (instance) {
            instance.audio.pause();
            instance.audio.currentTime = 0;
        }
    }, []);

    // Stop all sounds
    const stopAll = useCallback(() => {
        soundsRef.current.forEach((instance) => {
            instance.audio.pause();
            instance.audio.currentTime = 0;
        });
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        setIsMuted((prev) => !prev);
    }, []);

    // Set volume
    const setVolume = useCallback((newVolume: number) => {
        volumeRef.current = Math.min(1, Math.max(0, newVolume));
    }, []);

    return {
        play,
        stop,
        stopAll,
        isReady,
        isMuted,
        toggleMute,
        setVolume,
    };
}

/**
 * Hook specifically for Thulla sound effect
 */
export function useThulaSound() {
    const { play, isReady } = useSound({ volume: 0.8 });

    const playThulla = useCallback(() => {
        play("thulla", 1.0);
    }, [play]);

    return { playThulla, isReady };
}
