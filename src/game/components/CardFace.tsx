"use client";

import { useMemo } from "react";
import { Suit, Rank } from "@/context/GameProvider";

interface CardFaceProps {
    suit: Suit;
    rank: Rank;
    width: number;
    height: number;
}

const suitSymbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

const suitColors: Record<Suit, string> = {
    hearts: "#DC2626",
    diamonds: "#DC2626",
    clubs: "#1a1a1a",
    spades: "#1a1a1a",
};

export default function CardFace({ suit, rank, width, height }: CardFaceProps) {
    const symbol = suitSymbols[suit];
    const color = suitColors[suit];

    // Calculate sizing ratios relative to card width
    const pipSize = width * 0.22;
    const paddingX = width * 0.2;
    const paddingY = height * 0.15;

    // Helper to render a pip at percentage coordinates (0-1)
    const Pip = ({ x, y, inverted = false, scale = 1 }: { x: number; y: number; inverted?: boolean; scale?: number }) => (
        <div
            className="absolute flex items-center justify-center leading-none"
            style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                width: pipSize * scale,
                height: pipSize * scale,
                transform: `translate(-50%, -50%) ${inverted ? "rotate(180deg)" : ""}`,
                fontSize: `${pipSize * scale}px`,
                color: color,
            }}
        >
            {symbol}
        </div>
    );

    // Pip layouts for 2-10
    const PipLayout = () => {
        switch (rank) {
            case "2":
                return (
                    <>
                        <Pip x={0.5} y={0.2} />
                        <Pip x={0.5} y={0.8} inverted />
                    </>
                );
            case "3":
                return (
                    <>
                        <Pip x={0.5} y={0.2} />
                        <Pip x={0.5} y={0.5} />
                        <Pip x={0.5} y={0.8} inverted />
                    </>
                );
            case "4":
                return (
                    <>
                        <Pip x={0.3} y={0.2} />
                        <Pip x={0.7} y={0.2} />
                        <Pip x={0.3} y={0.8} inverted />
                        <Pip x={0.7} y={0.8} inverted />
                    </>
                );
            case "5":
                return (
                    <>
                        <Pip x={0.3} y={0.2} />
                        <Pip x={0.7} y={0.2} />
                        <Pip x={0.5} y={0.5} />
                        <Pip x={0.3} y={0.8} inverted />
                        <Pip x={0.7} y={0.8} inverted />
                    </>
                );
            case "6":
                return (
                    <>
                        <Pip x={0.3} y={0.2} />
                        <Pip x={0.7} y={0.2} />
                        <Pip x={0.3} y={0.5} />
                        <Pip x={0.7} y={0.5} />
                        <Pip x={0.3} y={0.8} inverted />
                        <Pip x={0.7} y={0.8} inverted />
                    </>
                );
            case "7":
                return (
                    <>
                        <Pip x={0.3} y={0.2} />
                        <Pip x={0.7} y={0.2} />
                        <Pip x={0.5} y={0.35} />
                        <Pip x={0.3} y={0.5} />
                        <Pip x={0.7} y={0.5} />
                        <Pip x={0.3} y={0.8} inverted />
                        <Pip x={0.7} y={0.8} inverted />
                    </>
                );
            case "8":
                return (
                    <>
                        <Pip x={0.3} y={0.2} />
                        <Pip x={0.7} y={0.2} />
                        <Pip x={0.5} y={0.35} />
                        <Pip x={0.3} y={0.5} />
                        <Pip x={0.7} y={0.5} />
                        <Pip x={0.5} y={0.65} inverted />
                        <Pip x={0.3} y={0.8} inverted />
                        <Pip x={0.7} y={0.8} inverted />
                    </>
                );
            case "9":
                return (
                    <>
                        <Pip x={0.3} y={0.2} />
                        <Pip x={0.7} y={0.2} />
                        <Pip x={0.3} y={0.4} />
                        <Pip x={0.7} y={0.4} />
                        <Pip x={0.5} y={0.5} />
                        <Pip x={0.3} y={0.6} inverted />
                        <Pip x={0.7} y={0.6} inverted />
                        <Pip x={0.3} y={0.8} inverted />
                        <Pip x={0.7} y={0.8} inverted />
                    </>
                );
            case "10":
                return (
                    <>
                        <Pip x={0.3} y={0.2} />
                        <Pip x={0.7} y={0.2} />
                        <Pip x={0.5} y={0.3} />
                        <Pip x={0.3} y={0.4} />
                        <Pip x={0.7} y={0.4} />
                        <Pip x={0.3} y={0.6} inverted />
                        <Pip x={0.7} y={0.6} inverted />
                        <Pip x={0.5} y={0.7} inverted />
                        <Pip x={0.3} y={0.8} inverted />
                        <Pip x={0.7} y={0.8} inverted />
                    </>
                );
            case "A":
                return (
                    <Pip
                        x={0.5}
                        y={0.5}
                        scale={suit === "spades" ? 2.5 : 2}
                    />
                );
            default:
                // Face cards (J, Q, K)
                return <FaceCardDesign rank={rank} suit={suit} color={color} />;
        }
    };

    return (
        <div
            className="w-full h-full relative"
            style={{
                fontFamily: "Georgia, serif",
                color: color
            }}
        >
            {/* Paper texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none z-10"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Corner Rank & Suit (Top Left) */}
            <div className="absolute top-[4%] left-[6%] flex flex-col items-center leading-none z-20">
                <span className="font-bold tracking-tighter" style={{ fontSize: width * 0.22 }}>{rank}</span>
                <span style={{ fontSize: width * 0.18, marginTop: -2 }}>{symbol}</span>
            </div>

            {/* Corner Rank & Suit (Bottom Right - Rotated) */}
            <div className="absolute bottom-[4%] right-[6%] flex flex-col items-center leading-none rotate-180 z-20">
                <span className="font-bold tracking-tighter" style={{ fontSize: width * 0.22 }}>{rank}</span>
                <span style={{ fontSize: width * 0.18, marginTop: -2 }}>{symbol}</span>
            </div>

            {/* Center Content */}
            <div className="absolute inset-[15%] flex flex-col items-center justify-center">
                <PipLayout />
            </div>
        </div>
    );
}

