"use client";

import type { LeaderboardEntry } from "@/lib/queries/leaderboard";
import { LeaderboardRow } from "./leaderboard-row";

export function GlobalLeaderboard({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-white/70 py-12">
        No scores yet. Rankings will appear after the first week is resolved.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          isCurrentUser={entry.userId === currentUserId}
        />
      ))}
    </div>
  );
}
