"use client";

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center px-4 text-center">
            {/* Icon */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#607D8B] to-[#455A64] flex items-center justify-center">
                <span className="text-5xl">📡</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">You&apos;re Offline</h1>

            <p className="text-[#B0BEC5] mb-8 max-w-sm">
                Thulla requires an internet connection for multiplayer games.
                Check your connection and try again.
            </p>

            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] text-[#0B0F1A] font-semibold shadow-lg"
            >
                Try Again
            </button>

            <div className="mt-10 p-4 rounded-xl bg-white/[0.04] border border-white/10 max-w-sm">
                <p className="text-xs text-[#607D8B] uppercase tracking-wider mb-2">
                    While Offline
                </p>
                <p className="text-sm text-[#B0BEC5]">
                    You can still play in{" "}
                    <a href="/game/preview" className="text-[#00E5FF] underline">
                        Preview Mode
                    </a>{" "}
                    against bots!
                </p>
            </div>
        </div>
    );
}
