"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Card Types
export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
}

export interface Player {
    id: string;
    name: string;
    avatar?: string;
    hand: Card[];
    score: number;
    isReady: boolean;
    isHost: boolean;
}

export type GameStatus = "waiting" | "playing" | "paused" | "finished";

export interface GameState {
    roomId: string | null;
    players: Player[];
    currentPlayerId: string | null;
    status: GameStatus;
    deck: Card[];
    pile: Card[];
    trumpSuit: Suit | null;
    round: number;
}

interface GameContextType {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    currentPlayer: Player | null;
    isMyTurn: boolean;
    playCard: (card: Card) => void;
    drawCard: () => void;
    resetGame: () => void;
}

const initialGameState: GameState = {
    roomId: null,
    players: [],
    currentPlayerId: null,
    status: "waiting",
    deck: [],
    pile: [],
    trumpSuit: null,
    round: 0,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
    children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
    const [gameState, setGameState] = useState<GameState>(initialGameState);

    // Get current player based on some local identifier (would be from auth in production)
    const currentPlayer = gameState.players[0] || null;

    // Check if it's the current player's turn
    const isMyTurn = currentPlayer?.id === gameState.currentPlayerId;

    // Play a card from hand
    const playCard = (card: Card) => {
        if (!currentPlayer || !isMyTurn) return;

        setGameState((prev) => ({
            ...prev,
            pile: [...prev.pile, card],
            players: prev.players.map((p) =>
                p.id === currentPlayer.id
                    ? { ...p, hand: p.hand.filter((c) => c.id !== card.id) }
                    : p
            ),
        }));
    };

    // Draw a card from deck
    const drawCard = () => {
        if (!currentPlayer || gameState.deck.length === 0) return;

        const [drawnCard, ...remainingDeck] = gameState.deck;

        setGameState((prev) => ({
            ...prev,
            deck: remainingDeck,
            players: prev.players.map((p) =>
                p.id === currentPlayer.id
                    ? { ...p, hand: [...p.hand, drawnCard] }
                    : p
            ),
        }));
    };

    // Reset game to initial state
    const resetGame = () => {
        setGameState(initialGameState);
    };

    return (
        <GameContext.Provider
            value={{
                gameState,
                setGameState,
                currentPlayer,
                isMyTurn,
                playCard,
                drawCard,
                resetGame,
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
}
