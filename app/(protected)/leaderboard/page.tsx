export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import {
  getGlobalLeaderboard,
  getUserLeagues,
} from "@/lib/queries/leaderboard";
import { getAllWeeks } from "@/lib/queries/weeks";
import { LeaderboardTabs } from "./leaderboard-tabs";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; week?: string; league?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const activeTab = params.tab || "global";

  const [globalEntries, weeks, userLeagues] = await Promise.all([
    getGlobalLeaderboard(),
    getAllWeeks(),
    getUserLeagues(user!.id),
  ]);

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-md mb-4">
          Leaderboard
        </h1>

        <LeaderboardTabs
          activeTab={activeTab}
          currentUserId={user!.id}
          globalEntries={globalEntries}
          weeks={weeks}
          userLeagues={userLeagues}
          selectedWeekId={params.week ? parseInt(params.week, 10) : null}
          selectedLeagueId={params.league || null}
        />
      </div>
    </div>
  );
}
