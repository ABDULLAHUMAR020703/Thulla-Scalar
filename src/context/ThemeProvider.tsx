"use client";

import { createContext, useContext, ReactNode } from "react";

interface ThemeContextType {
    theme: "dark";
    accentColor: string;
    setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    // Currently fixed to dark theme for gaming UI
    const theme = "dark" as const;
    const accentColor = "#8b5cf6";

    const setAccentColor = (color: string) => {
        // Update CSS variable for accent color
        document.documentElement.style.setProperty("--color-primary", color);
    };

    return (
        <ThemeContext.Provider value={{ theme, accentColor, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
