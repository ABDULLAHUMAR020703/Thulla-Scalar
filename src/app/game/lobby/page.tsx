"use client";

import { motion } from "framer-motion";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { Button, Card } from "@/components/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";

const mockRooms = [
    { id: 1, name: "Pro Arena", players: 3, maxPlayers: 4, status: "waiting", host: "Player1" },
    { id: 2, name: "Casual Fun", players: 2, maxPlayers: 4, status: "waiting", host: "GamerX" },
    { id: 3, name: "Tournament", players: 4, maxPlayers: 4, status: "full", host: "Champion" },
];

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

                        <div className="relative flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">⚡</span>
                                    <h2 className="text-xl font-bold text-white">Quick Match</h2>
                                </div>
                                <p className="text-sm text-[#B0BEC5]">
                                    Find opponents instantly
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="badge badge-primary">
                                        <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                                        1,234 Online
                                    </span>
                                </div>
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
                    className="grid grid-cols-2 gap-3 mb-8"
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

                {/* Active Rooms */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#B0BEC5] uppercase tracking-wider">
                            Active Rooms
                        </h3>
                        <span className="text-xs text-[#607D8B]">{mockRooms.length} available</span>
                    </div>

                    <div className="space-y-3">
                        {mockRooms.map((room, i) => (
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.1 }}
                            >
                                <Card variant="default" padding="md" className="group hover:border-[#00E5FF]/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C4DFF]/20 to-[#00E5FF]/20 flex items-center justify-center border border-white/10">
                                                <span className="text-lg">🃏</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white group-hover:text-[#00E5FF] transition-colors">
                                                    {room.name}
                                                </p>
                                                <p className="text-xs text-[#607D8B]">Hosted by {room.host}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <span className="text-[#00E5FF]">{room.players}</span>
                                                    <span className="text-[#607D8B]">/</span>
                                                    <span className="text-[#607D8B]">{room.maxPlayers}</span>
                                                </div>
                                                <span className={`text-xs ${room.status === "full" ? "text-[#FF1744]" : "text-[#00E676]"}`}>
                                                    {room.status === "full" ? "Full" : "Open"}
                                                </span>
                                            </div>

                                            <Button
                                                variant={room.status === "full" ? "ghost" : "outline"}
                                                size="sm"
                                                disabled={room.status === "full"}
                                                glow={false}
                                            >
                                                {room.status === "full" ? "Full" : "Join"}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </NavigationLayout>
    );
}
