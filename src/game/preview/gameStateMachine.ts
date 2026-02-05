import { Card, Suit, Rank } from "@/context/GameProvider";

// ================================
// TYPES
// ================================

export interface PreviewPlayer {
    id: string;
    name: string;
    avatar: string;
    hand: Card[];
    isBot: boolean;
    isActive: boolean;
    hasFinished: boolean;
    position: number;
}

export interface TrickCard {
    playerId: string;
    card: Card;
    isThulla: boolean;
}

export interface PreviewGameState {
    // Game setup
    players: PreviewPlayer[];
    deck: Card[];

    // Turn management
    currentPlayerId: string;
    startingPlayerId: string;
    turnOrder: string[];

    // Trick state
    activeSuit: Suit | null;
    currentTrick: TrickCard[];
    pile: Card[];
    seniorCard: Card | null;
    seniorPlayerId: string | null;

    // Game state
    status: "waiting" | "dealing" | "playing" | "thulla" | "trickEnd" | "finished";
    winnerId: string | null;
    round: number;

    // Animation events
    pendingAnimations: AnimationEvent[];

    // Preview controls
    isPaused: boolean;
    speed: number;
    stepMode: boolean;
}

export type AnimationEvent =
    | { type: "DEAL_CARDS" }
    | { type: "CARD_PLAYED"; playerId: string; card: Card }
    | { type: "THULLA_TRIGGERED"; playerId: string; pickupPlayerId: string }
    | { type: "PILE_PICKUP"; playerId: string; cards: Card[] }
    | { type: "TRICK_CLEARED"; winnerId: string }
    | { type: "GAME_FINISHED"; winnerId: string };

export type PreviewAction =
    | { type: "START_GAME" }
    | { type: "DEAL_COMPLETE" }
    | { type: "PLAY_CARD"; playerId: string; card: Card }
    | { type: "RESOLVE_TRICK" }
    | { type: "ANIMATION_COMPLETE"; animation: AnimationEvent }
    | { type: "PAUSE" }
    | { type: "RESUME" }
    | { type: "SET_SPEED"; speed: number }
    | { type: "STEP_NEXT" }
    | { type: "FORCE_THULLA" }
    | { type: "RESTART" };

// ================================
// CONSTANTS
// ================================

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const RANK_VALUES: Record<Rank, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

const BOT_NAMES = ["Bot Alpha", "Bot Beta", "Bot Gamma"];
const BOT_AVATARS = ["🤖", "🎮", "🎯"];

// Ace of Spades detection
function findAceOfSpadesHolder(players: PreviewPlayer[]): PreviewPlayer | null {
    for (const player of players) {
        const hasAce = player.hand.some(
            (card) => card.suit === "spades" && card.rank === "A"
        );
        if (hasAce) return player;
    }
    return null;
}

// ================================
// DECK & SETUP
// ================================

export function createDeck(): Card[] {
    const deck: Card[] = [];
    let id = 0;

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ id: `card-${id++}`, suit, rank });
        }
    }

    return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function createPlayers(): PreviewPlayer[] {
    const players: PreviewPlayer[] = [
        {
            id: "player-human",
            name: "You",
            avatar: "👤",
            hand: [],
            isBot: false,
            isActive: true,
            hasFinished: false,
            position: 0,
        },
    ];

    for (let i = 0; i < 3; i++) {
        players.push({
            id: `player-bot-${i}`,
            name: BOT_NAMES[i],
            avatar: BOT_AVATARS[i],
            hand: [],
            isBot: true,
            isActive: true,
            hasFinished: false,
            position: i + 1,
        });
    }

    return players;
}

export function dealCards(deck: Card[], players: PreviewPlayer[]): PreviewPlayer[] {
    const cardsPerPlayer = Math.floor(deck.length / players.length);

    return players.map((player, index) => ({
        ...player,
        hand: sortHand(deck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer)),
    }));
}

export function sortHand(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
        const suitOrder = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
        if (suitOrder !== 0) return suitOrder;
        return RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
    });
}

// ================================
// GAME LOGIC
// ================================

export function getRankValue(rank: Rank): number {
    return RANK_VALUES[rank];
}

export function findSeniorCard(trick: TrickCard[], activeSuit: Suit): { card: Card; playerId: string } | null {
    const suitCards = trick.filter(t => t.card.suit === activeSuit);
    if (suitCards.length === 0) return null;

    const senior = suitCards.reduce((highest, current) =>
        getRankValue(current.card.rank) > getRankValue(highest.card.rank) ? current : highest
    );

    return { card: senior.card, playerId: senior.playerId };
}

