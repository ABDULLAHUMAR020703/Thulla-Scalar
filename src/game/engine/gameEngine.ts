import { Card, Suit, Player, GameState, GameStatus } from "@/context/GameProvider";
import {
    TrickState,
    TrickResult,
    TrickPlay,
    createTrickState,
    addPlayToTrick,
    resolveTrick,
    isTrickComplete,
    getCurrentTurn,
    getNextPlayerId,
    canPlayCard,
    isRoundOver,
    getRoundWinner,
} from "./trickEngine";
import { sortCards } from "../utils/cardUtils";

// ================================
// GAME ENGINE TYPES
// ================================

export interface GameEngineState {
    // Core game state
    roomId: string;
    players: Player[];
    deck: Card[];
    trumpSuit: Suit | null;
    status: GameStatus;
    round: number;

    // Trick management
    currentTrick: TrickState;
    trickStarterId: string | null;
    currentPlayerId: string | null;

    // Pile (collected cards)
    pile: Card[];

    // Animation triggers
    animations: GameAnimations;

    // History
    lastTrickResult: TrickResult | null;
    scores: Record<string, number>;
}

export interface GameAnimations {
    clearPile: boolean;
    dealCards: boolean;
    collectPile: string | null; // playerId who collects
    showThulla: boolean;
    showWinner: string | null;
}

export type GameAction =
    | { type: "PLAY_CARD"; playerId: string; card: Card }
    | { type: "START_GAME"; players: Player[]; trumpSuit: Suit }
    | { type: "START_ROUND" }
    | { type: "DEAL_CARDS"; hands: Record<string, Card[]> }
    | { type: "CLEAR_ANIMATION"; animation: keyof GameAnimations }
    | { type: "RESET_TRICK" }
    | { type: "END_GAME" };

// ================================
// INITIAL STATE
// ================================

export function createInitialGameState(roomId: string): GameEngineState {
    return {
        roomId,
        players: [],
        deck: [],
        trumpSuit: null,
        status: "waiting",
        round: 0,
        currentTrick: createTrickState(),
        trickStarterId: null,
        currentPlayerId: null,
        pile: [],
        animations: {
            clearPile: false,
            dealCards: false,
            collectPile: null,
            showThulla: false,
            showWinner: null,
        },
        lastTrickResult: null,
        scores: {},
    };
}

// ================================
// GAME REDUCER
// ================================

