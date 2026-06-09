"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Week } from "@/types/database";
import type { LeaderboardEntry } from "@/lib/queries/leaderboard";
import { LeaderboardRow } from "./leaderboard-row";

export function WeeklyLeaderboard({
  weeks,
  currentUserId,
  selectedWeekId,
}: {
  weeks: Week[];
  currentUserId: string;
  selectedWeekId: number | null;
}) {
  const resolvedWeeks = weeks.filter((w) => w.is_resolved);
  const router = useRouter();

  // Default to latest resolved week
  const defaultWeek =
    resolvedWeeks.length > 0
      ? resolvedWeeks[resolvedWeeks.length - 1]
      : null;
  const activeWeekId = selectedWeekId || defaultWeek?.id || null;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeWeekId) return;

    setLoading(true);
    fetch(`/api/weekly-leaderboard?weekId=${activeWeekId}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries || []);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [activeWeekId]);

  if (resolvedWeeks.length === 0) {
    return (
      <p className="text-center text-white/70 py-12">
        No weeks have been resolved yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <select
        value={activeWeekId || ""}
        onChange={(e) => {
          const val = e.target.value;
          router.push(`/leaderboard?tab=weekly&week=${val}`);
        }}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-rose-500 focus:outline-none"
      >
        {resolvedWeeks.map((w) => (
          <option key={w.id} value={w.id}>
            Week {w.week_number}
          </option>
        ))}
      </select>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-300 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-white/70 py-8">
          No scores for this week.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
              showMovement={false}
              showStreak={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
