export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getCurrentWeek } from "@/lib/queries/weeks";
import { getActiveIslanders } from "@/lib/queries/islanders";
import {
  getSeasonWinnerPrediction,
  getUserPredictionForWeek,
} from "@/lib/queries/predictions";
import { getUserRank, getUserLeagues } from "@/lib/queries/leaderboard";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const [currentWeek, islanders, seasonPick] = await Promise.all([
    getCurrentWeek(),
    getActiveIslanders(),
    getSeasonWinnerPrediction(user!.id),
  ]);

  let hasCurrentPrediction = false;
  let weekDeadline: string | null = null;
  let weekNumber: number | null = null;

  if (currentWeek) {
    const prediction = await getUserPredictionForWeek(user!.id, currentWeek.id);
    hasCurrentPrediction = !!prediction;
    weekDeadline = currentWeek.prediction_deadline;
    weekNumber = currentWeek.week_number;
  }

  // Check if Week 4 deadline has passed (for season winner lock)
  const { data: week4 } = await supabase
    .from("weeks")
    .select("prediction_deadline")
    .eq("week_number", 4)
    .single();

  const isSeasonPickLocked = week4
    ? new Date((week4 as { prediction_deadline: string }).prediction_deadline) < new Date()
    : false;

  // Cumulative season score
  const { data: allScores } = await supabase
    .from("scores")
    .select("total")
    .eq("user_id", user!.id);

  const seasonTotal = (allScores || []).reduce(
    (sum, s) => sum + ((s as { total: number }).total || 0),
    0
  );

  const [rankInfo, userLeagues] = await Promise.all([
    getUserRank(user!.id),
    getUserLeagues(user!.id),
  ]);

  // Get latest resolved week for Recent Results card
  const { data: latestResolved } = await supabase
    .from("weeks")
    .select("id, week_number")
    .eq("is_resolved", true)
    .order("week_number", { ascending: false })
    .limit(1)
    .single();

  let latestWeekScore: number | null = null;
  let latestWeekNumber: number | null = null;
  if (latestResolved) {
    latestWeekNumber = (latestResolved as { week_number: number }).week_number;
    const { data: weekScore } = await supabase
      .from("scores")
      .select("total")
      .eq("user_id", user!.id)
      .eq("week_id", (latestResolved as { id: number }).id)
      .single();
    if (weekScore) latestWeekScore = (weekScore as { total: number }).total;
  }

  return (
    <DashboardClient
      displayName={profile?.display_name as string | null}
      weekNumber={weekNumber}
      weekDeadline={weekDeadline}
      hasCurrentPrediction={hasCurrentPrediction}
      islanders={islanders}
      seasonPick={seasonPick}
      isSeasonPickLocked={isSeasonPickLocked}
      seasonTotal={seasonTotal}
      rankInfo={rankInfo}
      userLeagues={userLeagues}
      latestWeekNumber={latestWeekNumber}
      latestWeekScore={latestWeekScore}
    />
  );
}
