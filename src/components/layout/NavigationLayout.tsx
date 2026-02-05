"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationLayoutProps {
    children: ReactNode;
    showNav?: boolean;
    showHeader?: boolean;
}

const navItems = [
    { href: "/", icon: "🏠", label: "Home" },
    { href: "/game/lobby", icon: "🎮", label: "Play" },
    { href: "/profile", icon: "👤", label: "Profile" },
    { href: "/settings", icon: "⚙️", label: "Settings" },
];

export default function NavigationLayout({
    children,
    showNav = true,
    showHeader = true,
}: NavigationLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex flex-col bg-[#0B0F1A]">
            {/* Header */}
            {showHeader && (
                <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B0F1A]/80 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between h-16 px-4 pt-[var(--safe-area-top)]">
                        <Link href="/" className="flex items-center gap-3">
                            {/* Logo */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#7C4DFF] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                                <span className="text-lg font-bold text-[#0B0F1A]">T</span>
                            </div>
                            <span className="font-bold text-lg text-gradient">
                                Thulla
                            </span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {/* Notification */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:border-[#00E5FF]/30 transition-colors"
                                aria-label="Notifications"
                            >
                                <span className="text-lg">🔔</span>
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF1744] rounded-full text-[10px] flex items-center justify-center font-bold">
                                    2
                                </span>
                            </motion.button>

                            {/* Profile */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C4DFF] to-[#651FFF] flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_rgba(124,77,255,0.3)]"
                                aria-label="User menu"
                            >
                                U
                            </motion.button>
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            {showNav && (
                <nav className="sticky bottom-0 z-50 backdrop-blur-xl bg-[#0B0F1A]/90 border-t border-white/[0.06]">
                    <div className="flex items-center justify-around h-[72px] pb-[var(--safe-area-bottom)] px-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex flex-col items-center justify-center flex-1 h-full group"
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNavTab"
                                            className="absolute inset-x-3 top-0 h-0.5 bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] rounded-full shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                                        />
                                    )}

                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`
                      flex flex-col items-center gap-1 transition-colors duration-200
                      ${isActive ? "text-[#00E5FF]" : "text-[#607D8B] group-hover:text-[#B0BEC5]"}
                    `}
                                    >
                                        <span className={`text-xl ${isActive ? "drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" : ""}`}>
                                            {item.icon}
                                        </span>
                                        <span className={`text-[10px] uppercase tracking-wider font-medium ${isActive ? "neon-text" : ""}`}>
                                            {item.label}
                                        </span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}
        </div>
    );
}
