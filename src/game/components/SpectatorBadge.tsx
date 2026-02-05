"use client";

import { motion } from "framer-motion";

/**
 * SpectatorBadge - A floating HUD element indicating the player is spectating.
 * Displayed when a player has finished (emptied their hand) and is watching
 * the game continue.
 */
export default function SpectatorBadge() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl 
                       bg-slate-800/85 backdrop-blur-md border border-cyan-500/30 
                       shadow-lg shadow-cyan-500/10"
        >
            {/* Eye icon with subtle pulse animation */}
            <motion.span
                className="text-lg"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                👁
            </motion.span>

            {/* Label text */}
            <span className="text-sm font-semibold tracking-wider text-cyan-400 uppercase">
                Spectating
            </span>
        </motion.div>
    );
}
