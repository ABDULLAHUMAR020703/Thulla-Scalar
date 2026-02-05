/**
 * Game Actions Service
 * 
 * Centralized Edge Function calls for all game mutations.
 * All gameplay state changes go through here to ensure RLS compliance.
 */

import { supabase } from "@/services/supabase";
import { Suit, Rank } from "@/context/GameProvider";

// ================================
// TYPES
// ================================

export interface GameActionResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

export interface StartGameResult {
    room_id: string;
    status: string;
    starter_player_id: string;
    player_count: number;
    cards_per_player: number;
}

export interface PlayCardResult {
    card_played: { suit: string; rank: string };
    next_turn_player_id: string;
    is_thulla: boolean;
    trick_cleared: boolean;
}

export interface PassTurnResult {
    previous_player_id: string;
    next_player_id: string;
}

export interface ResolveTrickResult {
    winner_id: string;
    winner_position: number;
    cards_cleared: number;
}

export interface ResolveThullaResult {
    pile_receiver_id: string;
    cards_picked_up: number;
    receiver_position: number;
}

// ================================
// EDGE FUNCTION INVOKERS
// ================================

/**
 * Start a game (host only)
 * - Validates host permission
 * - Deals cards to all players
 * - Sets Ace of Spades holder as first player
 * - Broadcasts GAME_STARTED event
 */
export async function invokeStartGame(
    roomId: string
): Promise<GameActionResult<StartGameResult>> {
    try {
        const { data, error } = await supabase.functions.invoke("start-game", {
            body: { room_id: roomId },
        });

        if (error) {
            console.error("[GameActions] start-game error:", error);
            return { success: false, error: error.message };
        }

        if (!data.success) {
            return { success: false, error: data.error, code: data.code };
        }

        return { success: true, data: data.data };
    } catch (err) {
        console.error("[GameActions] start-game exception:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

/**
 * Play a card
 * - Validates turn and card ownership
 * - Enforces suit following rules
 * - Detects and handles THULLA
 * - Advances turn or resolves trick
 * - Broadcasts CARD_PLAYED, TURN_CHANGED, THULLA_TRIGGERED, or TRICK_CLEARED
 */
export async function invokePlayCard(
    roomId: string,
    cardSuit: Suit,
    cardRank: Rank
): Promise<GameActionResult<PlayCardResult>> {
    try {
        const { data, error } = await supabase.functions.invoke("play-card", {
            body: {
                room_id: roomId,
                card_suit: cardSuit,
                card_rank: cardRank,
            },
        });

        if (error) {
            console.error("[GameActions] play-card error:", error);
            return { success: false, error: error.message };
        }

        if (!data.success) {
            return { success: false, error: data.error, code: data.code };
        }

        return { success: true, data: data.data };
    } catch (err) {
        console.error("[GameActions] play-card exception:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

/**
 * Pass turn (if game rules allow)
 * - Validates it's the player's turn
 * - Advances to next player
 * - Broadcasts TURN_CHANGED event
 */
export async function invokePassTurn(
    roomId: string
): Promise<GameActionResult<PassTurnResult>> {
    try {
        const { data, error } = await supabase.functions.invoke("pass-turn", {
            body: { room_id: roomId },
        });

        if (error) {
            console.error("[GameActions] pass-turn error:", error);
            return { success: false, error: error.message };
        }

        if (!data.success) {
            return { success: false, error: data.error, code: data.code };
        }

        return { success: true, data: data.data };
    } catch (err) {
        console.error("[GameActions] pass-turn exception:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

/**
 * Resolve a completed trick
 * - Determines winner (highest card of active suit)
 * - Clears trick cards
 * - Sets winner as next turn
 * - Broadcasts TRICK_CLEARED event
 */
export async function invokeResolveTrick(
    roomId: string
): Promise<GameActionResult<ResolveTrickResult>> {
    try {
        const { data, error } = await supabase.functions.invoke("resolve-trick", {
            body: { room_id: roomId },
        });

        if (error) {
            console.error("[GameActions] resolve-trick error:", error);
            return { success: false, error: error.message };
        }

        if (!data.success) {
            return { success: false, error: data.error, code: data.code };
        }

        return { success: true, data: data.data };
    } catch (err) {
        console.error("[GameActions] resolve-trick exception:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

/**
 * Resolve THULLA event
 * - Finds pile receiver (highest card of active suit)
 * - Transfers all pile cards to receiver
 * - Sets receiver as next turn
 * - Broadcasts THULLA_RESOLVED event
 */
export async function invokeResolveThulla(
    roomId: string,
    triggerPlayerId: string
): Promise<GameActionResult<ResolveThullaResult>> {
    try {
        const { data, error } = await supabase.functions.invoke("resolve-thulla", {
            body: {
                room_id: roomId,
                trigger_player_id: triggerPlayerId,
            },
        });

        if (error) {
            console.error("[GameActions] resolve-thulla error:", error);
            return { success: false, error: error.message };
        }

        if (!data.success) {
            return { success: false, error: data.error, code: data.code };
        }

        return { success: true, data: data.data };
    } catch (err) {
        console.error("[GameActions] resolve-thulla exception:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}
