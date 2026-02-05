"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { Button } from "@/components/ui";
import { useThullaEffects } from "@/hooks/useThullaEffects";
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

    // THULLA effects (shake + vibration)
    const thullaEffects = useThullaEffects();

    // Animation event handler
    const handleAnimationEvent = useCallback((event: AnimationEvent) => {
        console.log("[Animation]", event.type, event);

        if (event.type === "THULLA_TRIGGERED") {
            setThullaPickupPlayer(event.pickupPlayerId);
            setShowThulla(true);

            // Trigger shake + vibration
            thullaEffects.triggerThulla();

            setTimeout(() => setShowThulla(false), 2500);
        }
    }, [thullaEffects]);

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
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-144px)] px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-md"
                    >
                        {/* Icon */}
                        <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#7C4DFF] to-[#651FFF] flex items-center justify-center shadow-[0_0_60px_rgba(124,77,255,0.5)]">
                            <span className="text-6xl">🎮</span>
                        </div>

                        <h1 className="text-4xl font-black text-white mb-3">Preview Mode</h1>
                        <p className="text-[#B0BEC5] mb-8">
                            AI Simulation • Test game rules, animations, and UI
                        </p>

                        <div className="space-y-3">
                            <Button
                                variant="secondary"
                                size="lg"
                                fullWidth
                                onClick={() => game.startGame()}
                            >
                                🚀 Start Simulation
                            </Button>

                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={() => router.push("/game/lobby")}
                            >
                                ← Back to Lobby
                            </Button>
                        </div>

                        {/* Features */}
                        <div className="mt-10 p-5 rounded-xl bg-white/[0.04] border border-white/10 text-left">
                            <p className="text-xs text-[#607D8B] uppercase tracking-wider mb-3">
                                What You Can Test
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    "Full Game Logic",
                                    "THULLA Rules",
                                    "Trick Resolution",
                                    "Card Animations",
                                    "Speed Controls",
                                    "Bot AI Behavior",
                                ].map((feature) => (
                                    <div key={feature} className="flex items-center gap-2">
                                        <span className="text-[#00E5FF]">✓</span>
                                        <span className="text-sm text-[#B0BEC5]">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </NavigationLayout>
        );
    }

    // Game UI
    return (
        <div
            className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#1a1f3a] to-[#0B0F1A] overflow-hidden"
            style={thullaEffects.shakeStyle}
        >
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
        </div>
    );
}

export default function PreviewPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
                    <div className="text-[#607D8B]">Loading preview...</div>
                </div>
            }
        >
            <PreviewGameContent />
        </Suspense>
    );
}
