import { Card, Suit, Rank } from "@/context/GameProvider";
import { supabase } from "@/services/supabase";

// ================================
// ACE OF SPADES GAME START LOGIC
// ================================

/**
 * Find which player holds the Ace of Spades
 * This player will start the game
 */
export function findAceOfSpadesHolder<T extends { id: string; hand: Card[] }>(
    players: T[]
): T | null {
    for (const player of players) {
        const hasAceOfSpades = player.hand.some(
            (card) => card.suit === "spades" && card.rank === "A"
        );
        if (hasAceOfSpades) {
            return player;
        }
    }
    return null;
}

/**
 * Validate that a player actually holds Ace of Spades
 */
export function playerHasAceOfSpades(hand: Card[]): boolean {
    return hand.some((card) => card.suit === "spades" && card.rank === "A");
}

/**
 * Get Ace of Spades card from a hand
 */
export function getAceOfSpades(hand: Card[]): Card | null {
    return hand.find((card) => card.suit === "spades" && card.rank === "A") ?? null;
}

/**
 * Validate first move is Ace of Spades
 * First trick must start with Ace of Spades
 */
export function validateFirstMove(card: Card, isFirstTrick: boolean): boolean {
    if (!isFirstTrick) return true;
    return card.suit === "spades" && card.rank === "A";
}

// ================================
// SUPABASE GAME START LOGIC
// ================================

interface HandRecord {
    player_id: string;
    card_suit: Suit;
    card_rank: Rank;
}

/**
 * Find Ace of Spades holder from Supabase hands table
 * Returns the player_id who holds Ace of Spades
 */
export async function findAceOfSpadesHolderFromDB(
    roomId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from("hands")
        .select("player_id")
        .eq("room_id", roomId)
        .eq("card_suit", "spades")
        .eq("card_rank", "A")
        .single();

    if (error) {
        console.error("[GameStart] Failed to find Ace of Spades holder:", error);
        return null;
    }

    return data?.player_id ?? null;
}

/**
 * Set the starting player for the room (Ace of Spades holder)
 * Also sets active_suit to 'spades'
 */
export async function setGameStartPlayer(roomId: string): Promise<{
    success: boolean;
    startingPlayerId: string | null;
    error?: string;
}> {
    // 1. Find who holds Ace of Spades
    const startingPlayerId = await findAceOfSpadesHolderFromDB(roomId);

    if (!startingPlayerId) {
        return {
            success: false,
            startingPlayerId: null,
            error: "Could not find Ace of Spades holder",
        };
    }

    // 2. Update room with starting player and active suit
    const { error } = await supabase
        .from("rooms")
        .update({
            current_turn_player_id: startingPlayerId,
            active_suit: "spades",
            status: "playing",
        })
        .eq("id", roomId);

    if (error) {
        console.error("[GameStart] Failed to set starting player:", error);
        return {
            success: false,
            startingPlayerId: null,
            error: error.message,
        };
    }

    console.log(`[GameStart] Room ${roomId} started by player ${startingPlayerId}`);

    return {
        success: true,
        startingPlayerId,
    };
}

// ================================
// TURN ORDER (CLOCKWISE)
// ================================

export interface PlayerWithPosition {
    id: string;
    position: number;
    isActive: boolean;
}

/**
 * Get next player in clockwise order
 * Skips inactive/finished players
 */
export function getNextPlayerClockwise(
    players: PlayerWithPosition[],
    currentPlayerId: string
): string | null {
    const activePlayers = players
        .filter((p) => p.isActive)
        .sort((a, b) => a.position - b.position);

    if (activePlayers.length === 0) return null;

    const currentIndex = activePlayers.findIndex((p) => p.id === currentPlayerId);
    if (currentIndex === -1) return activePlayers[0].id;

    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex].id;
}

/**
 * Validate it's the correct player's turn
 */
export function validatePlayerTurn(
    currentTurnPlayerId: string,
    playerId: string
): boolean {
    return currentTurnPlayerId === playerId;
}
