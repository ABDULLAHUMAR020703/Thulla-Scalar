import { Card, Suit, Player, GameState } from "@/context/GameProvider";
import { getRankValue } from "../utils/cardUtils";

// ================================
// TYPES
// ================================

export interface TrickPlay {
    playerId: string;
    card: Card;
    timestamp: number;
}

export interface TrickState {
    plays: TrickPlay[];
    leadSuit: Suit | null;
    leadPlayerId: string | null;
    isComplete: boolean;
    winnerId: string | null;
    isThulla: boolean;
}

export interface TrickResult {
    winnerId: string;
    winningCard: Card;
    isThulla: boolean;
    pileTaken: boolean;
    pileCards: Card[];
    nextStarterId: string;
}

// ================================
// TRICK ENGINE
// ================================

/**
 * Create initial trick state
 */
export function createTrickState(): TrickState {
    return {
        plays: [],
        leadSuit: null,
        leadPlayerId: null,
        isComplete: false,
        winnerId: null,
        isThulla: false,
    };
}

/**
 * Check if a player has any cards of the specified suit
 */
export function playerHasSuit(player: Player, suit: Suit): boolean {
    return player.hand.some((card) => card.suit === suit);
}

/**
 * Check if a play is a Thulla (player didn't follow suit when they could have)
 * Thulla occurs when a player plays off-suit while still having cards of lead suit
 */
export function checkForThulla(
    play: TrickPlay,
    player: Player,
    leadSuit: Suit | null
): boolean {
    if (!leadSuit) return false; // First play can't be Thulla

    // If player played the lead suit, no Thulla
    if (play.card.suit === leadSuit) return false;

    // Check if player still has cards of lead suit in hand (before playing this card)
    // We need to check the hand INCLUDING the card they just played
    const handWithPlayedCard = [...player.hand, play.card];
    const hasLeadSuit = handWithPlayedCard.filter((c) => c.suit === leadSuit).length > 0;

    // If they had lead suit cards but played something else = Thulla
    return hasLeadSuit;
}

/**
 * Find the highest card of a specific suit in the trick
 */
export function findHighestOfSuit(plays: TrickPlay[], suit: Suit): TrickPlay | null {
    const suitPlays = plays.filter((p) => p.card.suit === suit);
    if (suitPlays.length === 0) return null;

    return suitPlays.reduce((highest, play) => {
        return getRankValue(play.card.rank) > getRankValue(highest.card.rank)
            ? play
            : highest;
    });
}

/**
 * Check if all players followed suit in the trick
 */
export function allFollowedSuit(plays: TrickPlay[], leadSuit: Suit): boolean {
    if (plays.length === 0) return true;
    return plays.every((play) => play.card.suit === leadSuit);
}

/**
 * Resolve a completed trick
 * Returns the result including who wins, if Thulla occurred, etc.
 */
export function resolveTrick(
    trick: TrickState,
    players: Player[],
    trumpSuit: Suit | null
): TrickResult {
    if (trick.plays.length === 0 || !trick.leadSuit || !trick.leadPlayerId) {
        throw new Error("Cannot resolve empty or incomplete trick");
    }

    const leadSuit = trick.leadSuit;

    // Check if Thulla occurred (anyone didn't follow suit when they could)
    const isThulla = trick.isThulla;

    // Check if everyone followed suit
    const everyoneFollowed = allFollowedSuit(trick.plays, leadSuit);

    // Find the winning play
    let winningPlay: TrickPlay;

    if (trumpSuit && trick.plays.some((p) => p.card.suit === trumpSuit)) {
        // If trump was played, highest trump wins
        const trumpPlays = trick.plays.filter((p) => p.card.suit === trumpSuit);
        winningPlay = trumpPlays.reduce((highest, play) => {
            return getRankValue(play.card.rank) > getRankValue(highest.card.rank)
                ? play
                : highest;
        });
    } else {
        // Highest of lead suit wins
        winningPlay = findHighestOfSuit(trick.plays, leadSuit)!;
    }

    // Determine outcome based on Thulla rules
    if (isThulla || !everyoneFollowed) {
        // THULLA: Winner takes the pile
        return {
            winnerId: winningPlay.playerId,
            winningCard: winningPlay.card,
            isThulla: true,
            pileTaken: true,
            pileCards: trick.plays.map((p) => p.card),
            nextStarterId: winningPlay.playerId,
        };
    } else {
        // Everyone followed suit: Clear pile, don't give to anyone
        return {
            winnerId: winningPlay.playerId,
            winningCard: winningPlay.card,
            isThulla: false,
            pileTaken: false,
            pileCards: [],
            nextStarterId: winningPlay.playerId,
        };
    }
}

/**
 * Add a play to the trick and check for Thulla
 */
export function addPlayToTrick(
    trick: TrickState,
    play: TrickPlay,
    player: Player
): TrickState {
    const newPlays = [...trick.plays, play];

    // First play sets the lead suit
    const leadSuit = trick.leadSuit ?? play.card.suit;
    const leadPlayerId = trick.leadPlayerId ?? play.playerId;

    // Check for Thulla on this play
    const playIsThulla = checkForThulla(play, player, trick.leadSuit);

    return {
        ...trick,
        plays: newPlays,
        leadSuit,
        leadPlayerId,
        isThulla: trick.isThulla || playIsThulla,
    };
}

// ================================
// TURN MANAGER
// ================================

/**
 * Get the next player ID in turn order
 */
export function getNextPlayerId(
    players: Player[],
    currentPlayerId: string
): string {
    const currentIndex = players.findIndex((p) => p.id === currentPlayerId);
    if (currentIndex === -1) {
        throw new Error("Current player not found");
    }

    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex].id;
}

/**
 * Check if all players have played in the current trick
 */
export function isTrickComplete(trick: TrickState, playerCount: number): boolean {
    return trick.plays.length >= playerCount;
}

/**
 * Determine whose turn it is
 */
export function getCurrentTurn(
    trick: TrickState,
    players: Player[],
    trickStarterId: string
): string {
    if (trick.plays.length === 0) {
        return trickStarterId;
    }

    const lastPlay = trick.plays[trick.plays.length - 1];
    return getNextPlayerId(players, lastPlay.playerId);
}

// ================================
// GAME STATE HELPERS
// ================================

/**
 * Check if a card can be played based on game rules
 */
export function canPlayCard(
    card: Card,
    player: Player,
    trick: TrickState
): boolean {
    // First play of trick: any card is valid
    if (!trick.leadSuit) return true;

    // Must follow suit if possible
    const hasLeadSuit = player.hand.some((c) => c.suit === trick.leadSuit);

    if (hasLeadSuit) {
        // Must play lead suit
        return card.suit === trick.leadSuit;
    }

    // No lead suit cards: can play anything (this triggers Thulla if they actually have lead suit)
    return true;
}

/**
 * Get all playable cards for a player
 */
export function getPlayableCards(player: Player, trick: TrickState): Card[] {
    return player.hand.filter((card) => canPlayCard(card, player, trick));
}

/**
 * Check if the game/round is over (a player has no cards)
 */
export function isRoundOver(players: Player[]): boolean {
    return players.some((p) => p.hand.length === 0);
}

/**
 * Get the round winner (player with no cards left)
 */
export function getRoundWinner(players: Player[]): Player | null {
    return players.find((p) => p.hand.length === 0) ?? null;
}
