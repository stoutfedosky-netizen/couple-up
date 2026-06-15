export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getAllUserPredictions } from "@/lib/queries/predictions";
import { getAllIslanders } from "@/lib/queries/islanders";
import { PredictionHistory } from "./prediction-history";

export default async function PredictionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [weekPredictions, islanders] = await Promise.all([
    getAllUserPredictions(user!.id),
    getAllIslanders(),
  ]);

  // Also fetch scores for the user
  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", user!.id);

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-md mb-6">
          My Predictions
        </h1>

        <PredictionHistory
          weekPredictions={weekPredictions}
          islanders={islanders}
          scores={(scores || []) as { week_id: number; total: number; couple_pts: number; dump_pts: number; bonus_pts: number; perfect_bonus: number; streak_bonus: number }[]}
        />
      </div>
    </div>
  );
}
