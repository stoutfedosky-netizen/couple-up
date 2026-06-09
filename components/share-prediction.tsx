"use client";

import { useState } from "react";

export function SharePredictionButton({
  predictionId,
  weekNumber,
  compact = false,
}: {
  predictionId: number;
  weekNumber: number;
  compact?: boolean;
}) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const ogUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/og/prediction/${predictionId}`
      : "";

  const shareText = `Check out my Week ${weekNumber} Love Island predictions on Couple Up!`;

  async function handleShare() {
    setSharing(true);
    try {
      // Try Web Share API first (mobile)
      if (typeof navigator !== "undefined" && navigator.share) {
        // Try sharing with image
        try {
          const response = await fetch(ogUrl);
          const blob = await response.blob();
          const file = new File([blob], `week-${weekNumber}-prediction.png`, {
            type: "image/png",
          });

          await navigator.share({
            title: `Week ${weekNumber} Predictions - Couple Up`,
            text: shareText,
            files: [file],
          });
        } catch {
          // Fallback to text-only share
          try {
            await navigator.share({
              title: `Week ${weekNumber} Predictions - Couple Up`,
              text: shareText,
            });
          } catch {
            // User cancelled
          }
        }
      } else {
        // Desktop: copy text to clipboard
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        // Also open the OG image in a new tab so they can save it
        window.open(ogUrl, "_blank");
      }
    } catch {
      // Silently fail
    } finally {
      setSharing(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleShare}
        disabled={sharing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="Share prediction"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
        {copied ? "Copied!" : "Share"}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </svg>
      {sharing ? "Sharing..." : copied ? "Copied!" : "Share Your Picks"}
    </button>
  );
}
