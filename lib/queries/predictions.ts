import { createClient } from "@/lib/supabase/server";
import type {
  Prediction,
  PredictedCouple,
  PredictedDumping,
  BonusAnswer,
  BonusQuestion,
  Week,
  Islander,
  ActualCouple,
  ActualDumping,
  SeasonWinnerPrediction,
} from "@/types/database";

export interface PredictionWithDetails {
  prediction: Prediction;
  couples: PredictedCouple[];
  dumpings: PredictedDumping[];
  bonusAnswers: (BonusAnswer & { question_text?: string })[];
}

export interface WeekPredictionView {
  week: Week;
  prediction: PredictionWithDetails | null;
  actualCouples: ActualCouple[];
  actualDumpings: ActualDumping[];
  bonusQuestions: BonusQuestion[];
}

export async function getUserPredictionForWeek(
  userId: string,
  weekId: number
): Promise<PredictionWithDetails | null> {
  const supabase = await createClient();

  const { data: prediction } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .eq("week_id", weekId)
    .single();

  if (!prediction) return null;

  const [couplesRes, dumpingsRes, answersRes] = await Promise.all([
    supabase
      .from("predicted_couples")
      .select("*")
      .eq("prediction_id", prediction.id),
    supabase
      .from("predicted_dumpings")
      .select("*")
      .eq("prediction_id", prediction.id),
    supabase
      .from("bonus_answers")
      .select("*, bonus_questions(question_text)")
      .eq("prediction_id", prediction.id),
  ]);

  return {
    prediction: prediction as Prediction,
    couples: (couplesRes.data || []) as PredictedCouple[],
    dumpings: (dumpingsRes.data || []) as PredictedDumping[],
    bonusAnswers: (
      (answersRes.data as unknown as (BonusAnswer & {
        bonus_questions: { question_text: string };
      })[]) || []
    ).map((a) => ({
      ...a,
      question_text: a.bonus_questions?.question_text,
    })),
  };
}

export async function getAllUserPredictions(
  userId: string
): Promise<WeekPredictionView[]> {
  const supabase = await createClient();

  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .order("week_number");

  if (!weeks) return [];

  const results: WeekPredictionView[] = [];

  for (const week of weeks as Week[]) {
    const prediction = await getUserPredictionForWeek(userId, week.id);

    const [actualCouplesRes, actualDumpingsRes, bonusRes] = await Promise.all([
      supabase
        .from("actual_couples")
        .select("*")
        .eq("week_id", week.id),
      supabase
        .from("actual_dumpings")
        .select("*")
        .eq("week_id", week.id),
      supabase
        .from("bonus_questions")
        .select("*")
        .eq("week_id", week.id),
    ]);

    results.push({
      week,
      prediction,
      actualCouples: (actualCouplesRes.data || []) as ActualCouple[],
      actualDumpings: (actualDumpingsRes.data || []) as ActualDumping[],
      bonusQuestions: (bonusRes.data || []) as BonusQuestion[],
    });
  }

  return results;
}

export async function getSeasonWinnerPrediction(
  userId: string
): Promise<SeasonWinnerPrediction | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("season_winner_predictions")
    .select("*")
    .eq("user_id", userId)
    .single();
  return (data as SeasonWinnerPrediction) || null;
}

export async function getActiveIslandersForWeek(
  weekId: number
): Promise<Islander[]> {
  const supabase = await createClient();
  // Get islanders that are active or bombshell and entered on or before this week
  const { data: week } = await supabase
    .from("weeks")
    .select("week_number")
    .eq("id", weekId)
    .single();

  if (!week) return [];

  const { data, error } = await supabase
    .from("islanders")
    .select("*")
    .in("status", ["active", "bombshell"])
    .lte("entered_week", (week as { week_number: number }).week_number)
    .order("name");

  if (error) throw error;
  return data as Islander[];
}
