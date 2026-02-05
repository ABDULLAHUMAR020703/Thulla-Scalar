"use client";

import { CSSProperties } from "react";

interface CardBackProps {
    width?: string | number;
    height?: string | number;
    style?: CSSProperties;
    className?: string;
}

export default function CardBack({ width = "100%", height = "100%", style, className = "" }: CardBackProps) {
    return (
        <div
            className={`relative rounded-lg overflow-hidden ${className}`}
            style={{
                width: width,
                height: height,
                background: "linear-gradient(145deg, #1e3a5f 0%, #0f2744 50%, #0a1929 100%)",
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)",
                ...style,
            }}
        >
            {/* Decorative border */}
            <div className="absolute inset-1.5 border border-[#3d5a80]/40 rounded-md" />

            {/* Diamond pattern */}
            <div className="absolute inset-2 opacity-20">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 4px,
                            rgba(61, 90, 128, 0.3) 4px,
                            rgba(61, 90, 128, 0.3) 5px
                        ),
                        repeating-linear-gradient(
                            -45deg,
                            transparent,
                            transparent 4px,
                            rgba(61, 90, 128, 0.3) 4px,
                            rgba(61, 90, 128, 0.3) 5px
                        )`,
                    }}
                />
            </div>

            {/* Center emblem */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a227]/30 to-[#8b6914]/30 border border-[#c9a227]/40 flex items-center justify-center">
                    <span className="text-[#c9a227] text-sm font-bold" style={{ fontFamily: "Georgia, serif" }}>T</span>
                </div>
            </div>
        </div>
    );
}
