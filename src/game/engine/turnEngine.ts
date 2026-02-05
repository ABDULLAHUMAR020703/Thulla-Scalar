import { supabase } from "@/services/supabase";

// ================================
// TYPES
// ================================

export interface TurnPlayer {
    id: string;
    user_id: string;
    position: number;
    is_active: boolean;
    has_cards: boolean; // true if player still has cards
}

// ================================
// CLOCKWISE TURN ROTATION
// ================================

/**
 * Get next player in clockwise order (by position)
 * 
 * Rules:
 * - Move to next higher position
 * - Loop back to lowest if at highest
 * - Skip inactive players (is_active = false)
 * - Skip players with no cards (has_cards = false)
 */
export function getNextTurnPlayer(
    players: TurnPlayer[],
    currentPlayerId: string
): TurnPlayer | null {
    // Filter to eligible players (active + has cards)
    const eligiblePlayers = players.filter(
        (p) => p.is_active && p.has_cards
    );

    if (eligiblePlayers.length === 0) {
        return null; // No eligible players
    }

    if (eligiblePlayers.length === 1) {
        return eligiblePlayers[0]; // Only one player left
    }

    // Sort by position (clockwise order)
    const sorted = [...eligiblePlayers].sort((a, b) => a.position - b.position);

    // Find current player index
    const currentIndex = sorted.findIndex((p) => p.id === currentPlayerId);

    if (currentIndex === -1) {
        // Current player not found, start with lowest position
        return sorted[0];
    }

    // Move to next position, loop back if at end
    const nextIndex = (currentIndex + 1) % sorted.length;
    return sorted[nextIndex];
}

/**
 * Get next player ID (convenience function)
 */
export function getNextTurnPlayerId(
    players: TurnPlayer[],
    currentPlayerId: string
): string | null {
    const next = getNextTurnPlayer(players, currentPlayerId);
    return next?.id ?? null;
}

// ================================
// VALIDATION
// ================================

/**
 * Validate it's the player's turn
 */
export function isPlayerTurn(
    currentTurnPlayerId: string,
    playerId: string
): boolean {
    return currentTurnPlayerId === playerId;
}

/**
 * Validate player is eligible to play
 * - Must be active
 * - Must have cards
 */
export function isPlayerEligible(player: TurnPlayer): boolean {
    return player.is_active && player.has_cards;
}

/**
 * Get all eligible players
 */
export function getEligiblePlayers(players: TurnPlayer[]): TurnPlayer[] {
    return players.filter((p) => p.is_active && p.has_cards);
}

/**
 * Count eligible players
 */
export function countEligiblePlayers(players: TurnPlayer[]): number {
    return getEligiblePlayers(players).length;
}

// ================================
// SUPABASE INTEGRATION
// ================================

/**
 * Fetch players for turn calculation
 */
export async function fetchTurnPlayers(roomId: string): Promise<TurnPlayer[]> {
    const { data: players, error } = await supabase
        .from("players")
        .select("id, user_id, position, is_active")
        .eq("room_id", roomId)
        .order("position", { ascending: true });

    if (error) {
        console.error("[Turn] Failed to fetch players:", error);
        return [];
    }

    // Get card counts for each player
    const { data: hands, error: handsError } = await supabase
        .from("hands")
        .select("player_id")
        .eq("room_id", roomId);

    if (handsError) {
        console.error("[Turn] Failed to fetch hands:", handsError);
    }

    // Count cards per player
    const cardCounts = new Map<string, number>();
    hands?.forEach((h) => {
        const count = cardCounts.get(h.player_id) ?? 0;
        cardCounts.set(h.player_id, count + 1);
    });

    return players.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        position: p.position,
        is_active: p.is_active,
        has_cards: (cardCounts.get(p.id) ?? 0) > 0,
    }));
}

/**
 * Advance turn to next player in room
 */
export async function advanceTurn(
    roomId: string,
    currentPlayerId: string
): Promise<{ success: boolean; nextPlayerId: string | null; error?: string }> {
    try {
        // 1. Fetch current players
        const players = await fetchTurnPlayers(roomId);

        if (players.length === 0) {
            return { success: false, nextPlayerId: null, error: "No players found" };
        }

        // 2. Calculate next player
        const nextPlayer = getNextTurnPlayer(players, currentPlayerId);

        if (!nextPlayer) {
            return { success: false, nextPlayerId: null, error: "No eligible players" };
        }

        // 3. Update room with next turn
        const { error } = await supabase
            .from("rooms")
            .update({ current_turn_player_id: nextPlayer.id })
            .eq("id", roomId);

        if (error) {
            return { success: false, nextPlayerId: null, error: error.message };
        }

        console.log(`[Turn] Advanced: ${currentPlayerId} → ${nextPlayer.id} (pos ${nextPlayer.position})`);

        return { success: true, nextPlayerId: nextPlayer.id };
    } catch (error) {
        return {
            success: false,
            nextPlayerId: null,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Set specific player as current turn
 */
export async function setCurrentTurn(
    roomId: string,
    playerId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("rooms")
        .update({ current_turn_player_id: playerId })
        .eq("id", roomId);

    if (error) {
        return { success: false, error: error.message };
    }

    console.log(`[Turn] Set to: ${playerId}`);
    return { success: true };
}

/**
 * Get current turn player ID
 */
export async function getCurrentTurnPlayerId(
    roomId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from("rooms")
        .select("current_turn_player_id")
        .eq("id", roomId)
        .single();

    if (error) {
        console.error("[Turn] Failed to get current turn:", error);
        return null;
    }

    return data?.current_turn_player_id ?? null;
}
