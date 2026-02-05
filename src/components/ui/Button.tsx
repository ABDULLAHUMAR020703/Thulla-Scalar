"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    fullWidth?: boolean;
    glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = "primary",
            size = "md",
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            glow = true,
            className = "",
            disabled,
            ...props
        },
        ref
    ) => {
        const baseClasses = `
      inline-flex items-center justify-center gap-2 font-semibold
      uppercase tracking-wide transition-all duration-250 relative overflow-hidden
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F1A]
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `;

        const variantClasses = {
            primary: `
        bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] text-[#0B0F1A]
        ${glow ? "shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)]" : ""}
      `,
            secondary: `
        bg-gradient-to-br from-[#7C4DFF] to-[#651FFF] text-white
        ${glow ? "shadow-[0_0_20px_rgba(124,77,255,0.4)] hover:shadow-[0_0_40px_rgba(124,77,255,0.6)]" : ""}
      `,
            ghost: `
        bg-white/[0.06] text-white border border-white/10
        hover:bg-white/10 hover:border-[#00E5FF]/50
      `,
            outline: `
        bg-transparent text-[#00E5FF] border-2 border-[#00E5FF]
        hover:bg-[#00E5FF]/10 ${glow ? "hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]" : ""}
      `,
            danger: `
        bg-gradient-to-br from-[#FF1744] to-[#D50000] text-white
        ${glow ? "shadow-[0_0_20px_rgba(255,23,68,0.4)] hover:shadow-[0_0_40px_rgba(255,23,68,0.6)]" : ""}
      `,
        };

        const sizeClasses = {
            sm: "py-2 px-4 text-xs rounded-lg",
            md: "py-3 px-6 text-sm rounded-xl",
            lg: "py-4 px-8 text-base rounded-2xl",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: disabled || isLoading ? 1 : 1.02, y: disabled || isLoading ? 0 : -2 }}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
                className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
                disabled={disabled || isLoading}
                {...props}
            >
                {/* Shine effect */}
                <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />

                {isLoading ? (
                    <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    <>
                        {leftIcon && <span className="relative z-10">{leftIcon}</span>}
                        <span className="relative z-10">{children}</span>
                        {rightIcon && <span className="relative z-10">{rightIcon}</span>}
                    </>
                )}
            </motion.button>
        );
    }
);

Button.displayName = "Button";

export default Button;