export function playerHasSuit(player: PreviewPlayer, suit: Suit): boolean {
    return player.hand.some(card => card.suit === suit);
}

export function getNextActivePlayer(players: PreviewPlayer[], currentId: string): string | null {
    const activePlayers = players.filter(p => p.isActive && !p.hasFinished);
    if (activePlayers.length === 0) return null;

    const currentIndex = activePlayers.findIndex(p => p.id === currentId);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex].id;
}

export function getActivePlayerCount(players: PreviewPlayer[]): number {
    return players.filter(p => p.isActive && !p.hasFinished).length;
}

// ================================
// INITIAL STATE
// ================================

export function createInitialState(): PreviewGameState {
    const players = createPlayers();
    const deck = shuffleDeck(createDeck());
    const randomStartIndex = Math.floor(Math.random() * players.length);

    return {
        players,
        deck,
        currentPlayerId: players[randomStartIndex].id,
        startingPlayerId: players[randomStartIndex].id,
        turnOrder: players.map(p => p.id),
        activeSuit: null,
        currentTrick: [],
        pile: [],
        seniorCard: null,
        seniorPlayerId: null,
        status: "waiting",
        winnerId: null,
        round: 0,
        pendingAnimations: [],
        isPaused: false,
        speed: 1,
        stepMode: false,
    };
}

// ================================
// GAME REDUCER
// ================================

