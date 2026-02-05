"use client";

import { motion } from "framer-motion";

export default function PreviewBanner() {
    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
        >
            <div className="mt-2 px-6 py-2 rounded-full bg-[#7C4DFF]/90 backdrop-blur-xl border border-[#7C4DFF] shadow-lg shadow-[#7C4DFF]/40">
                <div className="flex items-center gap-3">
                    <motion.span
                        className="w-2 h-2 rounded-full bg-white"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-sm font-bold text-white uppercase tracking-widest">
                        Preview Mode – AI Simulation
                    </span>
                    <motion.span
                        className="w-2 h-2 rounded-full bg-white"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
