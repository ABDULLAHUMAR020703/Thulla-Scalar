"use client";

import { motion } from "framer-motion";

interface PreviewWatermarkProps {
    isVisible: boolean;
}

export default function PreviewWatermark({ isVisible }: PreviewWatermarkProps) {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] pointer-events-none"
        >
            <div className="px-4 py-2 rounded-full bg-[#7C4DFF]/20 border border-[#7C4DFF]/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#7C4DFF] animate-pulse" />
                    <span className="text-sm font-semibold text-[#7C4DFF] uppercase tracking-wider">
                        Preview Mode
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
