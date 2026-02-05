"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import NavigationLayout from "@/components/layout/NavigationLayout";
import { Button, Card } from "@/components/ui";

export default function JoinRoomPage() {
    const router = useRouter();
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newCode = [...code];
        newCode[index] = value.toUpperCase();
        setCode(newCode);
        setError("");

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleJoin = async () => {
        const roomCode = code.join("");
        if (roomCode.length < 6) {
            setError("Please enter complete room code");
            return;
        }

        setIsJoining(true);
        setTimeout(() => {
            router.push("/game/play");
        }, 1000);
    };

    const isComplete = code.every(c => c !== "");

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
                            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.4)]"
                        >
                            <span className="text-3xl">🚪</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white mb-2">Join Room</h1>
                        <p className="text-[#607D8B]">Enter the 6-character room code</p>
                    </div>

                    {/* Code Input */}
                    <Card variant="glass" padding="lg">
                        <div className="flex justify-center gap-2 mb-4">
                            {code.map((digit, index) => (
                                <motion.input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`
                    w-12 h-14 text-center text-2xl font-bold rounded-xl
                    bg-white/[0.06] border-2 transition-all duration-200
                    text-white placeholder:text-[#607D8B]
                    focus:outline-none
                    ${digit
                                            ? "border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                                            : "border-white/10 focus:border-[#00E5FF]"
                                        }
                    ${error ? "border-[#FF1744]" : ""}
                  `}
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-sm text-[#FF1744] mb-4"
                            >
                                ⚠ {error}
                            </motion.p>
                        )}

                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleJoin}
                            isLoading={isJoining}
                            disabled={!isComplete}
                        >
                            {isJoining ? "Joining..." : "Join Game"}
                        </Button>
                    </Card>

                    {/* Info */}
                    <Card variant="default" padding="md">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">💡</span>
                            <div>
                                <p className="text-sm text-[#B0BEC5]">
                                    Ask the room host for the 6-character code to join their private game.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => router.back()}
                    >
                        ← Back to Lobby
                    </Button>
                </motion.div>
            </div>
        </NavigationLayout>
    );
}
