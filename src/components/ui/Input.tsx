"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    variant?: "default" | "ghost";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, rightIcon, variant = "default", className = "", ...props }, ref) => {
        const variantClasses = {
            default: `
        bg-white/[0.06] border border-white/10
        focus:border-[#00E5FF] focus:shadow-[0_0_15px_rgba(0,229,255,0.2)]
      `,
            ghost: `
        bg-transparent border-2 border-white/20
        focus:border-[#00E5FF] focus:bg-white/[0.03]
      `,
        };

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[#B0BEC5] mb-2 uppercase tracking-wider">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#607D8B]">
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full px-4 py-3.5 rounded-xl
              text-white placeholder:text-[#607D8B]
              focus:outline-none transition-all duration-250
              backdrop-blur-md
              ${variantClasses[variant]}
              ${leftIcon ? "pl-12" : ""}
              ${rightIcon ? "pr-12" : ""}
              ${error ? "border-[#FF1744] focus:border-[#FF1744] focus:shadow-[0_0_15px_rgba(255,23,68,0.2)]" : ""}
              ${className}
            `}
                        {...props}
                    />
                    {rightIcon && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#607D8B]">
                            {rightIcon}
                        </span>
                    )}
                </div>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-[#FF1744] flex items-center gap-1"
                    >
                        <span>⚠</span> {error}
                    </motion.p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
