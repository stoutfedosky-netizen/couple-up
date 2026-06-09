"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Week } from "@/types/database";
import type {
  LeaderboardEntry,
  UserLeagueInfo,
} from "@/lib/queries/leaderboard";
import { GlobalLeaderboard } from "./global-leaderboard";
import { WeeklyLeaderboard } from "./weekly-leaderboard";
import { MyLeagues } from "./my-leagues";

const tabs = [
  { key: "global", label: "Global" },
  { key: "weekly", label: "Weekly" },
  { key: "leagues", label: "My Leagues" },
];

export function LeaderboardTabs({
  activeTab,
  currentUserId,
  globalEntries,
  weeks,
  userLeagues,
  selectedWeekId,
  selectedLeagueId,
}: {
  activeTab: string;
  currentUserId: string;
  globalEntries: LeaderboardEntry[];
  weeks: Week[];
  userLeagues: UserLeagueInfo[];
  selectedWeekId: number | null;
  selectedLeagueId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTab(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    params.delete("week");
    params.delete("league");
    router.push(`/leaderboard?${params.toString()}`);
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-white text-pink-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "global" && (
        <GlobalLeaderboard
          entries={globalEntries}
          currentUserId={currentUserId}
        />
      )}
      {activeTab === "weekly" && (
        <WeeklyLeaderboard
          weeks={weeks}
          currentUserId={currentUserId}
          selectedWeekId={selectedWeekId}
        />
      )}
      {activeTab === "leagues" && (
        <MyLeagues
          leagues={userLeagues}
          currentUserId={currentUserId}
          selectedLeagueId={selectedLeagueId}
        />
      )}
    </div>
  );
}