export function previewGameReducer(state: PreviewGameState, action: PreviewAction): PreviewGameState {
    switch (action.type) {
        case "START_GAME": {
            const deck = shuffleDeck(createDeck());
            const players = dealCards(deck, createPlayers());

            // Find who holds Ace of Spades - they start first
            const aceHolder = findAceOfSpadesHolder(players);
            const startingPlayerId = aceHolder?.id ?? players[0].id;

            console.log(`[Game] Ace of Spades holder: ${aceHolder?.name ?? "Not found"}`);

            return {
                ...state,
                players,
                deck: [],
                currentPlayerId: startingPlayerId,
                startingPlayerId: startingPlayerId,
                turnOrder: players.map(p => p.id),
                activeSuit: "spades", // First trick must be spades
                currentTrick: [],
                pile: [],
                seniorCard: null,
                seniorPlayerId: null,
                status: "dealing",
                winnerId: null,
                round: 1,
                pendingAnimations: [{ type: "DEAL_CARDS" }],
            };
        }

        case "DEAL_COMPLETE": {
            return {
                ...state,
                status: "playing",
                pendingAnimations: state.pendingAnimations.filter(a => a.type !== "DEAL_CARDS"),
            };
        }

        case "PLAY_CARD": {
            const { playerId, card } = action;

            // Validate turn
            if (state.currentPlayerId !== playerId) {
                console.warn("Not this player's turn");
                return state;
            }

            const player = state.players.find(p => p.id === playerId);
            if (!player) return state;

            // Determine if this is a THULLA
            const isFirstCard = state.currentTrick.length === 0;
            let isThulla = false;
            let newActiveSuit = state.activeSuit;

            if (isFirstCard) {
                // First card sets the suit
                newActiveSuit = card.suit;
            } else if (state.activeSuit && card.suit !== state.activeSuit) {
                // Player didn't follow suit - this is THULLA
                isThulla = true;
            }

            // Remove card from player's hand
            const updatedPlayers = state.players.map(p => {
                if (p.id === playerId) {
                    const newHand = p.hand.filter(c => c.id !== card.id);
                    return {
                        ...p,
                        hand: newHand,
                        hasFinished: newHand.length === 0,
                    };
                }
                return p;
            });

            // Add to trick
            const newTrick: TrickCard[] = [...state.currentTrick, { playerId, card, isThulla }];

            // Find senior card
            const senior = findSeniorCard(newTrick, newActiveSuit!);

            // Add animation
            const animations: AnimationEvent[] = [
                ...state.pendingAnimations,
                { type: "CARD_PLAYED", playerId, card },
            ];

            // Check if THULLA triggered
            if (isThulla) {
                return {
                    ...state,
                    players: updatedPlayers,
                    currentTrick: newTrick,
                    activeSuit: newActiveSuit,
                    seniorCard: senior?.card ?? null,
                    seniorPlayerId: senior?.playerId ?? null,
                    status: "thulla",
                    pendingAnimations: [
                        ...animations,
                        { type: "THULLA_TRIGGERED", playerId, pickupPlayerId: senior?.playerId ?? playerId },
                    ],
                };
            }

            // Check if trick is complete (all active players played)
            const activeCount = getActivePlayerCount(updatedPlayers);
            const trickComplete = newTrick.length >= activeCount;

            if (trickComplete) {
                return {
                    ...state,
                    players: updatedPlayers,
                    currentTrick: newTrick,
                    activeSuit: newActiveSuit,
                    seniorCard: senior?.card ?? null,
                    seniorPlayerId: senior?.playerId ?? null,
                    status: "trickEnd",
                    pendingAnimations: animations,
                };
            }

            // Continue to next player
            const nextPlayerId = getNextActivePlayer(updatedPlayers, playerId);

            // Check for win
            const winner = updatedPlayers.find(p => p.hasFinished);
            if (winner) {
                return {
                    ...state,
                    players: updatedPlayers,
                    currentTrick: newTrick,
                    activeSuit: newActiveSuit,
                    seniorCard: senior?.card ?? null,
                    seniorPlayerId: senior?.playerId ?? null,
                    status: "finished",
                    winnerId: winner.id,
                    pendingAnimations: [...animations, { type: "GAME_FINISHED", winnerId: winner.id }],
                };
            }

            return {
                ...state,
                players: updatedPlayers,
                currentTrick: newTrick,
                activeSuit: newActiveSuit,
                currentPlayerId: nextPlayerId ?? state.currentPlayerId,
                seniorCard: senior?.card ?? null,
                seniorPlayerId: senior?.playerId ?? null,
                pendingAnimations: animations,
            };
        }

        case "RESOLVE_TRICK": {
            const senior = findSeniorCard(state.currentTrick, state.activeSuit!);
            const trickCards = state.currentTrick.map(t => t.card);

            if (state.status === "thulla") {
                // THULLA: Senior card holder picks up the pile
                const pickupPlayerId = senior?.playerId ?? state.currentPlayerId;
                const allCards = [...state.pile, ...trickCards];

                const updatedPlayers = state.players.map(p => {
                    if (p.id === pickupPlayerId) {
                        return {
                            ...p,
                            hand: sortHand([...p.hand, ...allCards]),
                            hasFinished: false, // Can't be finished if picking up
                        };
                    }
                    return p;
                });

                // Check for winner
                const winner = updatedPlayers.find(p => p.hasFinished);

                return {
                    ...state,
                    players: updatedPlayers,
                    currentTrick: [],
                    pile: [],
                    activeSuit: null,
                    seniorCard: null,
                    seniorPlayerId: null,
                    currentPlayerId: pickupPlayerId,
                    startingPlayerId: pickupPlayerId,
                    status: winner ? "finished" : "playing",
                    winnerId: winner?.id ?? null,
                    round: state.round + 1,
                    pendingAnimations: [
                        { type: "PILE_PICKUP", playerId: pickupPlayerId, cards: allCards },
                    ],
                };
            } else {
                // Normal trick: Clear pile, winner starts next
                const winnerId = senior?.playerId ?? state.currentPlayerId;

                // Check for game winner
                const gameWinner = state.players.find(p => p.hasFinished);

                return {
                    ...state,
                    currentTrick: [],
                    pile: [],
                    activeSuit: null,
                    seniorCard: null,
                    seniorPlayerId: null,
                    currentPlayerId: winnerId,
                    startingPlayerId: winnerId,
                    status: gameWinner ? "finished" : "playing",
                    winnerId: gameWinner?.id ?? null,
                    round: state.round + 1,
                    pendingAnimations: [
                        { type: "TRICK_CLEARED", winnerId },
                    ],
                };
            }
        }

        case "ANIMATION_COMPLETE": {
            return {
                ...state,
                pendingAnimations: state.pendingAnimations.filter(a => a !== action.animation),
            };
        }

        case "PAUSE": {
            return { ...state, isPaused: true };
        }

        case "RESUME": {
            return { ...state, isPaused: false };
        }

        case "SET_SPEED": {
            return { ...state, speed: action.speed };
        }

        case "STEP_NEXT": {
            return { ...state, stepMode: true };
        }

        case "FORCE_THULLA": {
            // Trigger a forced THULLA state for testing
            return {
                ...state,
                status: "thulla",
                pendingAnimations: [
                    ...state.pendingAnimations,
                    { type: "THULLA_TRIGGERED", playerId: state.currentPlayerId, pickupPlayerId: state.currentPlayerId },
                ],
            };
        }

        case "RESTART": {
            return createInitialState();
        }

        default:
            return state;
    }
}
