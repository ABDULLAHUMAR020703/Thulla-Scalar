"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;

        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    updateViaCache: "none",
                });

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000); // Every hour

                console.log("Service Worker registered:", registration.scope);
            } catch (error) {
                console.error("Service Worker registration failed:", error);
            }
        };

        // Register after page load
        if (document.readyState === "complete") {
            registerSW();
        } else {
            window.addEventListener("load", registerSW);
            return () => window.removeEventListener("load", registerSW);
        }
    }, []);

    return null;
}
