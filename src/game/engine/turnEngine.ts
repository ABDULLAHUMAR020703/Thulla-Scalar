/**
 * Turn Engine
 * 
 * Pure logic for turn management. No direct database writes.
 * All mutations go through Edge Functions via gameActions.ts.
 */

// ================================
// TYPES
// ================================

export interface TurnPlayer {
    id: string;
    user_id: string;
    position: number;
    is_active: boolean;
    has_cards: boolean;
}

// ================================
// CLOCKWISE TURN ROTATION (Pure Logic)
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
    const eligiblePlayers = players.filter(
        (p) => p.is_active && p.has_cards
    );

    if (eligiblePlayers.length === 0) {
        return null;
    }

    if (eligiblePlayers.length === 1) {
        return eligiblePlayers[0];
    }

    const sorted = [...eligiblePlayers].sort((a, b) => a.position - b.position);
    const currentIndex = sorted.findIndex((p) => p.id === currentPlayerId);

    if (currentIndex === -1) {
        return sorted[0];
    }

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
// VALIDATION (Pure Logic)
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
