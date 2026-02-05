"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { Button, Input, Card } from "@/components/ui";

export default function CreateRoomPage() {
    const router = useRouter();
    const [roomName, setRoomName] = useState("");
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        setIsCreating(true);
        setTimeout(() => {
            router.push("/game/play");
        }, 1000);
    };

    return (
        <NavigationLayout>
            <div className="px-4 py-8 max-w-lg mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#7C4DFF] to-[#651FFF] flex items-center justify-center shadow-[0_0_30px_rgba(124,77,255,0.4)]"
                        >
                            <span className="text-3xl">🎮</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white mb-2">Create Room</h1>
                        <p className="text-[#607D8B]">Set up your private game</p>
                    </div>

                    {/* Form */}
                    <Card variant="glass" padding="lg" className="space-y-6">
                        <Input
                            label="Room Name"
                            placeholder="Enter room name (optional)"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />

                        <div>
                            <label className="block text-sm font-medium text-[#B0BEC5] mb-3 uppercase tracking-wider">
                                Max Players
                            </label>
                            <div className="flex gap-2">
                                {[2, 3, 4, 5, 6].map((num) => (
                                    <motion.button
                                        key={num}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setMaxPlayers(num)}
                                        className={`
                      flex-1 py-3.5 rounded-xl font-semibold transition-all duration-200
                      ${maxPlayers === num
                                                ? "bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] text-[#0B0F1A] shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                                                : "bg-white/[0.06] text-[#607D8B] border border-white/10 hover:border-[#00E5FF]/30"
                                            }
                    `}
                                    >
                                        {num}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Game Mode (Visual only) */}
                        <div>
                            <label className="block text-sm font-medium text-[#B0BEC5] mb-3 uppercase tracking-wider">
                                Game Mode
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl bg-[#00E5FF]/10 border-2 border-[#00E5FF]/50 text-center">
                                    <span className="text-xl mb-2 block">⚔️</span>
                                    <span className="text-sm font-medium text-[#00E5FF]">Classic</span>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center opacity-50">
                                    <span className="text-xl mb-2 block">🏆</span>
                                    <span className="text-sm font-medium text-[#607D8B]">Ranked</span>
                                    <span className="text-[10px] block text-[#607D8B]">Coming Soon</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            variant="secondary"
                            size="lg"
                            fullWidth
                            onClick={handleCreate}
                            isLoading={isCreating}
                        >
                            {isCreating ? "Creating..." : "Create Room"}
                        </Button>

                        <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => router.back()}
                        >
                            ← Back to Lobby
                        </Button>
                    </div>
                </motion.div>
            </div>
        </NavigationLayout>
    );
}
