import { createClient } from "@/lib/supabase/server";
import type { DailyBonusQuestion, DailyBonusAnswer } from "@/types/database";

/**
 * Get today's daily bonus question (if one exists).
 * Returns the question for today's date.
 */
export async function getTodaysDailyBonus(): Promise<DailyBonusQuestion | null> {
  try {
    const supabase = await createClient();

    // Get today in YYYY-MM-DD format (server time, should match CT)
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_bonus_questions")
      .select("*")
      .eq("episode_date", today)
      .single();

    if (error || !data) return null;
    return data as DailyBonusQuestion;
  } catch {
    // Table may not exist yet if migration hasn't been run
    return null;
  }
}

/**
 * Get the user's answer for a specific daily bonus question.
 */
export async function getUserDailyAnswer(
  userId: string,
  questionId: number
): Promise<DailyBonusAnswer | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("daily_bonus_answers")
      .select("*")
      .eq("question_id", questionId)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data as DailyBonusAnswer;
  } catch {
    return null;
  }
}

/**
 * Get all daily bonus questions for a given week (for admin + scoring).
 */
export async function getDailyBonusQuestionsForWeek(
  weekId: number
): Promise<DailyBonusQuestion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_bonus_questions")
    .select("*")
    .eq("week_id", weekId)
    .order("episode_date");

  if (error) throw error;
  return (data || []) as DailyBonusQuestion[];
}

/**
 * Get all daily bonus questions (for admin panel).
 */
export async function getAllDailyBonusQuestions(): Promise<
  (DailyBonusQuestion & { week_number?: number })[]
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("daily_bonus_questions")
      .select("*, weeks(week_number)")
      .order("episode_date", { ascending: false });

    if (error) return [];
    return (
      data as unknown as (DailyBonusQuestion & {
        weeks: { week_number: number };
      })[]
    ).map((q) => ({
      ...q,
      week_number: q.weeks?.week_number,
    }));
  } catch {
    return [];
  }
}

/**
 * Get all daily bonus answers for a user across a given week (for scoring).
 */
export async function getUserDailyAnswersForWeek(
  userId: string,
  weekId: number
): Promise<{ questionId: number; userAnswer: boolean }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("daily_bonus_answers")
    .select("question_id, user_answer, daily_bonus_questions!inner(week_id)")
    .eq("user_id", userId)
    .eq("daily_bonus_questions.week_id", weekId);

  if (error) return [];
  return (data as unknown as { question_id: number; user_answer: boolean }[]).map(
    (d) => ({
      questionId: d.question_id,
      userAnswer: d.user_answer,
    })
  );
}
