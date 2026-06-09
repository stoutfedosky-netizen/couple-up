"use client";

import Link from "next/link";
import type { Islander, SeasonWinnerPrediction } from "@/types/database";
import type { UserRankInfo, UserLeagueInfo } from "@/lib/queries/leaderboard";
import { CountdownTimer } from "@/components/countdown-timer";
import { SeasonWinnerPicker } from "@/components/season-winner-picker";

export function DashboardClient({
  displayName,
  weekNumber,
  weekDeadline,
  hasCurrentPrediction,
  islanders,
  seasonPick,
  isSeasonPickLocked,
  seasonTotal,
  rankInfo,
  userLeagues,
  latestWeekNumber,
  latestWeekScore,
}: {
  displayName: string | null;
  weekNumber: number | null;
  weekDeadline: string | null;
  hasCurrentPrediction: boolean;
  islanders: Islander[];
  seasonPick: SeasonWinnerPrediction | null;
  isSeasonPickLocked: boolean;
  seasonTotal: number;
  rankInfo: UserRankInfo;
  userLeagues: UserLeagueInfo[];
  latestWeekNumber: number | null;
  latestWeekScore: number | null;
}) {
  const isPastDeadline = weekDeadline
    ? new Date(weekDeadline) < new Date()
    : false;

  return (
    <div className="px-4 pt-8 pb-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Welcome + Score */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-md">
              Welcome{displayName ? `, ${displayName}` : ""}!
            </h1>
            <p className="mt-1 text-white/70">
              Love Island USA Season 8 Predictions
            </p>
          </div>
          {seasonTotal > 0 && (
            <div className="text-right rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 px-4 py-2 shadow-md">
              <p className="text-xs font-semibold text-white/70">Season</p>
              <p className="text-2xl font-extrabold text-white tabular-nums">
                {seasonTotal}
              </p>
              <p className="text-[10px] text-white/60">pts</p>
            </div>
          )}
        </div>

        {/* Current week card */}
        {weekNumber && weekDeadline && (
          <div className="rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white/70">
                  Week {weekNumber}
                </p>
                <h2 className="text-lg font-extrabold">
                  {isPastDeadline
                    ? "Predictions Locked"
                    : hasCurrentPrediction
                      ? "Prediction Submitted"
                      : "Make Your Predictions"}
                </h2>
              </div>
              {!isPastDeadline && (
                <CountdownTimer deadline={weekDeadline} compact />
              )}
            </div>

            {isPastDeadline ? (
              <p className="text-sm text-white/70">
                Results will be revealed when the week is resolved.
              </p>
            ) : (
              <Link
                href="/bracket"
                className="mt-2 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-rose-600 shadow-md hover:shadow-lg transition-all"
              >
                {hasCurrentPrediction ? "Edit Prediction" : "Start Predicting"}
              </Link>
            )}
          </div>
        )}

        {!weekNumber && (
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <h2 className="font-semibold text-white">No Active Week</h2>
            <p className="mt-1 text-sm text-white/70">
              Check back when a new week is open for predictions.
            </p>
          </div>
        )}

        {/* Season winner picker */}
        <SeasonWinnerPicker
          islanders={islanders}
          existingPick={seasonPick}
          isLocked={isSeasonPickLocked}
        />

        {/* Your Rank card */}
        {rankInfo.totalPoints > 0 && (
          <Link
            href="/leaderboard"
            className="block rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
          >
            <h2 className="text-sm font-bold text-gray-900 mb-3">Your Rank</h2>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-xl font-extrabold text-gray-900">
                  #{rankInfo.globalRank}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  of {rankInfo.totalPlayers}
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-rose-600">
                  {rankInfo.totalPoints}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">total pts</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-amber-500">
                  {rankInfo.currentStreak > 0
                    ? `${rankInfo.currentStreak}🔥`
                    : "—"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">streak</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-600">
                  {rankInfo.bestWeekScore}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {rankInfo.bestWeekNumber
                    ? `best (W${rankInfo.bestWeekNumber})`
                    : "best week"}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Your Leagues */}
        {userLeagues.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Your Leagues</h2>
              <Link
                href="/leaderboard?tab=leagues"
                className="text-xs font-medium text-rose-600 hover:text-rose-500"
              >
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {userLeagues.slice(0, 3).map((league) => (
                <Link
                  key={league.leagueId}
                  href={`/leaderboard?tab=leagues&league=${league.leagueId}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-orange-300 text-sm font-bold text-white">
                    {league.leagueName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {league.leagueName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {league.memberCount} members
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      #{league.userRank || "—"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Results */}
        {latestWeekNumber && (
          <Link
            href={`/results/${latestWeekNumber}`}
            className="block rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Recent Results
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Week {latestWeekNumber}
                </p>
              </div>
              {latestWeekScore !== null && (
                <div className="text-right">
                  <p className="text-lg font-extrabold text-rose-600">
                    {latestWeekScore}
                  </p>
                  <p className="text-[10px] text-gray-400">your score</p>
                </div>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </Link>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/predictions"
            className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-bold text-gray-900">My Predictions</p>
            <p className="text-xs text-gray-400 mt-0.5">View history</p>
          </Link>
          <Link
            href={userLeagues.length > 0 ? "/leaderboard?tab=leagues" : "/leaderboard"}
            className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-bold text-gray-900">
              {userLeagues.length > 0 ? "My Leagues" : "Leaderboard"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {userLeagues.length > 0 ? `${userLeagues.length} league${userLeagues.length > 1 ? "s" : ""}` : "See rankings"}
            </p>
          </Link>
        </div>

        {/* How it works (only show when no scores yet) */}
        {rankInfo.totalPoints === 0 && (
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-5">
            <h2 className="font-semibold text-white">How It Works</h2>
            <ul className="mt-2 space-y-2 text-sm text-white/80">
              <li>1. Predict which islanders will couple up each week</li>
              <li>2. Pick who you think will get dumped</li>
              <li>3. Answer bonus questions for extra points</li>
              <li>4. Compete on the leaderboard with friends</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