// Geometric Face Card Designs (SVG)
function FaceCardDesign({ rank, suit, color }: { rank: string; suit: Suit; color: string }) {
    const isRed = color === "#DC2626";
    const secondaryColor = isRed ? "#B91C1C" : "#111827";  // Darker shade
    const goldColor = "#D4AF37";

    // Common SVG props
    const svgProps = {
        width: "100%",
        height: "100%",
        viewBox: "0 0 100 140",
        fill: "none",
        stroke: color,
        strokeWidth: "2",
    };

    if (rank === "K") {
        return (
            <svg {...svgProps}>
                <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke={goldColor} strokeWidth="0.5" opacity="0.3" />
                    </pattern>
                </defs>

                {/* Border Frame */}
                <rect x="10" y="10" width="80" height="120" rx="4" stroke={goldColor} strokeWidth="1" />
                <rect x="15" y="15" width="70" height="110" rx="2" fill="url(#grid)" opacity="0.1" />

                {/* Crown (Top) */}
                <path d="M 30 50 L 30 35 L 40 40 L 50 30 L 60 40 L 70 35 L 70 50 Z" fill={goldColor} opacity="0.8" stroke="none" />

                {/* Crown (Bottom - Rotated) */}
                <path d="M 30 90 L 30 105 L 40 100 L 50 110 L 60 100 L 70 105 L 70 90 Z" fill={goldColor} opacity="0.8" stroke="none" />

                {/* King's Sword / Scepter */}
                <path d="M 50 35 L 50 105" stroke={secondaryColor} strokeWidth="4" />
                <path d="M 40 45 L 60 45" stroke={secondaryColor} strokeWidth="2" />
                <circle cx="50" cy="70" r="12" fill="white" stroke={color} strokeWidth="2" />
                <text x="50" y="75" textAnchor="middle" fontSize="14" fill={color} fontFamily="serif">K</text>
            </svg>
        );
    }

    if (rank === "Q") {
        return (
            <svg {...svgProps}>
                {/* Border Frame */}
                <rect x="10" y="10" width="80" height="120" rx="4" stroke={goldColor} strokeWidth="1" />
                <circle cx="50" cy="70" r="40" stroke={goldColor} strokeWidth="0.5" opacity="0.5" />

                {/* Flower / Scepter */}
                <path d="M 50 30 L 50 110" stroke={secondaryColor} strokeWidth="2" />

                {/* Petals */}
                <circle cx="50" cy="50" r="5" fill={goldColor} stroke="none" opacity="0.8" />
                <circle cx="50" cy="90" r="5" fill={goldColor} stroke="none" opacity="0.8" />

                {/* Center Badge */}
                <rect x="35" y="55" width="30" height="30" rx="15" fill="white" stroke={color} strokeWidth="2" />
                <text x="50" y="76" textAnchor="middle" fontSize="14" fill={color} fontFamily="serif">Q</text>
            </svg>
        );
    }

    if (rank === "J") {
        return (
            <svg {...svgProps}>
                {/* Border Frame */}
                <rect x="10" y="10" width="80" height="120" rx="4" stroke={goldColor} strokeWidth="1" />

                {/* Shield / Weapon */}
                <path d="M 30 30 L 70 110" stroke={secondaryColor} strokeWidth="2" />
                <path d="M 70 30 L 30 110" stroke={secondaryColor} strokeWidth="2" />

                {/* Center Badge */}
                <rect x="35" y="55" width="30" height="30" rx="4" fill="white" stroke={color} strokeWidth="2" transform="rotate(45 50 70)" />
                <text x="50" y="75" textAnchor="middle" fontSize="14" fill={color} fontFamily="serif">J</text>
            </svg>
        );
    }

    return null;
}
