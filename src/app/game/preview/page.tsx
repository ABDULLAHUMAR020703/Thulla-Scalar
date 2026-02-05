"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { Button } from "@/components/ui";
import { useThullaEffects } from "@/hooks/useThullaEffects";
import { useGameAudio } from "@/hooks/useGameAudio";
import {
    usePreviewGame,
    DevControlPanel,
    PreviewBanner,
    AnimationEvent,
} from "@/game/preview";
import {
    PreviewPlayerHand,
    BotPlayerDisplay,
    CenterPile,
    ThullaOverlay,
    GameFinishedOverlay,
} from "@/game/preview/PreviewGameTable";

function PreviewGameContent() {
    const router = useRouter();
    const [devPanelOpen, setDevPanelOpen] = useState(false);
    const [showThulla, setShowThulla] = useState(false);
    const [thullaPickupPlayer, setThullaPickupPlayer] = useState("");
    const [gameStarted, setGameStarted] = useState(false);

    // THULLA effects (shake + vibration)
    const thullaEffects = useThullaEffects();

    // Audio system - same as live mode
    const gameAudio = useGameAudio({
        myPlayerId: "player-human",
        enabled: true,
    });

    // Animation event handler
    const handleAnimationEvent = useCallback((event: AnimationEvent) => {
        console.log("[Animation]", event.type, event);

        if (event.type === "DEAL_CARDS") {
            // Play card deal sound
            gameAudio.onGameStarted("preview-room");
            setGameStarted(true);
        }

        if (event.type === "CARD_PLAYED") {
            // Play card sound for every card played
            gameAudio.onCardPlayed();
        }

        if (event.type === "THULLA_TRIGGERED") {
            setThullaPickupPlayer(event.pickupPlayerId);
            setShowThulla(true);

            // Trigger shake + vibration + sound (thulla sound is in useThullaEffects)
            thullaEffects.triggerThulla();

            setTimeout(() => setShowThulla(false), 2500);
        }

        if (event.type === "GAME_FINISHED") {
            // Play win/lose based on who won
            if (event.winnerId === "player-human") {
                gameAudio.onPlayerFinished("player-human");
            } else {
                // Human lost - trigger lose sound
                // Note: In preview, the first to finish wins (reverse logic)
                // If bot won, human effectively "lost" that round
            }
        }
    }, [thullaEffects, gameAudio]);

    const game = usePreviewGame({
        onAnimationEvent: handleAnimationEvent,
        enableLogging: true,
    });

    const { state, isRunning, humanPlayer, isHumanTurn, currentPlayer } = game;

    // Get bot players for display
    const botPlayers = state.players.filter(p => p.isBot);
    const botPositions: ("top" | "left" | "right")[] = ["left", "top", "right"];

    // Get pickup player name for Thulla overlay
    const pickupPlayer = state.players.find(p => p.id === thullaPickupPlayer);
    const pickupPlayerName = pickupPlayer?.name ?? "Player";

    // Check if game is finished
    const winner = state.winnerId ? state.players.find(p => p.id === state.winnerId) : null;
    const isHumanWinner = winner?.id === humanPlayer?.id;

    // Start screen
    if (state.status === "waiting") {
        return (
            <NavigationLayout>
                <div
                    className="flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-4 relative overflow-hidden"
                    style={{
                        background: "radial-gradient(ellipse at center top, #1a2e1c 0%, #0d1912 40%, #0a0f0c 100%)",
                    }}
                >
                    {/* Felt texture */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-md relative z-10"
                    >
                        {/* Icon */}
                        <div
                            className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(201,162,39,0.3)]"
                            style={{
                                background: "linear-gradient(135deg, #c9a227 0%, #8b6914 50%, #c9a227 100%)",
                            }}
                        >
                            <span className="text-5xl sm:text-6xl">🎮</span>
                        </div>

                        <h1
                            className="text-3xl sm:text-4xl font-black mb-3"
                            style={{
                                background: "linear-gradient(135deg, #c9a227 0%, #f5d67a 50%, #c9a227 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Preview Mode
                        </h1>
                        <p className="text-[#8fae94] text-sm sm:text-base mb-8">
                            AI Simulation • Test game rules, animations, and sounds
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => game.startGame()}
                                className="w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 active:scale-[0.98]"
                                style={{
                                    background: "linear-gradient(135deg, #1a5c35 0%, #2d7a4a 50%, #1a5c35 100%)",
                                    border: "2px solid #c9a227",
                                    color: "#f5d67a",
                                    boxShadow: "0 4px 20px rgba(26, 92, 53, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                                }}
                            >
                                🚀 Start Simulation
                            </button>

                            <button
                                onClick={() => router.push("/game/lobby")}
                                className="w-full py-3 px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 active:scale-[0.98]"
                                style={{
                                    background: "transparent",
                                    border: "1px solid rgba(201, 162, 39, 0.4)",
                                    color: "#c9a227",
                                }}
                            >
                                ← Back to Lobby
                            </button>
                        </div>

                        {/* Features */}
                        <div className="mt-8 p-4 rounded-xl border text-left"
                            style={{
                                background: "rgba(26, 77, 46, 0.3)",
                                borderColor: "rgba(201, 162, 39, 0.2)",
                            }}
                        >
                            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "#c9a227" }}>
                                What You Can Test
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    "Full Game Logic",
                                    "THULLA Rules",
                                    "Sound Effects",
                                    "Card Animations",
                                    "Speed Controls",
                                    "Bot AI Behavior",
                                ].map((feature) => (
                                    <div key={feature} className="flex items-center gap-2">
                                        <span className="text-[#c9a227]">✓</span>
                                        <span className="text-xs sm:text-sm text-[#8fae94]">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </NavigationLayout>
        );
    }

    // Game UI with casino-style background
    return (
        <div
            className="min-h-screen overflow-hidden relative"
            style={{
                background: "radial-gradient(ellipse at center, #1a2e1c 0%, #0d1912 50%, #0a0f0c 100%)",
                ...thullaEffects.shakeStyle,
            }}
        >
            {/* Felt texture */}
            <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 opacity-20 pointer-events-none">
                <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-[#c9a227]/60 rounded-tl-lg" />
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 opacity-20 pointer-events-none">
                <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-[#c9a227]/60 rounded-tr-lg" />
            </div>

            {/* Preview Banner */}
            <PreviewBanner />

            {/* Bot Players */}
            {botPlayers.map((bot, index) => (
                <BotPlayerDisplay
                    key={bot.id}
                    player={bot}
                    position={botPositions[index]}
                    isCurrentPlayer={bot.id === state.currentPlayerId}
                />
            ))}

            {/* Center Pile */}
            <CenterPile
                trick={state.currentTrick}
                activeSuit={state.activeSuit}
                seniorCardId={state.seniorCard?.id ?? null}
            />

            {/* Human Player Hand */}
            {humanPlayer && (
                <PreviewPlayerHand
                    player={humanPlayer}
                    isCurrentPlayer={isHumanTurn}
                    isHuman={true}
                    canPlayCard={game.canPlayCard}
                    onPlayCard={game.playCard}
                />
            )}

            {/* THULLA Overlay */}
            <ThullaOverlay
                isVisible={showThulla}
                pickupPlayerName={pickupPlayerName}
            />

            {/* Game Finished Overlay */}
            <GameFinishedOverlay
                isVisible={state.status === "finished"}
                winnerName={winner?.name ?? ""}
                isHumanWinner={isHumanWinner}
                onRestart={game.restart}
            />

            {/* Dev Control Panel */}
            <DevControlPanel
                state={state}
                isOpen={devPanelOpen}
                onToggle={() => setDevPanelOpen(!devPanelOpen)}
                onPause={game.pause}
                onResume={game.resume}
                onSetSpeed={game.setSpeed}
                onStepNext={game.stepNext}
                onForceThulla={game.forceThulla}
                onRestart={game.restart}
            />

            {/* Mute Button */}
            <button
                onClick={gameAudio.toggleMute}
                className="fixed bottom-24 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                    background: "rgba(26, 77, 46, 0.8)",
                    border: "1px solid rgba(201, 162, 39, 0.4)",
                }}
            >
                <span className="text-lg">{gameAudio.isMuted ? "🔇" : "🔊"}</span>
            </button>
        </div>
    );
}

export default function PreviewPage() {
    return (
        <Suspense
            fallback={
                <div
                    className="min-h-screen flex items-center justify-center"
                    style={{
                        background: "radial-gradient(ellipse at center, #1a2e1c 0%, #0d1912 50%, #0a0f0c 100%)",
                    }}
                >
                    <div className="text-[#8fae94]">Loading preview...</div>
                </div>
            }
        >
            <PreviewGameContent />
        </Suspense>
    );
}
