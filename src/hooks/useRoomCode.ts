"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { Room } from "@/services/roomService";

// ================================
// TYPES
// ================================

interface UseRoomCodeOptions {
    roomId?: string | null;
}

interface UseRoomCodeReturn {
    roomCode: string | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

// ================================
// ROOM CODE HOOK
// ================================

/**
 * Hook to fetch and subscribe to room code
 * - Fetches room_code from rooms table
 * - Subscribes to realtime updates
 */
export function useRoomCode(options: UseRoomCodeOptions = {}): UseRoomCodeReturn {
    const { roomId } = options;

    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch room code
    const fetchRoomCode = useCallback(async () => {
        if (!roomId) {
            setRoomCode(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("rooms")
                .select("room_code")
                .eq("id", roomId)
                .single();

            if (fetchError) {
                setError(fetchError.message);
                setRoomCode(null);
            } else {
                setRoomCode(data?.room_code ?? null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch room code");
        } finally {
            setIsLoading(false);
        }
    }, [roomId]);

    // Initial fetch
    useEffect(() => {
        fetchRoomCode();
    }, [fetchRoomCode]);

    // Realtime subscription
    useEffect(() => {
        if (!roomId) return;

        const channel = supabase
            .channel(`room-code-${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "rooms",
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    const newRoomCode = (payload.new as Room).room_code;
                    if (newRoomCode) {
                        setRoomCode(newRoomCode);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    return {
        roomCode,
        isLoading,
        error,
        refresh: fetchRoomCode,
    };
}
