"use client";

import { motion } from "framer-motion";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { Button, Card } from "@/components/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);

    const handleQuickPlay = () => {
        setIsSearching(true);
        setTimeout(() => {
            router.push("/game/play");
        }, 1500);
    };

    return (
        <NavigationLayout>
            <div className="px-4 py-6 max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>
                    <p className="text-[#607D8B]">Find a match or create your own room</p>
                </motion.div>

                {/* Quick Play Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card variant="neon" padding="lg" className="mb-6 relative overflow-hidden">
                        {/* Background effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/5 to-[#7C4DFF]/5" />

                        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <span className="text-2xl">⚡</span>
                                    <h2 className="text-xl font-bold text-white">Quick Match</h2>
                                </div>
                                <p className="text-sm text-[#B0BEC5]">
                                    Find opponents instantly
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleQuickPlay}
                                isLoading={isSearching}
                            >
                                {isSearching ? "Searching..." : "Play"}
                            </Button>
                        </div>
                    </Card>
                </motion.div>

                {/* Create/Join Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                    <Card
                        variant="default"
                        padding="md"
                        interactive
                        glowColor="secondary"
                        onClick={() => router.push("/game/create")}
                    >
                        <div className="text-center py-2">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#7C4DFF]/20 flex items-center justify-center">
                                <span className="text-2xl">🎮</span>
                            </div>
                            <span className="font-semibold text-white">Create Room</span>
                            <p className="text-xs text-[#607D8B] mt-1">Host a private game</p>
                        </div>
                    </Card>

                    <Card
                        variant="default"
                        padding="md"
                        interactive
                        glowColor="primary"
                        onClick={() => router.push("/game/join")}
                    >
                        <div className="text-center py-2">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#00E5FF]/20 flex items-center justify-center">
                                <span className="text-2xl">🚪</span>
                            </div>
                            <span className="font-semibold text-white">Join Room</span>
                            <p className="text-xs text-[#607D8B] mt-1">Enter room code</p>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </NavigationLayout>
    );
}

