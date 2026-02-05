"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";

interface CardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    variant?: "default" | "elevated" | "glass" | "neon";
    padding?: "none" | "sm" | "md" | "lg";
    interactive?: boolean;
    glowColor?: "primary" | "secondary" | "success" | "danger";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            children,
            variant = "default",
            padding = "md",
            interactive = false,
            glowColor,
            className = "",
            ...props
        },
        ref
    ) => {
        const variantClasses = {
            default: "bg-white/[0.06] border border-white/[0.08]",
            elevated: "bg-white/[0.08] border border-white/[0.12] shadow-lg",
            glass: "glass-elevated",
            neon: "bg-white/[0.06] border border-[#00E5FF]/30 shadow-[0_0_20px_rgba(0,229,255,0.1)]",
        };

        const paddingClasses = {
            none: "",
            sm: "p-3",
            md: "p-5",
            lg: "p-7",
        };

        const glowClasses = {
            primary: "hover:border-[#00E5FF]/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]",
            secondary: "hover:border-[#7C4DFF]/50 hover:shadow-[0_0_25px_rgba(124,77,255,0.2)]",
            success: "hover:border-[#00E676]/50 hover:shadow-[0_0_25px_rgba(0,230,118,0.2)]",
            danger: "hover:border-[#FF1744]/50 hover:shadow-[0_0_25px_rgba(255,23,68,0.2)]",
        };

        return (
            <motion.div
                ref={ref}
                whileHover={interactive ? { scale: 1.02, y: -4 } : undefined}
                whileTap={interactive ? { scale: 0.98 } : undefined}
                className={`
          rounded-2xl backdrop-blur-xl transition-all duration-250
          ${variantClasses[variant]}
          ${paddingClasses[padding]}
          ${interactive ? "cursor-pointer" : ""}
          ${interactive && glowColor ? glowClasses[glowColor] : ""}
          ${interactive && !glowColor ? glowClasses.primary : ""}
          ${className}
        `}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = "Card";

export default Card;
