"use client";

import type { LeaderboardEntry } from "@/lib/queries/leaderboard";

function getRankDisplay(rank: number) {
  if (rank === 1)
    return { icon: "\u{1F451}", bg: "bg-amber-50 border-amber-200" }; // crown
  if (rank === 2)
    return { icon: "\u{1F948}", bg: "bg-gray-50 border-gray-200" }; // silver medal
  if (rank === 3)
    return { icon: "\u{1F949}", bg: "bg-orange-50 border-orange-200" }; // bronze medal
  return { icon: null, bg: "bg-white border-gray-100" };
}

function getRankMovement(rank: number, prevRank: number | null) {
  if (prevRank === null) return null;
  const diff = prevRank - rank;
  if (diff > 0)
    return (
      <span className="text-emerald-500 text-xs font-bold">
        &#9650;{diff}
      </span>
    );
  if (diff < 0)
    return (
      <span className="text-red-500 text-xs font-bold">
        &#9660;{Math.abs(diff)}
      </span>
    );
  return <span className="text-gray-400 text-xs">&#8212;</span>;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LeaderboardRow({
  entry,
  isCurrentUser,
  showMovement = true,
  showStreak = true,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  showMovement?: boolean;
  showStreak?: boolean;
}) {
  const { icon, bg } = getRankDisplay(entry.rank);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${bg} ${
        isCurrentUser
          ? "ring-2 ring-rose-400 ring-offset-1"
          : ""
      }`}
    >
      {/* Rank */}
      <div className="flex flex-col items-center w-8">
        {icon ? (
          <span className="text-lg">{icon}</span>
        ) : (
          <span className="text-sm font-bold text-gray-500">
            #{entry.rank}
          </span>
        )}
        {showMovement && getRankMovement(entry.rank, entry.prevRank)}
      </div>

      {/* Avatar */}
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt=""
          className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-300 text-xs font-bold text-white ring-1 ring-gray-200">
          {getInitials(entry.displayName)}
        </div>
      )}

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {entry.displayName || "Anonymous"}
          {isCurrentUser && (
            <span className="text-xs text-rose-500 ml-1">(you)</span>
          )}
        </p>
        <div className="flex gap-1.5 mt-0.5">
          {entry.isPerfectWeek && (
            <span className="text-[10px] font-bold text-orange-500">
              Perfect Week &#128293;
            </span>
          )}
          {showStreak && entry.streakCount > 0 && (
            <span className="text-[10px] font-bold text-amber-500">
              &#128293; {entry.streakCount} streak
            </span>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="text-lg font-extrabold text-gray-900 tabular-nums">
          {entry.weekPoints !== undefined ? entry.weekPoints : entry.totalPoints}
        </p>
        <p className="text-[10px] text-gray-400">pts</p>
      </div>
    </div>
  );
}