export function gameReducer(
    state: GameEngineState,
    action: GameAction
): GameEngineState {
    switch (action.type) {
        case "START_GAME": {
            const { players, trumpSuit } = action;
            const firstPlayer = players.find((p) => p.isHost) ?? players[0];

            // Initialize scores
            const scores: Record<string, number> = {};
            players.forEach((p) => {
                scores[p.id] = 0;
            });

            return {
                ...state,
                players,
                trumpSuit,
                status: "playing",
                round: 1,
                currentTrick: createTrickState(),
                trickStarterId: firstPlayer.id,
                currentPlayerId: firstPlayer.id,
                pile: [],
                scores,
                animations: { ...state.animations, dealCards: true },
            };
        }

        case "DEAL_CARDS": {
            const { hands } = action;
            const updatedPlayers = state.players.map((player) => ({
                ...player,
                hand: sortCards(hands[player.id] ?? []),
            }));

            return {
                ...state,
                players: updatedPlayers,
                animations: { ...state.animations, dealCards: false },
            };
        }

        case "PLAY_CARD": {
            const { playerId, card } = action;

            // Validate it's this player's turn
            if (state.currentPlayerId !== playerId) {
                console.warn("Not this player's turn");
                return state;
            }

            // Find player
            const playerIndex = state.players.findIndex((p) => p.id === playerId);
            if (playerIndex === -1) {
                console.warn("Player not found");
                return state;
            }

            const player = state.players[playerIndex];

            // Validate card can be played
            if (!canPlayCard(card, player, state.currentTrick)) {
                console.warn("Cannot play this card - must follow suit");
                return state;
            }

            // Remove card from player's hand
            const updatedPlayers = [...state.players];
            updatedPlayers[playerIndex] = {
                ...player,
                hand: player.hand.filter((c) => c.id !== card.id),
            };

            // Add play to trick
            const play: TrickPlay = {
                playerId,
                card,
                timestamp: Date.now(),
            };

            const updatedTrick = addPlayToTrick(state.currentTrick, play, player);

            // Add card to pile for display
            const updatedPile = [...state.pile, card];

            // Check if trick is complete
            if (isTrickComplete(updatedTrick, state.players.length)) {
                // Resolve the trick
                const result = resolveTrick(updatedTrick, updatedPlayers, state.trumpSuit);

                let finalPlayers = updatedPlayers;
                let animations = { ...state.animations };

                if (result.isThulla && result.pileTaken) {
                    // THULLA: Winner takes the pile
                    const winnerIndex = finalPlayers.findIndex((p) => p.id === result.winnerId);
                    if (winnerIndex !== -1) {
                        finalPlayers = [...finalPlayers];
                        finalPlayers[winnerIndex] = {
                            ...finalPlayers[winnerIndex],
                            hand: [...finalPlayers[winnerIndex].hand, ...updatedPile],
                        };
                    }
                    animations.collectPile = result.winnerId;
                    animations.showThulla = true;
                } else {
                    // Normal: Clear pile
                    animations.clearPile = true;
                }

                // Check for round end
                const roundOver = isRoundOver(finalPlayers);
                const roundWinner = getRoundWinner(finalPlayers);

                if (roundOver && roundWinner) {
                    animations.showWinner = roundWinner.id;
                }

                // Update scores
                const newScores = { ...state.scores };
                if (result.isThulla) {
                    // Thulla penalty: winner gets cards added (bad in Thulla)
                    newScores[result.winnerId] = (newScores[result.winnerId] ?? 0) + updatedPile.length;
                }

                return {
                    ...state,
                    players: finalPlayers,
                    pile: result.pileTaken ? [] : updatedPile,
                    currentTrick: updatedTrick,
                    currentPlayerId: result.nextStarterId,
                    trickStarterId: result.nextStarterId,
                    lastTrickResult: result,
                    status: roundOver ? "finished" : "playing",
                    scores: newScores,
                    animations,
                };
            } else {
                // Trick continues - move to next player
                const nextPlayerId = getNextPlayerId(updatedPlayers, playerId);

                return {
                    ...state,
                    players: updatedPlayers,
                    pile: updatedPile,
                    currentTrick: updatedTrick,
                    currentPlayerId: nextPlayerId,
                };
            }
        }

        case "RESET_TRICK": {
            return {
                ...state,
                currentTrick: createTrickState(),
                pile: [],
                animations: {
                    ...state.animations,
                    clearPile: false,
                    collectPile: null,
                    showThulla: false,
                },
            };
        }

        case "CLEAR_ANIMATION": {
            return {
                ...state,
                animations: {
                    ...state.animations,
                    [action.animation]: action.animation === "collectPile" || action.animation === "showWinner"
                        ? null
                        : false,
                },
            };
        }

        case "START_ROUND": {
            // Find player with lowest score to start
            const lowestScorePlayer = state.players.reduce((lowest, player) => {
                const playerScore = state.scores[player.id] ?? 0;
                const lowestScore = state.scores[lowest.id] ?? 0;
                return playerScore < lowestScore ? player : lowest;
            });

            return {
                ...state,
                round: state.round + 1,
                status: "playing",
                currentTrick: createTrickState(),
                trickStarterId: lowestScorePlayer.id,
                currentPlayerId: lowestScorePlayer.id,
                pile: [],
                lastTrickResult: null,
                animations: {
                    clearPile: false,
                    dealCards: true,
                    collectPile: null,
                    showThulla: false,
                    showWinner: null,
                },
            };
        }

        case "END_GAME": {
            return {
                ...state,
                status: "finished",
            };
        }

        default:
            return state;
    }
}

// ================================
// DECK CREATION
// ================================

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;

/**
 * Create a standard 52-card deck
 */
export function createDeck(): Card[] {
    const deck: Card[] = [];
    let id = 0;

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                id: `card-${id++}`,
                suit,
                rank,
            });
        }
    }

    return deck;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Deal cards to players
 */
export function dealCards(
    deck: Card[],
    playerCount: number,
    cardsPerPlayer: number = 13
): { hands: Card[][]; remainingDeck: Card[] } {
    const shuffled = shuffleDeck(deck);
    const hands: Card[][] = [];

    for (let i = 0; i < playerCount; i++) {
        const start = i * cardsPerPlayer;
        const end = start + cardsPerPlayer;
        hands.push(shuffled.slice(start, end));
    }

    const totalDealt = playerCount * cardsPerPlayer;
    const remainingDeck = shuffled.slice(totalDealt);

    return { hands, remainingDeck };
}
