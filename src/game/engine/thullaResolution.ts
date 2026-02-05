import { supabase } from "@/services/supabase";
import { Card, Suit, Rank } from "@/context/GameProvider";
import { broadcastGameEvent } from "@/services/gameBroadcast";

// ================================
// TYPES
// ================================

export interface TrickCard {
    playerId: string;
    card: Card;
    isThulla: boolean;
}

export interface Player {
    id: string;
    userId: string;
    position: number;
    isActive: boolean;
    hasCards: boolean;
}

// ================================
// RANK VALUES
// ================================

const RANK_VALUES: Record<Rank, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

// ================================
// FIND SENIOR CARD
// ================================

/**
 * Find the highest card of the active suit in a trick
 * Returns the player who played it (will receive pile)
 */
export function findSeniorCardPlayer(
    trickCards: TrickCard[],
    activeSuit: Suit
): { playerId: string; card: Card } | null {
    const suitCards = trickCards.filter((t) => t.card.suit === activeSuit);

    if (suitCards.length === 0) {
        return null;
    }

    const senior = suitCards.reduce((highest, current) => {
        const currentValue = RANK_VALUES[current.card.rank];
        const highestValue = RANK_VALUES[highest.card.rank];
        return currentValue > highestValue ? current : highest;
    });

    return { playerId: senior.playerId, card: senior.card };
}

// ================================
// THULLA RESOLUTION ENGINE
// ================================

export interface ThullaResolutionResult {
    success: boolean;
    pileReceiverId: string;
    cardCount: number;
    error?: string;
}

/**
 * Resolve THULLA event
 * 
 * 1. Find pile receiver (highest card of active suit)
 * 2. Transfer all pile cards to receiver
 * 3. Set receiver as next turn player
 * 4. Reset trick state
 */
export async function resolveThulla(
    roomId: string,
    trickCards: TrickCard[],
    activeSuit: Suit,
    triggerPlayerId: string
): Promise<ThullaResolutionResult> {
    try {
        // 1. Find pile receiver
        const senior = findSeniorCardPlayer(trickCards, activeSuit);
        let pileReceiverId = senior?.playerId ?? triggerPlayerId;

        // 2. Get players to check receiver is active
        const { data: players } = await supabase
            .from("players")
            .select("id, user_id, position, is_active")
            .eq("room_id", roomId)
            .order("position", { ascending: true });

        if (!players || players.length === 0) {
            return { success: false, pileReceiverId: "", cardCount: 0, error: "No players found" };
        }

        // 3. EDGE CASE: Check if receiver is still active
        const receiver = players.find((p) => p.id === pileReceiverId);
        if (!receiver || !receiver.is_active) {
            // Find next active player clockwise
            pileReceiverId = getNextActivePlayer(players, pileReceiverId) ?? players[0].id;
        }

        // 4. Get pile cards from DB
        const { data: pileCards } = await supabase
            .from("hands")
            .select("card_suit, card_rank")
            .eq("room_id", roomId)
            .eq("in_pile", true);

        // 5. Combine pile + trick cards
        const allCards = [
            ...(pileCards ?? []),
            ...trickCards.map((t) => ({ card_suit: t.card.suit, card_rank: t.card.rank })),
        ];

        // 6. Clear existing pile
        await supabase
            .from("hands")
            .delete()
            .eq("room_id", roomId)
            .eq("in_pile", true);

        // 7. Add cards to receiver's hand
        if (allCards.length > 0) {
            const insertCards = allCards.map((c) => ({
                room_id: roomId,
                player_id: pileReceiverId,
                card_suit: c.card_suit,
                card_rank: c.card_rank,
                in_pile: false,
            }));

            await supabase.from("hands").insert(insertCards);
        }

        // 8. Update room - PILE RECEIVER STARTS NEXT TRICK
        await supabase
            .from("rooms")
            .update({
                current_turn_player_id: pileReceiverId,
                active_suit: null, // Reset for new trick
            })
            .eq("id", roomId);

        // 9. Broadcast resolution event
        await broadcastGameEvent(roomId, {
            type: "PILE_PICKED",
            player_id: pileReceiverId,
            card_count: allCards.length,
        });

        return {
            success: true,
            pileReceiverId,
            cardCount: allCards.length,
        };

    } catch (error) {
        console.error("[THULLA] Resolution error:", error);
        return {
            success: false,
            pileReceiverId: "",
            cardCount: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ================================
// HELPER: Get Next Active Player
// ================================

function getNextActivePlayer(
    players: { id: string; position: number; is_active: boolean }[],
    currentPlayerId: string
): string | null {
    const activePlayers = players
        .filter((p) => p.is_active)
        .sort((a, b) => a.position - b.position);

    if (activePlayers.length === 0) return null;

    const currentIndex = activePlayers.findIndex((p) => p.id === currentPlayerId);
    if (currentIndex === -1) return activePlayers[0].id;

    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex].id;
}

// ================================
// VALIDATION
// ================================

/**
 * Validate THULLA trigger
 * Returns true if card played doesn't match active suit
 */
export function isThullaTriggered(
    cardSuit: Suit,
    activeSuit: Suit | null,
    playerHasSuit: boolean
): boolean {
    // No active suit = first card, not THULLA
    if (!activeSuit) return false;

    // Card matches suit = not THULLA
    if (cardSuit === activeSuit) return false;

    // Card doesn't match AND player has the suit = THULLA
    // (If player doesn't have the suit, they're forced to play off-suit)
    return !playerHasSuit;
}

/**
 * Check if player has any cards of a specific suit
 */
export async function playerHasActiveSuit(
    roomId: string,
    playerId: string,
    suit: Suit
): Promise<boolean> {
    const { data } = await supabase
        .from("hands")
        .select("id")
        .eq("room_id", roomId)
        .eq("player_id", playerId)
        .eq("card_suit", suit)
        .eq("in_pile", false)
        .limit(1);

    return (data?.length ?? 0) > 0;
}
